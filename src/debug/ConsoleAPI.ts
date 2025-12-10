// ABOUTME: Console API for testing the game from browser console
// ABOUTME: Provides commands like clickHex(), playCard(), pressButton(), status(), help()

import {GameState} from "../domain/GameState";
import {UIState, BattleTarget} from "../ui/UIState";
import {HexCoord} from "../utils/hex";
import {BOARD_GEOMETRY} from "../domain/BoardGeometry";
import {PhaseType} from "../domain/phases/Phase";
import {
    PlayCardMove,
    OrderUnitMove,
    UnOrderMove,
    RetreatMove
} from "../domain/moves/Move";
import {MoveUnitMove} from "../domain/moves/MoveUnitMove";
import {BattleMove} from "../domain/moves/BattleMove";
import {TakeGroundMove} from "../domain/moves/TakeGroundMove";
import {MovePhase} from "../domain/phases/MovePhase";
import {BattlePhase} from "../domain/phases/BattlePhase";
import {RetreatPhase} from "../domain/phases/RetreatPhase";
import {TakeGroundPhase} from "../domain/phases/TakeGroundPhase";
import {Unit} from "../domain/Unit";

interface CommandResult {
    success: boolean;
    message: string;
}

export class ConsoleAPI {
    constructor(
        private gameState: GameState,
        private uiState: UIState,
        private renderCallback: () => Promise<void>
    ) {}

    /**
     * Display all available console commands with examples
     */
    help(): void {
        console.log(`
%c🎮 Memoir '44 Console API - Available Commands

%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

%cBasic Commands:

  %cgame.help()%c
    Show this help message

  %cgame.status()%c
    Show current game status and all available moves with console commands
    Perfect for AI agents to know what to do next!

  %cgame.clickHex(q, r)%c
    Click on a hex at coordinates (q, r)
    Context-aware: orders units, moves, battles based on current phase
    Examples:
      game.clickHex(5, 3)    // Order unit at (5, 3)
      game.clickHex(6, 3)    // Move selected unit to (6, 3)

  %cgame.playCard(cardId)%c
    Play a command card by its ID
    Example:
      game.playCard("card-01")

  %cgame.pressButton(label)%c
    Press a UI button by its label text
    Examples:
      game.pressButton("Confirm Orders")
      game.pressButton("End Movements")
      game.pressButton("End Battles")

%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

%cTips:
  - Coordinates use (q, r) format where q is column, r is row
  - Use the hover display on the board to see hex coordinates
  - Most commands return { success, message } objects
  - Commands automatically trigger re-rendering

`,
            'color: #4CAF50; font-weight: bold; font-size: 16px',
            'color: #666',
            'color: #2196F3; font-weight: bold',
            'color: #FF9800; font-family: monospace', 'color: inherit',
            'color: #FF9800; font-family: monospace', 'color: inherit',
            'color: #FF9800; font-family: monospace', 'color: inherit',
            'color: #FF9800; font-family: monospace', 'color: inherit',
            'color: #666',
            'color: #9E9E9E; font-style: italic'
        );
    }

