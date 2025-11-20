// ABOUTME: Main game state with GameState pattern implementation
// ABOUTME: All game logic flows through legalMoves() and executeMove()

import {createPlayer, Player, Position, Side} from "./Player";
import {Deck} from "./Deck";
import {Move, SelectCard} from "./Move";
import {Unit, coordToKey, keyToCoord} from "./Unit";
import type {HexCoord} from "../utils/hex";
import {CardLocation} from "./CommandCard";
import {isHexInSection, Section} from "./Section";

export class GameState {
    private readonly players: [Player, Player];
    private activePlayerIndex: 0 | 1;
    private readonly deck: Deck;
    private unitPositions: Map<string, Unit>; // Map from coordinate key to Unit
    private currentCardId: string | null; // Currently selected card ID
    private orderedUnits: Set<string>; // Set of unit IDs that have been ordered this turn

    constructor(
        deck: Deck,
    ) {
        this.deck = deck;
        this.players = [createPlayer(Side.ALLIES, Position.BOTTOM), createPlayer(Side.AXIS, Position.TOP)];
        this.activePlayerIndex = 0;
        this.unitPositions = new Map<string, Unit>();
        this.currentCardId = null;
        this.orderedUnits = new Set<string>();
    }

    get activePlayer(): Player {
        return this.players[this.activePlayerIndex];
    }

    /**
     * Get the deck
     */
    getDeck(): Deck {
        return this.deck;
    }

    /**
     * Get the active player index
     */
    getActivePlayerIndex(): 0 | 1 {
        return this.activePlayerIndex;
    }

    /**
     * Get the unit at a specific coordinate, or undefined if empty
     */
    getUnitAt(coord: HexCoord): Unit | undefined {
        return this.unitPositions.get(coordToKey(coord));
    }

    /**
     * Place a unit at a coordinate. Throws if coordinate is occupied.
     */
    placeUnit(coord: HexCoord, unit: Unit): void {
        const key = coordToKey(coord);
        if (this.unitPositions.has(key)) {
            throw new Error(
                `Cannot place unit at (${coord.q}, ${coord.r}): coordinate already occupied`
            );
        }
        this.unitPositions.set(key, unit);
    }

    /**
     * Move a unit from one coordinate to another. Throws if destination is occupied.
     */
    moveUnit(from: HexCoord, to: HexCoord): void {
        const fromKey = coordToKey(from);
        const toKey = coordToKey(to);

        const unit = this.unitPositions.get(fromKey);
        if (!unit) {
            throw new Error(`No unit at (${from.q}, ${from.r}) to move`);
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
            .filter(([_key, unit]) => this.orderedUnits.has(unit.id))
            .map(([key, unit]) => ({
                coord: keyToCoord(key),
                unit,
            }));
    }

    /**
     * Set the current card. Throws if a card is already selected.
     * Orders units based on the card type and section.
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

        // Determine which section to order based on card name
        let targetSection: Section | null = null;
        if (card.name.includes("Left")) {
            targetSection = Section.LEFT;
        } else if (card.name.includes("Center")) {
            targetSection = Section.CENTER;
        } else if (card.name.includes("Right")) {
            targetSection = Section.RIGHT;
        }

        // If this is a section card, order units in that section
        if (targetSection !== null) {
            this.orderUnitsInSection(targetSection);
        }
    }

    /**
     * Order all friendly units in the specified section
     */
    private orderUnitsInSection(section: Section): void {
        const activePlayer = this.activePlayer;
        const allUnitsWithPositions = this.getAllUnitsWithPositions();

        for (const {coord, unit} of allUnitsWithPositions) {
            // Only order units owned by the active player
            if (unit.owner !== activePlayer.side) {
                continue;
            }

            // Check if unit is in the target section
            if (isHexInSection(coord, section, activePlayer.position)) {
                this.orderedUnits.add(unit.id);
            }
        }
    }

    /**
     * Get the current card, or null if none is selected
     */
    getCurrentCard(): string | null {
        return this.currentCardId;
    }

    /**
     * Clear the current card selection
     */
    clearCurrentCard(): void {
        this.currentCardId = null;
    }

    /**
     * Check if a unit has been ordered this turn
     */
    isUnitOrdered(unit: Unit): boolean {
        return this.orderedUnits.has(unit.id);
    }

    /**
     * Returns all valid moves for the active player
     * TODO: Implement actual move generation logic
     */
    legalMoves(): Move[] {
        let location = (this.activePlayerIndex == 0) ? CardLocation.BOTTOM_PLAYER_HAND : CardLocation.TOP_PLAYER_HAND;
        return this.deck.getCardsInLocation(location).map(card => new SelectCard(card));
    }

    /**
     * Applies a move and updates state
     * TODO: Implement actual move execution logic
     */
    executeMove(_move: Move): void {
        // Placeholder for move execution
    }

    switchActivePlayer() {
        this.activePlayerIndex = this.activePlayerIndex == 0 ? 1 : 0;
    }

    drawCard(howMany: number, toLocation: CardLocation) {
        for (let i = 0; i < howMany; i++) {
            this.deck.drawCard(toLocation)
        }
    }
}
