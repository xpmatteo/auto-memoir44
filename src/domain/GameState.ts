// ABOUTME: Main game state with GameState pattern implementation
// ABOUTME: All game logic flows through legalMoves() and executeMove()

import {createPlayer, Player, Position, Side} from "./Player";
import {Deck} from "./Deck";
import {Move, PlayCardMove} from "./Move";
import {Unit, coordToKey, keyToCoord} from "./Unit";
import type {HexCoord} from "../utils/hex";
import {CardLocation, CommandCard} from "./CommandCard";
import {isHexInSection, Section} from "./Section";

export class GameState {
    private readonly players: [Player, Player];
    private activePlayerIndex: 0 | 1;
    private readonly deck: Deck;
    private unitPositions: Map<string, Unit>; // Map from coordinate key to Unit
    private currentCardId: string | null; // Currently selected card ID
    private orderedUnits: Set<Unit>; // Set of units that have been ordered this turn

    constructor(
        deck: Deck,
    ) {
        this.deck = deck;
        this.players = [createPlayer(Side.ALLIES, Position.BOTTOM), createPlayer(Side.AXIS, Position.TOP)];
        this.activePlayerIndex = 0;
        this.unitPositions = new Map<string, Unit>();
        this.currentCardId = null;
        this.orderedUnits = new Set<Unit>();
    }

    get activePlayer(): Player {
        return this.players[this.activePlayerIndex];
    }

    /**
     * Returns all valid moves for the active player
     */
    legalMoves(): Move[] {
        let location = (this.activePlayerIndex == 0) ? CardLocation.BOTTOM_PLAYER_HAND : CardLocation.TOP_PLAYER_HAND;
        return this.deck.getCardsInLocation(location).map(card => new PlayCardMove(card));
    }

    /**
     * Applies a move and updates state
     */
    executeMove(move: Move): void {
        move.execute(this);
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
            .filter(([_, unit]) => this.orderedUnits.has(unit))
            .map(([key, unit]) => ({
                coord: keyToCoord(key),
                unit,
            }));
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

    orderAllFriendlyUnitsInSection(section: Section): void {
        const activePlayer = this.activePlayer;
        const allUnitsWithPositions = this.getAllUnitsWithPositions();

        for (const {coord, unit} of allUnitsWithPositions) {
            // Only order units owned by the active player
            if (unit.owner !== activePlayer.side) {
                continue;
            }

            // Check if unit is in the target section
            if (isHexInSection(coord, section, activePlayer.position)) {
                this.orderedUnits.add(unit);
            }
        }
    }

    /**
     * Get the current card, or null if none is selected
     */
    getCurrentCard(): CommandCard | null {
        if (this.currentCardId === null) {
            return null;
        }
        return this.deck.getCard(this.currentCardId) ?? null;
    }

    /**
     * Check if a unit has been ordered this turn
     */
    isUnitOrdered(unit: Unit): boolean {
        return this.orderedUnits.has(unit);
    }

    switchActivePlayer() {
        this.activePlayerIndex = this.activePlayerIndex == 0 ? 1 : 0;
    }

    drawCards(howMany: number, toLocation: CardLocation) {
        for (let i = 0; i < howMany; i++) {
            this.deck.drawCard(toLocation)
        }
    }

    getCardsInLocation(location: CardLocation) {
        return this.deck.getCardsInLocation(location);
    }

    getOrderedUnits() {
        return [...this.orderedUnits.values()];
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
}