    /**
     * Display current game status and available moves with console commands
     */
    status(): void {
        const currentPhase = this.gameState.activePhase;
        const legalMoves = this.gameState.legalMoves();
        const allUnits = this.gameState.getAllUnitsWithPositions();

        console.log(`
%c📊 Game Status
%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

%cCurrent Phase: %c${currentPhase.name}
%cActive Player: %c${this.gameState.activePlayer}

%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`,
            'color: #4CAF50; font-weight: bold; font-size: 16px',
            'color: #666',
            'color: #2196F3; font-weight: bold', `color: #FF9800`,
            'color: #2196F3; font-weight: bold', `color: #FF9800`,
            'color: #666'
        );

        // Categorize moves
        const playCardMoves = legalMoves.filter(m => m instanceof PlayCardMove) as PlayCardMove[];
        const orderMoves = legalMoves.filter(m => m instanceof OrderUnitMove) as OrderUnitMove[];
        const unOrderMoves = legalMoves.filter(m => m instanceof UnOrderMove) as UnOrderMove[];
        const moveMoves = legalMoves.filter(m => m instanceof MoveUnitMove) as MoveUnitMove[];
        const battleMoves = legalMoves.filter(m => m instanceof BattleMove) as BattleMove[];
        const retreatMoves = legalMoves.filter(m => m instanceof RetreatMove) as RetreatMove[];
        const takeGroundMoves = legalMoves.filter(m => m instanceof TakeGroundMove) as TakeGroundMove[];

        // Get button moves
        const buttonMoves: Array<{label: string, move: any}> = [];
        legalMoves.forEach(move => {
            const buttons = move.uiButton();
            buttons.forEach(btn => {
                buttonMoves.push({label: btn.label, move});
            });
        });

        // Display available moves by category
        if (playCardMoves.length > 0) {
            console.log(`%c🃏 Play Card (${playCardMoves.length} available)`, 'color: #9C27B0; font-weight: bold');
            playCardMoves.forEach(m => {
                console.log(`  %cgame.playCard("${m.card.id}")%c  // ${m.card.name}`,
                    'color: #FF9800; font-family: monospace', 'color: inherit');
            });
            console.log('');
        }

        if (orderMoves.length > 0) {
            console.log(`%c✓ Order Units (${orderMoves.length} available)`, 'color: #4CAF50; font-weight: bold');
            orderMoves.forEach(m => {
                const coord = allUnits.find(({unit}) => unit.id === m.unit.id)?.coord;
                if (coord) {
                    console.log(`  %cgame.clickHex(${coord.q}, ${coord.r})%c  // Order ${m.unit.type} at (${coord.q}, ${coord.r})`,
                        'color: #FF9800; font-family: monospace', 'color: inherit');
                }
            });
            console.log('');
        }

        if (unOrderMoves.length > 0) {
            console.log(`%c✗ Unorder Units (${unOrderMoves.length} available)`, 'color: #F44336; font-weight: bold');
            unOrderMoves.forEach(m => {
                const coord = allUnits.find(({unit}) => unit.id === m.unit.id)?.coord;
                if (coord) {
                    console.log(`  %cgame.clickHex(${coord.q}, ${coord.r})%c  // Unorder ${m.unit.type} at (${coord.q}, ${coord.r})`,
                        'color: #FF9800; font-family: monospace', 'color: inherit');
                }
            });
            console.log('');
        }

        if (moveMoves.length > 0) {
            console.log(`%c➜ Move Units (${moveMoves.length} moves available)`, 'color: #2196F3; font-weight: bold');
            // Group by source unit
            const movesByUnit = new Map<string, MoveUnitMove[]>();
            moveMoves.forEach(m => {
                const key = `${m.from.q},${m.from.r}`;
                if (!movesByUnit.has(key)) {
                    movesByUnit.set(key, []);
                }
                movesByUnit.get(key)!.push(m);
            });

            movesByUnit.forEach((moves, key) => {
                const [q, r] = key.split(',').map(Number);
                const unit = this.gameState.getUnitAt(new HexCoord(q, r));
                const destinations = moves.map(m => `(${m.to.q}, ${m.to.r})`).join(', ');
                console.log(`  %cgame.clickHex(${q}, ${r})%c  // Select ${unit?.type} - can move to: ${destinations}`,
                    'color: #FF9800; font-family: monospace', 'color: inherit');
            });
            console.log('  %cThen click destination hex to complete move', 'color: #9E9E9E; font-style: italic');
            console.log('');
        }

        if (battleMoves.length > 0) {
            console.log(`%c⚔️ Battle (${battleMoves.length} attacks available)`, 'color: #F44336; font-weight: bold');
            // Group by attacking unit
            const battlesByUnit = new Map<string, BattleMove[]>();
            battleMoves.forEach(m => {
                const coord = allUnits.find(({unit}) => unit.id === m.fromUnit.id)?.coord;
                if (coord) {
                    const key = `${coord.q},${coord.r}`;
                    if (!battlesByUnit.has(key)) {
                        battlesByUnit.set(key, []);
                    }
                    battlesByUnit.get(key)!.push(m);
                }
            });

            battlesByUnit.forEach((battles, key) => {
                const [q, r] = key.split(',').map(Number);
                const attacker = battles[0].fromUnit;
                const targets = battles.map(b => {
                    const targetCoord = allUnits.find(({unit}) => unit.id === b.toUnit.id)?.coord;
                    return targetCoord ? `(${targetCoord.q}, ${targetCoord.r})` : '?';
                }).join(', ');
                console.log(`  %cgame.clickHex(${q}, ${r})%c  // Select ${attacker.type} - can attack: ${targets}`,
                    'color: #FF9800; font-family: monospace', 'color: inherit');
            });
            console.log('  %cThen click target hex to attack', 'color: #9E9E9E; font-style: italic');
            console.log('');
        }

        if (retreatMoves.length > 0) {
            console.log(`%c⬅️ Retreat (${retreatMoves.length} destinations available)`, 'color: #FF5722; font-weight: bold');
            retreatMoves.forEach(m => {
                console.log(`  %cgame.clickHex(${m.to.q}, ${m.to.r})%c  // Retreat to (${m.to.q}, ${m.to.r})`,
                    'color: #FF9800; font-family: monospace', 'color: inherit');
            });
            console.log('');
        }

        if (takeGroundMoves.length > 0) {
            console.log(`%c⬆️ Take Ground (${takeGroundMoves.length} destinations available)`, 'color: #4CAF50; font-weight: bold');
            takeGroundMoves.forEach(m => {
                console.log(`  %cgame.clickHex(${m.toHex.q}, ${m.toHex.r})%c  // Advance to (${m.toHex.q}, ${m.toHex.r})`,
                    'color: #FF9800; font-family: monospace', 'color: inherit');
            });
            console.log('');
        }

        if (buttonMoves.length > 0) {
            console.log(`%c🔘 Phase Control Buttons (${buttonMoves.length} available)`, 'color: #607D8B; font-weight: bold');
            // Deduplicate buttons by label
            const uniqueButtons = new Map<string, string>();
            buttonMoves.forEach(({label}) => {
                if (!uniqueButtons.has(label.toLowerCase())) {
                    uniqueButtons.set(label.toLowerCase(), label);
                }
            });
            uniqueButtons.forEach((label) => {
                console.log(`  %cgame.pressButton("${label}")`,
                    'color: #FF9800; font-family: monospace');
            });
            console.log('');
        }

        if (legalMoves.length === 0) {
            console.log(`%c⚠️ No legal moves available`, 'color: #FF5722; font-weight: bold');
            console.log('');
        }

        console.log(`%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

%cUI State:
  Selected Unit: %c${this.uiState.selectedUnit ? `${this.uiState.selectedUnit.type} at (${this.uiState.selectedUnitLocation?.q}, ${this.uiState.selectedUnitLocation?.r})` : 'None'}
`,
            'color: #666',
            'color: #2196F3; font-weight: bold',
            'color: #FF9800'
        );
    }

