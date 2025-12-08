// ABOUTME: Canvas click handler for unit ordering and movement interactions
// ABOUTME: Converts click coordinates to unit selection and executes moves (phase-aware)

import type {GameState} from "../../domain/GameState.js";
import type {GridConfig} from "../../utils/hex.js";
import type {Unit} from "../../domain/Unit.js";
import {toCanvasCoords, pixelToHex, HexCoord} from "../../utils/hex.js";
import {OrderUnitMove, UnOrderMove, RetreatMove} from "../../domain/moves/Move";
import {PhaseType} from "../../domain/phases/Phase.js";
import {MovePhase} from "../../domain/phases/MovePhase.js";
import {BattlePhase} from "../../domain/phases/BattlePhase.js";
import {RetreatPhase} from "../../domain/phases/RetreatPhase.js";
import {TakeGroundPhase} from "../../domain/phases/TakeGroundPhase.js";
import {uiState, BattleTarget} from "../UIState.js";
import {MoveUnitMove} from "../../domain/moves/MoveUnitMove";
import {BattleMove} from "../../domain/moves/BattleMove";
import {TakeGroundMove} from "../../domain/moves/TakeGroundMove";

export class CanvasClickHandler {
    private boundHandler: (event: MouseEvent) => void;

    constructor(
        private canvas: HTMLCanvasElement,
        private gameState: GameState,
        private grid: GridConfig,
        private onUpdate: () => void
    ) {
        this.boundHandler = this.handleClick.bind(this);
    }

    /**
     * Handle click events on the canvas
     * Phase-aware: handles unit ordering in ORDER phases, movement in MovePhase, battle in BattlePhase
     */
    handleClick(event: MouseEvent): void {
        const canvasCoord = toCanvasCoords(event, this.canvas);
        const hexCoord = pixelToHex(canvasCoord.x, canvasCoord.y, this.grid);
        const currentPhase = this.gameState.activePhase;

        if (currentPhase.type === PhaseType.ORDER) {
            this.handleOrderingClick(hexCoord);
        } else if (currentPhase instanceof TakeGroundPhase) {
            this.handleTakeGroundClick(hexCoord);
        } else if (currentPhase instanceof MovePhase) {
            this.handleMovementClick(hexCoord);
        } else if (currentPhase instanceof BattlePhase) {
            this.handleBattleClick(hexCoord);
        } else if (currentPhase instanceof RetreatPhase) {
            this.handleRetreatClick(hexCoord);
        }
    }

    /**
     * Handle clicks during OrderUnitsPhase
     * Orders or unorders units when clicking on them
     */
    private handleOrderingClick(hexCoord: HexCoord): void {
        const unit = this.gameState.getUnitAt(hexCoord);

        if (unit) {
            const moves = this.gameState.legalMoves();
            const orderMove = moves.find(
                (m) => (m instanceof OrderUnitMove || m instanceof UnOrderMove) && m.unit.id === unit.id
            );

            if (orderMove) {
                this.gameState.executeMove(orderMove);
                this.onUpdate();
            }
        }
    }

    /**
     * Handle clicks during MovePhase
     * Two-click flow: select unit -> select destination -> execute move
     */
    private handleMovementClick(hexCoord: HexCoord): void {
        const unit = this.gameState.getUnitAt(hexCoord);
        const legalMoves = this.gameState.legalMoves();

        // Check if clicking on the currently selected unit - deselect it
        if (uiState.selectedUnit && uiState.selectedUnitLocation &&
            hexCoord.q === uiState.selectedUnitLocation.q &&
            hexCoord.r === uiState.selectedUnitLocation.r) {
            uiState.clearSelection();
            this.onUpdate();
            return;
        }

        // Check if clicking on a valid destination for selected unit
        if (uiState.selectedUnit && uiState.isDestinationValid(hexCoord)) {
            // Find the selected unit's location in the game state
            const selectedUnitLocation = this.findUnitLocation(uiState.selectedUnit);

            if (selectedUnitLocation) {
                const moveToExecute = legalMoves.find(
                    (m) =>
                        m instanceof MoveUnitMove &&
                        m.from.q === selectedUnitLocation.q &&
                        m.from.r === selectedUnitLocation.r &&
                        m.to.q === hexCoord.q &&
                        m.to.r === hexCoord.r
                ) as MoveUnitMove | undefined;

                if (moveToExecute) {
                    this.gameState.executeMove(moveToExecute);
                    uiState.clearSelection();
                    this.onUpdate();
                }
            }
            return;
        }

        // Check if clicking on an ordered unit that can move
        if (unit && this.gameState.isUnitOrdered(unit) && !this.gameState.isUnitMoved(unit)) {
            const validMovesForUnit = legalMoves.filter(
                (m) =>
                    m instanceof MoveUnitMove &&
                    m.from.q === hexCoord.q &&
                    m.from.r === hexCoord.r
            ) as MoveUnitMove[];

            if (validMovesForUnit.length > 0) {
                const destinations = validMovesForUnit.map((m) => m.to);
                uiState.selectUnit(unit, hexCoord, destinations);
                this.onUpdate();
            }
            return;
        }

        // Clicked elsewhere - clear selection
        uiState.clearSelection();
        this.onUpdate();
    }

