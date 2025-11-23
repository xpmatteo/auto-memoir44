// ABOUTME: Main game state with GameState pattern implementation
// ABOUTME: All game logic flows through legalMoves() and executeMove()

import {createPlayer, Player, Position, Side} from "./Player";
import {Deck} from "./Deck";
import {Move} from "./Move";
import {Unit, coordToKey, keyToCoord} from "./Unit";
import type {HexCoord} from "../utils/hex";
import {CardLocation, CommandCard} from "./CommandCard";
import {isHexInSection, Section} from "./Section";
import {Phase} from "./phases/Phase";
import {PlayCardPhase} from "./phases/PlayCardPhase";
import {BOARD_GEOMETRY} from "./BoardGeometry";

export class GameState {
    private readonly players: [Player, Player];
    private activePlayerIndex: 0 | 1;
    private readonly deck: Deck;
    private unitPositions: Map<string, Unit>; // Map from coordinate key to Unit
    private currentCardId: string | null; // Currently selected card ID
    private orderedUnits: Set<Unit>; // Set of units that have been ordered this turn
    private movedUnits: Set<Unit>; // Set of units that have moved this turn
    private unitsCannotBattle: Set<Unit>; // Set of units that cannot battle this turn (moved 2 hexes)
    private phases: Array<Phase>;

    constructor(
        deck: Deck,
    ) {
        this.deck = deck;
        this.players = [createPlayer(Side.ALLIES, Position.BOTTOM), createPlayer(Side.AXIS, Position.TOP)];
        this.activePlayerIndex = 0;
        this.unitPositions = new Map<string, Unit>();
        this.currentCardId = null;
        this.orderedUnits = new Set<Unit>();
        this.movedUnits = new Set<Unit>();
        this.unitsCannotBattle = new Set<Unit>();
        this.phases = new Array<Phase>();
        this.phases.push(new PlayCardPhase());
    }

    // -- getters used in the UI
    get activePlayer(): Player {
        return this.players[this.activePlayerIndex];
    }

    get activePhase(): Phase {
        if (this.phases.length === 0) {
            throw Error("Phases stack empty");
        }
        return this.phases[this.phases.length - 1];
    }

    /**
     * Get the current card, or null if none is selected
     */
    get activeCard(): CommandCard | null {
        if (this.currentCardId === null) {
            return null;
        }
        return this.deck.getCard(this.currentCardId);
    }

    getCardsInLocation(location: CardLocation) {
        return this.deck.getCardsInLocation(location);
    }


    // -- GameState pattern
    /**
     * Returns all valid moves for the active player
     */
    legalMoves(): Move[] {
        return this.activePhase.legalMoves(this);
    }

    /**
     * Applies a move and updates state
     */
    executeMove(move: Move): void {
        move.execute(this);
    }

    // -- Commands used when setting up the game
    switchActivePlayer() {
        this.activePlayerIndex = this.activePlayerIndex == 0 ? 1 : 0;
    }

    drawCards(howMany: number, toLocation: CardLocation) {
        for (let i = 0; i < howMany; i++) {
            this.deck.drawCard(toLocation)
        }
    }

    /**
     * Place a unit at a coordinate. Throws if coordinate is occupied or off-board.
     */
    placeUnit(coord: HexCoord, unit: Unit): void {
        if (!BOARD_GEOMETRY.contains(coord)) {
            throw new Error(
                `Cannot place unit at (${coord.q}, ${coord.r}): coordinate is outside board boundaries`
            );
        }
        const key = coordToKey(coord);
        if (this.unitPositions.has(key)) {
            throw new Error(
                `Cannot place unit at (${coord.q}, ${coord.r}): coordinate already occupied`
            );
        }
        this.unitPositions.set(key, unit);
    }


    // -- Unit getters
    /**
     * Get the unit at a specific coordinate, or undefined if empty
     */
    getUnitAt(coord: HexCoord): Unit | undefined {
        return this.unitPositions.get(coordToKey(coord));
    }

    /**
     * Get all units with their coordinates
     */
    getAllUnitsWithPositions(): Array<{ coord: HexCoord; unit: Unit }> {
        return Array.from(this.unitPositions.entries()).map(([key, unit]) => ({
            coord: keyToCoord(key),
            unit,
        }));
    }

    /**
     * Get all ordered units with their coordinates
     */
    getOrderedUnitsWithPositions(): Array<{ coord: HexCoord; unit: Unit }> {
        return Array.from(this.unitPositions.entries())
            .filter(([_, unit]) => this.orderedUnits.has(unit))
            .map(([key, unit]) => ({
                coord: keyToCoord(key),
                unit,
            }));
    }

    getFriendlyUnitsInSection(section: Section): Array<Unit> {
        return this.getAllUnitsWithPositions()
            .filter(({coord}) =>
                isHexInSection(coord, section, this.activePlayer.position))
            .filter(({unit}) => unit.side == this.activePlayer.side)
            .map(({unit}) => unit);
    }