    /**
     * Click on a hex - phase-aware behavior
     */
    clickHex(q: number, r: number): CommandResult {
        const hexCoord = new HexCoord(q, r);

        // Validate hex is on board
        if (!this.validateHex(hexCoord)) {
            return {
                success: false,
                message: `Invalid hex coordinates (${q}, ${r}). Not on board.`
            };
        }

        const currentPhase = this.gameState.activePhase;

        try {
            if (currentPhase.type === PhaseType.ORDER) {
                return this.handleOrderingClick(hexCoord);
            } else if (currentPhase instanceof TakeGroundPhase) {
                return this.handleTakeGroundClick(hexCoord);
            } else if (currentPhase instanceof MovePhase) {
                return this.handleMovementClick(hexCoord);
            } else if (currentPhase instanceof BattlePhase) {
                return this.handleBattleClick(hexCoord);
            } else if (currentPhase instanceof RetreatPhase) {
                return this.handleRetreatClick(hexCoord);
            } else {
                return {
                    success: false,
                    message: `Cannot click hexes during ${currentPhase.name} phase`
                };
            }
        } catch (error) {
            return {
                success: false,
                message: `Error: ${(error as Error).message}`
            };
        }
    }

    /**
     * Play a card by ID
     */
    playCard(cardId: string): CommandResult {
        const moves = this.gameState.legalMoves();
        const playCardMove = moves.find(
            (m) => m instanceof PlayCardMove && m.card.id === cardId
        );

        if (!playCardMove) {
            const availableCards = moves
                .filter(m => m instanceof PlayCardMove)
                .map(m => (m as PlayCardMove).card);

            if (availableCards.length === 0) {
                return {
                    success: false,
                    message: `No cards available to play in current phase`
                };
            }

            const cardsList = availableCards
                .map(c => `${c.id} (${c.name})`)
                .join(', ');

            return {
                success: false,
                message: `Card '${cardId}' not found or not playable. Available cards: ${cardsList}`
            };
        }

        const cardName = (playCardMove as PlayCardMove).card.name;
        this.executeAndRender(playCardMove);
        return {
            success: true,
            message: `Played card: ${cardName}`
        };
    }

