// ABOUTME: Entry point for Memoir '44 browser game
// ABOUTME: Bootstraps canvas, rendering, and event handling

// Log page loads for debugging
console.log(`[${new Date().toISOString()}] Page loaded/reloaded`);

import "./style.css";
import type {GridConfig} from "./utils/hex.js";
import {toCanvasCoords, pixelToHex} from "./utils/hex.js";
import {loadBoardImage, drawBoard} from "./ui/canvas/BoardRenderer.js";
import {
    drawGrid,
    drawOrderedUnitOutlines,
    drawSelectedUnit,
    drawValidDestinations,
    drawBattleUnitOutlines,
    drawBattleTargets
} from "./ui/canvas/HexGrid.js";
import {drawUnits} from "./ui/canvas/UnitRenderer.js";
import {loadScenario, getDefaultScenario} from "./scenarios/index.js";
import {HandDisplay} from "./ui/components/HandDisplay.js";
import {CurrentCardDisplay} from "./ui/components/CurrentCardDisplay.js";
import {MoveButtons} from "./ui/components/MoveButtons.js";
import {GameState} from "./domain/GameState.js";
import {Deck} from "./domain/Deck.js";
import {CanvasClickHandler} from "./ui/input/CanvasClickHandler.js";
import {uiState} from "./ui/UIState.js";
import {BattleMove} from "./domain/Move.js";
import {SeededRNG} from "./adapters/RNG.js";
import {Dice} from "./domain/Dice.js";

const BOARD_IMAGE_PATH = "/images/boards/memoir-desert-map.jpg";
const BOARD_WIDTH = 2007;
const BOARD_HEIGHT = 1417;

const defaultGrid: GridConfig = {
    cols: 13,
    rows: 9,
    hexRadius: 87.7,
    originX: 90,
    originY: 182,
    lineWidth: 2.5,
    strokeStyle: "rgba(0, 255, 255, 0.72)",
    showCoords: false,
    coordColor: "rgba(0, 0, 0, 0.85)"
};

function createCanvas(): HTMLCanvasElement {
    const canvas = document.createElement("canvas");
    canvas.className = "board-canvas";
    canvas.width = BOARD_WIDTH;
    canvas.height = BOARD_HEIGHT;
    return canvas;
}

function createBoardWrapper(canvas: HTMLCanvasElement, overlay: HTMLDivElement): HTMLDivElement {
    const wrapper = document.createElement("div");
    wrapper.className = "board-wrapper";
    wrapper.appendChild(canvas);
    wrapper.appendChild(overlay);
    return wrapper;
}

function createGameStateFromURL(): GameState {
    const params = new URLSearchParams(window.location.search);
    const scenarioCode = params.get("scenario");
    const seedParam = params.get("seed");

    // Create RNG from seed (or random if no seed provided)
    const seed = seedParam ? parseInt(seedParam, 10) : undefined;
    const rng = new SeededRNG(seed);
    console.log(`RNG initialized with seed: ${rng.getSeed()}`);

    // Create dice with RNG
    const dice = new Dice(() => rng.random());

    // Create base game state with deck and dice
    const deck = Deck.createStandardDeck();
    const gameState = new GameState(deck, dice);

    // Load and setup scenario
    let scenario;
    if (scenarioCode) {
        try {
            scenario = loadScenario(scenarioCode);
        } catch (error) {
            console.warn(`Failed to load scenario '${scenarioCode}':`, error);
            console.warn("Falling back to default scenario");
            scenario = getDefaultScenario();
        }
    } else {
        scenario = getDefaultScenario();
    }

    scenario.setup(gameState);
    return gameState;
}