    getOrderedUnits(): Array<Unit> {
        return [...this.orderedUnits.values()];
    }

    /**
     * Check if a unit has been ordered this turn
     */
    isUnitOrdered(unit: Unit): boolean {
        return this.orderedUnits.has(unit);
    }

    /**
     * Check if a unit has moved this turn
     */
    isUnitMoved(unit: Unit): boolean {
        return this.movedUnits.has(unit);
    }

    /**
     * Mark a unit as having moved this turn
     */
    markUnitMoved(unit: Unit): void {
        this.movedUnits.add(unit);
    }

    /**
     * Mark a unit as unable to battle this turn (moved 2 hexes)
     */
    markUnitCannotBattle(unit: Unit): void {
        this.unitsCannotBattle.add(unit);
    }

    /**
     * Check if a unit can battle this turn
     */
    canUnitBattle(unit: Unit): boolean {
        return !this.unitsCannotBattle.has(unit);
    }

    // -- Commands used by CommandCards

    // popPhase ends the current phase and starts the next phase, or the next player turn.
    // Moves that must end a phase will call this.
    popPhase() {
        if (this.phases.length === 0) {
            throw Error("Phases stack is empty");
        }
        this.phases.pop();
        // End of player turn?
        if (this.phases.length === 0) {
            // Move the played card to discard pile
            if (this.currentCardId !== null) {
                this.deck.moveCard(this.currentCardId, CardLocation.DISCARD_PILE);
                this.currentCardId = null;
            }

            // Draw replacement card for the player who just finished
            const handLocation = this.activePlayer.position === Position.BOTTOM
                ? CardLocation.BOTTOM_PLAYER_HAND
                : CardLocation.TOP_PLAYER_HAND;
            this.deck.drawCard(handLocation);

            // Clear ordered units for next turn
            this.orderedUnits.clear();
            this.movedUnits.clear();
            this.unitsCannotBattle.clear();

            // Switch to next player and start their turn
            this.switchActivePlayer();
            this.pushPhase(new PlayCardPhase());
        }
    }

    pushPhase(phase: Phase) {
        this.phases.push(phase);
    }

    replacePhase(phase: Phase) {
        this.phases.pop();
        this.phases.push(phase);
    }

    /**
     * Set the current card. Throws if a card is already selected.
     * Orders units based on the card type and section.
     *
     * @internal This method should ONLY be called from CommandCard.onCardPlayed().
     * UI code must use executeMove(PlayCardMove) instead of calling this directly.
     */
    setCurrentCard(cardId: string): void {
        if (this.currentCardId !== null) {
            throw new Error(
                `Cannot select card: a card is already selected (${this.currentCardId}). Clear the current card first.`
            );
        }
        this.currentCardId = cardId;

        // Get the card from the deck
        const card = this.deck.getCard(cardId);
        if (!card) {
            throw new Error(`Card ${cardId} not found in deck`);
        }
    }

    // -- Commands used by Moves

    /**
     * Move a unit from one coordinate to another. Throws if destination is occupied or off-board.
     */
    moveUnit(from: HexCoord, to: HexCoord): void {
        const fromKey = coordToKey(from);
        const toKey = coordToKey(to);

        const unit = this.unitPositions.get(fromKey);
        if (!unit) {
            throw new Error(`No unit at (${from.q}, ${from.r}) to move`);
        }

        if (!BOARD_GEOMETRY.contains(to)) {
            throw new Error(
                `Cannot move unit to (${to.q}, ${to.r}): coordinate is outside board boundaries`
            );
        }

        if (this.unitPositions.has(toKey)) {
            throw new Error(
                `Cannot move unit to (${to.q}, ${to.r}): coordinate already occupied`
            );
        }

        this.unitPositions.delete(fromKey);
        this.unitPositions.set(toKey, unit);
    }

    /**
     * Remove a unit from the board
     */
    removeUnit(coord: HexCoord): void {
        this.unitPositions.delete(coordToKey(coord));
    }

    toggleUnitOrdered(unit: Unit) {
        // Check if this unit exists in the game by searching through all placed units
        const unitExists = Array.from(this.unitPositions.values()).some(u => u.id === unit.id);
        if (!unitExists) {
            throw new Error(`Unknown unit "${unit.id}"`)
        }
        if (this.orderedUnits.has(unit)) {
            this.orderedUnits.delete(unit);
        } else {
            this.orderedUnits.add(unit);
        }
    }

    orderAllFriendlyUnitsInSection(section: Section): void {
        const activePlayer = this.activePlayer;
        const allUnitsWithPositions = this.getAllUnitsWithPositions();

        for (const {coord, unit} of allUnitsWithPositions) {
            // Only order units owned by the active player
            if (unit.side !== activePlayer.side) {
                continue;
            }

            // Check if unit is in the target section
            if (isHexInSection(coord, section, activePlayer.position)) {
                this.orderedUnits.add(unit);
            }
        }
    }

}