    /**
     * Press a UI button by label
     */
    pressButton(label: string): CommandResult {
        const moves = this.gameState.legalMoves();
        const allButtons: Array<{label: string, move: any}> = [];

        moves.forEach(move => {
            const buttons = move.uiButton();
            buttons.forEach(btn => {
                allButtons.push({label: btn.label, move});
            });
        });

        const matchingButton = allButtons.find(btn =>
            btn.label.toLowerCase() === label.toLowerCase()
        );

        if (!matchingButton) {
            if (allButtons.length === 0) {
                return {
                    success: false,
                    message: `No buttons available in current phase`
                };
            }

            const buttonList = allButtons.map(b => b.label).join(', ');
            return {
                success: false,
                message: `Button '${label}' not found. Available buttons: ${buttonList}`
            };
        }

        // Execute the button's callback
        const uiButton = matchingButton.move.uiButton().find(
            (b: any) => b.label.toLowerCase() === label.toLowerCase()
        );

        if (uiButton) {
            uiButton.callback(this.gameState);
            this.renderCallback().catch(err => console.error("Render error:", err));
            return {
                success: true,
                message: `Pressed button: ${label}`
            };
        }

        return {
            success: false,
            message: `Failed to execute button: ${label}`
        };
    }

    // ============================================================================
    // Private helper methods
    // ============================================================================

    /**
     * Validate that a hex is on the board
     */
    private validateHex(hex: HexCoord): boolean {
        return BOARD_GEOMETRY.contains(hex);
    }

    /**
     * Execute a move and trigger re-render
     * Note: We don't await renderCallback to avoid Puppeteer serialization issues
     */
    private executeAndRender(move: any): void {
        this.gameState.executeMove(move);
        // Call render asynchronously but don't await to avoid serialization issues
        this.renderCallback().catch(err => console.error("Render error:", err));
    }

    /**
     * Find the location of a unit on the board
     */
    private findUnitLocation(unit: Unit): HexCoord | null {
        const allUnits = this.gameState.getAllUnitsWithPositions();
        const found = allUnits.find(({unit: u}) => u.id === unit.id);
        return found ? found.coord : null;
    }

    // ============================================================================
    // Phase-specific click handlers (mirroring CanvasClickHandler logic)
    // ============================================================================

    /**
     * Handle clicks during ORDER phase
     */
    private handleOrderingClick(hexCoord: HexCoord): CommandResult {
        const unit = this.gameState.getUnitAt(hexCoord);

        if (!unit) {
            return {
                success: false,
                message: `No unit at (${hexCoord.q}, ${hexCoord.r})`
            };
        }

        const moves = this.gameState.legalMoves();
        const orderMove = moves.find(
            (m) => (m instanceof OrderUnitMove || m instanceof UnOrderMove) && m.unit.id === unit.id
        );

        if (!orderMove) {
            return {
                success: false,
                message: `Cannot order unit at (${hexCoord.q}, ${hexCoord.r})`
            };
        }

        const isOrder = orderMove instanceof OrderUnitMove;
        this.executeAndRender(orderMove);

        if (isOrder) {
            return {
                success: true,
                message: `Ordered unit at (${hexCoord.q}, ${hexCoord.r})`
            };
        } else {
            return {
                success: true,
                message: `Unordered unit at (${hexCoord.q}, ${hexCoord.r})`
            };
        }
    }