async function start() {
    const app = document.querySelector<HTMLDivElement>("#app");
    if (!app) {
        // Fail fast if root is missing.
        throw new Error("App root not found");
    }

    // Create game state and initialize with scenario
    const gameState = createGameStateFromURL();

    const canvas = createCanvas();
    const overlay = createOverlay();
    const wrapper = createBoardWrapper(canvas, overlay);

    // Create current card display
    const currentCardDisplay = new CurrentCardDisplay(gameState);

    // Create move buttons component
    const moveButtons = new MoveButtons(gameState);

    // Create a container for the current card display and the board
    const gameBoardContainer = document.createElement("div");
    gameBoardContainer.id = "game-board-container";
    gameBoardContainer.appendChild(currentCardDisplay.getElement());
    gameBoardContainer.appendChild(wrapper);

    // Mount move buttons before the game board (at top)
    moveButtons.mount(app);
    app.appendChild(gameBoardContainer);

    // Create and mount hand display
    const handDisplay = new HandDisplay(gameState);

    const context = canvas.getContext("2d");
    if (!context) {
        throw new Error("Canvas rendering context unavailable");
    }

    // Load board image once
    const boardImage = await loadBoardImage(BOARD_IMAGE_PATH);

    // Create render function for canvas
    const renderCanvas = async () => {
        try {
            drawBoard(context, boardImage);
            drawGrid(context, defaultGrid);

            // Prepare units with current strength for rendering
            const unitsWithStrength = gameState.getAllUnitsWithPositions().map(({coord, unit}) => ({
                coord,
                unit,
                currentStrength: gameState.getUnitCurrentStrength(unit)
            }));
            await drawUnits(context, unitsWithStrength, defaultGrid);

            // Draw outlines around ordered units
            const orderedUnits = gameState.getOrderedUnitsWithPositions();
            const orderedCoords = orderedUnits.map(({coord}) => coord);
            drawOrderedUnitOutlines(context, orderedCoords, defaultGrid);

            // Draw battle-ready unit outlines during BattlePhase
            if (gameState.activePhase.name === "Battle") {
                const legalMoves = gameState.legalMoves();
                const battleMoves = legalMoves.filter(m => m instanceof BattleMove) as BattleMove[];
                const battleUnits = new Set(battleMoves.map(m => m.fromUnit));
                const battleCoords = gameState.getAllUnitsWithPositions()
                    .filter(({unit}) => battleUnits.has(unit))
                    .map(({coord}) => coord);
                drawBattleUnitOutlines(context, battleCoords, defaultGrid);
            }

            // Draw valid destination highlights
            if (uiState.validDestinations.length > 0) {
                drawValidDestinations(context, uiState.validDestinations, defaultGrid);
            }

            // Draw battle target highlights with dice indicators
            if (uiState.validBattleTargets.length > 0) {
                drawBattleTargets(context, uiState.validBattleTargets, defaultGrid);
            }

            // Draw selected unit highlight
            if (uiState.selectedUnitLocation) {
                drawSelectedUnit(context, uiState.selectedUnitLocation, defaultGrid);
            }

            // Draw grid labels on top of units for clarity
            drawGrid(context, {...defaultGrid, strokeStyle: "transparent", lineWidth: 0});
        } catch (error) {
            context.fillStyle = "#b22222";
            context.font = "16px sans-serif";
            context.fillText((error as Error).message, 20, 30);
        }
    };

    // Set up reactive rendering function that updates both UI and canvas
    const renderAll = async () => {
        handDisplay.render();
        currentCardDisplay.render();
        moveButtons.render();
        await renderCanvas();
    };

    // Set callback for card clicks to trigger re-render
    handDisplay.setOnCardClick(renderAll);

    // Set callback for move button clicks to trigger re-render
    moveButtons.setOnButtonClick(renderAll);

    // Initial render
    await renderAll();

    app.appendChild(handDisplay.getElement());

    applyResponsiveSizing(canvas);
    window.addEventListener("resize", () => applyResponsiveSizing(canvas));

    attachHoverDisplay(canvas, overlay, defaultGrid, gameState, renderAll);
}

function applyResponsiveSizing(canvas: HTMLCanvasElement) {
    // Preserve aspect ratio while fitting within viewport with some breathing room.
    const padding = 24;
    const handDisplayAllowance = 190; // Hand display: 150px cards + 40px padding
    const maxWidth = Math.max(200, window.innerWidth - padding * 2);
    const maxHeight = Math.max(200, window.innerHeight - padding * 2 - handDisplayAllowance);
    const scale = Math.min(1, maxWidth / BOARD_WIDTH, maxHeight / BOARD_HEIGHT);
    canvas.style.width = `${BOARD_WIDTH * scale}px`;
    canvas.style.height = `${BOARD_HEIGHT * scale}px`;
}

function attachHoverDisplay(
    canvas: HTMLCanvasElement,
    overlay: HTMLDivElement,
    grid: GridConfig,
    gameState: GameState,
    renderAll: () => void
) {
    const updateOverlay = (coords?: string) => {
        const phaseName = gameState.activePhase.name;
        overlay.textContent = coords ? `Phase: ${phaseName} | ${coords}` : `Phase: ${phaseName}`;
    };

    // Show phase name initially
    updateOverlay();

    canvas.addEventListener("mousemove", (event) => {
        const {x, y} = toCanvasCoords(event, canvas);
        const {q, r} = pixelToHex(x, y, grid);
        updateOverlay(`q=${q}, r=${r}`);
    });

    canvas.addEventListener("mouseleave", () => {
        updateOverlay();
    });

    // Set up canvas click handler for unit ordering
    const clickHandler = new CanvasClickHandler(canvas, gameState, grid, renderAll);
    clickHandler.attach();
}

function createOverlay(): HTMLDivElement {
    const overlay = document.createElement("div");
    overlay.className = "hover-overlay";
    overlay.textContent = "";
    return overlay;
}

start();