    /**
     * Handle clicks during BattlePhase
     * Two-click flow: select attacking unit -> select target -> execute battle
     */
    private handleBattleClick(hexCoord: HexCoord): void {
        const unit = this.gameState.getUnitAt(hexCoord);
        const legalMoves = this.gameState.legalMoves();

        // Check if clicking on a valid battle target for selected unit
        if (uiState.selectedUnit && uiState.isBattleTargetValid(hexCoord)) {
            const targetUnit = this.gameState.getUnitAt(hexCoord);

            if (targetUnit) {
                // Find the matching BattleMove
                const battleMove = legalMoves.find(
                    (m) =>
                        m instanceof BattleMove &&
                        m.fromUnit.id === uiState.selectedUnit!.id &&
                        m.toUnit.id === targetUnit.id
                ) as BattleMove | undefined;

                if (battleMove) {
                    this.gameState.executeMove(battleMove);
                    uiState.clearSelection();
                    this.onUpdate();
                }
            }
            return;
        }

        // Check if clicking on an ordered unit that can battle
        if (unit && this.gameState.isUnitOrdered(unit) && !this.gameState.unitSkipsBattle(unit)) {
            const validBattlesForUnit = legalMoves.filter(
                (m) => m instanceof BattleMove && m.fromUnit.id === unit.id
            ) as BattleMove[];

            if (validBattlesForUnit.length > 0) {
                // Extract target units and find their coordinates
                const allUnits = this.gameState.getAllUnitsWithPositions();
                const targets: BattleTarget[] = validBattlesForUnit.map((battleMove) => {
                    const targetPosition = allUnits.find(
                        ({unit: u}) => u.id === battleMove.toUnit.id
                    );
                    if (!targetPosition) {
                        throw new Error(`Could not find position for target unit ${battleMove.toUnit.id}`);
                    }
                    return {
                        coord: targetPosition.coord,
                        dice: battleMove.dice,
                    };
                });

                uiState.selectAttackingUnit(unit, hexCoord, targets);
                this.onUpdate();
            }
            return;
        }

        // Clicked elsewhere - clear selection
        uiState.clearSelection();
        this.onUpdate();
    }

    /**
     * Handle clicks during RetreatPhase
     * Single-click flow: click on valid retreat hex -> execute retreat
     */
    private handleRetreatClick(hexCoord: HexCoord): void {
        // Check if clicking on a valid retreat hex
        if (!uiState.isRetreatHexValid(hexCoord)) {
            uiState.clearSelection();
            this.onUpdate();
            return;
        }

        // Find matching RetreatMove from legalMoves
        const legalMoves = this.gameState.legalMoves();
        const retreatMove = legalMoves.find(
            m => m instanceof RetreatMove &&
                 m.to.q === hexCoord.q &&
                 m.to.r === hexCoord.r
        ) as RetreatMove | undefined;

        if (retreatMove) {
            this.gameState.executeMove(retreatMove);
            uiState.clearSelection();
            this.onUpdate();
        }
    }

    /**
     * Handle clicks during TakeGroundPhase
     * Single-click flow: click on vacated hex -> advance
     */
    private handleTakeGroundClick(hexCoord: HexCoord): void {
        // Find matching TakeGroundMove from legalMoves
        const legalMoves = this.gameState.legalMoves();
        const takeGroundMove = legalMoves.find(
            m => m instanceof TakeGroundMove &&
                 m.toHex.q === hexCoord.q &&
                 m.toHex.r === hexCoord.r
        ) as TakeGroundMove | undefined;

        if (takeGroundMove) {
            this.gameState.executeMove(takeGroundMove);
            uiState.clearSelection();
            this.onUpdate();
        }
    }

    /**
     * Find the location of a unit on the board
     */
    private findUnitLocation(unit: Unit): HexCoord | null {
        const allUnits = this.gameState.getAllUnitsWithPositions();
        const found = allUnits.find(({unit: u}) => u.id === unit.id);
        return found ? found.coord : null;
    }

    /**
     * Attach this handler to the canvas
     */
    attach(): void {
        this.canvas.addEventListener("click", this.boundHandler);
    }

    /**
     * Detach this handler from the canvas
     */
    detach(): void {
        this.canvas.removeEventListener("click", this.boundHandler);
    }
}