    /**
     * Handle clicks during MOVE phase (two-click pattern)
     */
    private handleMovementClick(hexCoord: HexCoord): CommandResult {
        const unit = this.gameState.getUnitAt(hexCoord);
        const legalMoves = this.gameState.legalMoves();

        // Check if clicking on the currently selected unit - deselect it
        if (this.uiState.selectedUnit && this.uiState.selectedUnitLocation &&
            hexCoord.q === this.uiState.selectedUnitLocation.q &&
            hexCoord.r === this.uiState.selectedUnitLocation.r) {
            this.uiState.clearSelection();
            this.renderCallback().catch(err => console.error("Render error:", err));
            return {
                success: true,
                message: `Deselected unit at (${hexCoord.q}, ${hexCoord.r})`
            };
        }

        // Check if clicking on a valid destination for selected unit
        if (this.uiState.selectedUnit && this.uiState.isDestinationValid(hexCoord)) {
            const selectedUnitLocation = this.findUnitLocation(this.uiState.selectedUnit);

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
                    const fromQ = selectedUnitLocation.q;
                    const fromR = selectedUnitLocation.r;
                    this.executeAndRender(moveToExecute);
                    this.uiState.clearSelection();
                    return {
                        success: true,
                        message: `Moved unit from (${fromQ}, ${fromR}) to (${hexCoord.q}, ${hexCoord.r})`
                    };
                }
            }
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
                const destCount = destinations.length;
                this.uiState.selectUnit(unit, hexCoord, destinations);
                this.renderCallback().catch(err => console.error("Render error:", err));
                return {
                    success: true,
                    message: `Selected unit at (${hexCoord.q}, ${hexCoord.r}). ${destCount} possible destinations.`
                };
            }
        }

        // Clicked elsewhere - clear selection
        this.uiState.clearSelection();
        this.renderCallback().catch(err => console.error("Render error:", err));
        return {
            success: false,
            message: `No valid action at (${hexCoord.q}, ${hexCoord.r})`
        };
    }

    /**
     * Handle clicks during BATTLE phase (two-click pattern)
     */
    private handleBattleClick(hexCoord: HexCoord): CommandResult {
        const unit = this.gameState.getUnitAt(hexCoord);
        const legalMoves = this.gameState.legalMoves();

        // Check if clicking on a valid battle target for selected unit
        if (this.uiState.selectedUnit && this.uiState.isBattleTargetValid(hexCoord)) {
            const targetUnit = this.gameState.getUnitAt(hexCoord);

            if (targetUnit) {
                const battleMove = legalMoves.find(
                    (m) =>
                        m instanceof BattleMove &&
                        m.fromUnit.id === this.uiState.selectedUnit!.id &&
                        m.toUnit.id === targetUnit.id
                ) as BattleMove | undefined;

                if (battleMove) {
                    const diceCount = battleMove.dice;
                    this.executeAndRender(battleMove);
                    this.uiState.clearSelection();
                    return {
                        success: true,
                        message: `Attacked unit at (${hexCoord.q}, ${hexCoord.r}) with ${diceCount} dice`
                    };
                }
            }
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

                const targetCount = targets.length;
                this.uiState.selectAttackingUnit(unit, hexCoord, targets);
                this.renderCallback().catch(err => console.error("Render error:", err));
                return {
                    success: true,
                    message: `Selected attacking unit at (${hexCoord.q}, ${hexCoord.r}). ${targetCount} possible targets.`
                };
            }
        }

        // Clicked elsewhere - clear selection
        this.uiState.clearSelection();
        this.renderCallback().catch(err => console.error("Render error:", err));
        return {
            success: false,
            message: `No valid battle action at (${hexCoord.q}, ${hexCoord.r})`
        };
    }

    /**
     * Handle clicks during RETREAT phase
     */
    private handleRetreatClick(hexCoord: HexCoord): CommandResult {
        if (!this.uiState.isRetreatHexValid(hexCoord)) {
            return {
                success: false,
                message: `(${hexCoord.q}, ${hexCoord.r}) is not a valid retreat destination`
            };
        }

        const legalMoves = this.gameState.legalMoves();
        const retreatMove = legalMoves.find(
            m => m instanceof RetreatMove &&
                 m.to.q === hexCoord.q &&
                 m.to.r === hexCoord.r
        ) as RetreatMove | undefined;

        if (retreatMove) {
            this.executeAndRender(retreatMove);
            this.uiState.clearSelection();
            return {
                success: true,
                message: `Retreated to (${hexCoord.q}, ${hexCoord.r})`
            };
        }

        return {
            success: false,
            message: `Failed to retreat to (${hexCoord.q}, ${hexCoord.r})`
        };
    }

    /**
     * Handle clicks during TAKE_GROUND phase
     */
    private handleTakeGroundClick(hexCoord: HexCoord): CommandResult {
        const legalMoves = this.gameState.legalMoves();
        const takeGroundMove = legalMoves.find(
            m => m instanceof TakeGroundMove &&
                 m.toHex.q === hexCoord.q &&
                 m.toHex.r === hexCoord.r
        ) as TakeGroundMove | undefined;

        if (takeGroundMove) {
            this.executeAndRender(takeGroundMove);
            this.uiState.clearSelection();
            return {
                success: true,
                message: `Advanced to (${hexCoord.q}, ${hexCoord.r})`
            };
        }

        return {
            success: false,
            message: `Cannot take ground at (${hexCoord.q}, ${hexCoord.r})`
        };
    }
}
