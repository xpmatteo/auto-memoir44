// ABOUTME: Main game state with GameState pattern implementation
// ABOUTME: All game logic flows through legalMoves() and executeMove()

import {createPlayer, Player, Position, Side} from "./Player";
import {Deck} from "./Deck";
import {GameVictoryMove, Move} from "./moves/Move";
import {Unit, UnitState} from "./Unit";
import {HexCoord} from "../utils/hex";
import {CardLocation, CommandCard} from "./CommandCard";
import {Section} from "./Section";
import {Phase} from "./phases/Phase";
import {Dice, DiceResult} from "./Dice";
import {Terrain} from "./terrain/Terrain";
import {TerrainMap} from "./TerrainMap";
import {Board} from "./Board";
import {Fortification} from "./fortifications/Fortification";
import {FortificationMap} from "./FortificationMap";
import {ScoreTracker} from "./ScoreTracker";
import {TurnCoordinator} from "./TurnCoordinator";

export class GameState {
    private readonly deck: Deck;
    private readonly dice: Dice;
    private readonly turnCoordinator: TurnCoordinator;
    private readonly players: [Player, Player];
    private activeCardId: string | null; // Currently played card ID
    private readonly board: Board;
    private readonly scoreTracker: ScoreTracker;
    private readonly terrainMap: TerrainMap;
    private readonly fortificationMap: FortificationMap;

    constructor(
        deck: Deck,
        dice: Dice = new Dice(),
    ) {
        this.deck = deck;
        this.dice = dice;
        this.players = [createPlayer(Side.ALLIES, Position.BOTTOM), createPlayer(Side.AXIS, Position.TOP)];
        this.turnCoordinator = new TurnCoordinator();
        this.board = new Board();
        this.scoreTracker = new ScoreTracker();
        this.terrainMap = new TerrainMap();
        this.fortificationMap = new FortificationMap();
        this.activeCardId = null;
    }

    // -- getters used in the UI
    get activePlayer(): Player {
        // Check if active phase has temporary player switch enabled
        if (this.activePhase.temporaryPlayerSwitch) {
            // Return the opposite player
            const oppositeIndex = this.turnCoordinator.getActivePlayerIndex() === 0 ? 1 : 0;
            return this.players[oppositeIndex];
        }
        return this.players[this.turnCoordinator.getActivePlayerIndex()];
    }

    get activePlayerHand(): CardLocation {
        return this.turnCoordinator.getActivePlayerIndex() === 0 ? CardLocation.BOTTOM_PLAYER_HAND : CardLocation.TOP_PLAYER_HAND;
    }

    get sideTop() {
        return this.players[1].side;
    }

    get sideBottom() {
        return this.players[0].side;
    }

    get activePhase(): Phase {
        return this.turnCoordinator.activePhase;
    }

    /**
     * Get the current card, or null if none is selected
     */
    get activeCard(): CommandCard | null {
        if (this.activeCardId === null) {
            return null;
        }
        return this.deck.getCard(this.activeCardId);
    }

    getCardsInLocation(location: CardLocation) {
        return this.deck.getCardsInLocation(location);
    }

    setPrerequisiteNumberOfMedals(medals: number): void {
        this.scoreTracker.setPrerequisiteNumberOfMedals(medals);
    }

    setTerrain(hex: HexCoord, terrain: Terrain) {
        this.terrainMap.set(hex, terrain);
    }

    getTerrain(hex: HexCoord): Terrain {
        return this.terrainMap.get(hex);
    }

    forAllTerrain(callbackfn: (terrain: Terrain, hex: HexCoord) => void) {
        this.terrainMap.forEach(callbackfn);
    }

    setFortification(hex: HexCoord, fortification: Fortification): void {
        this.fortificationMap.set(hex, fortification);
    }

    getFortification(hex: HexCoord): Fortification {
        return this.fortificationMap.get(hex);
    }

    removeFortification(hex: HexCoord): void {
        this.fortificationMap.remove(hex);
    }

    forAllFortifications(callbackfn: (fortification: Fortification, hex: HexCoord) => void): void {
        this.fortificationMap.forEach(callbackfn);
    }

    /**
     * Finalize game setup by freezing the terrain map.
     * After this is called, terrain cannot be modified.
     * This should be called by scenarios after all terrain is placed.
     * Why? Because clone() does a shallow copy of terrainMap.
     */
    finishSetup(): void {
        this.terrainMap.freeze();
    }


    // -- GameState pattern
    /**
     * Check if any player has won by reaching the prerequisite number of medals
     * @returns GameVictoryMove if a player has won, null otherwise
     */
    private checkVictory(): GameVictoryMove | null {
        return this.scoreTracker.checkVictory(this.players);
    }

    /**
     * Returns all valid moves for the active player
     */
    legalMoves(): Move[] {
        // Check victory condition first
        const victory = this.checkVictory();
        if (victory) {
            return [victory];
        }

        // Otherwise, delegate to active phase
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
        this.turnCoordinator.switchActivePlayer();
    }

    drawCards(howMany: number, toLocation: CardLocation) {
        for (let i = 0; i < howMany; i++) {
            this.deck.drawCard(toLocation)
        }
    }

    drawSpecificCard(cardId: string, toLocation: CardLocation) {
        this.deck.moveCard(cardId, toLocation);
    }

    discardCard(cardId: string) {
        this.deck.moveCard(cardId, CardLocation.DISCARD_PILE);
    }

    /**
     * Place a unit at a coordinate. Throws if coordinate is occupied or off-board.
     */
    placeUnit(coord: HexCoord, unit: Unit): void {
        this.board.placeUnit(coord, unit);
    }


    // -- Unit getters
    /**
     * Get the unit at a specific coordinate, or undefined if empty
     */
    getUnitAt(coord: HexCoord): Unit | undefined {
        return this.board.getUnitAt(coord);
    }

    /**
     * Get all units with their coordinates
     */
    getAllUnitsWithPositions(): Array<{ coord: HexCoord; unit: Unit }> {
        return this.board.getAllUnitsWithPositions();
    }

    /**
     * Get all units with their coordinates, terrain, and mutable state
     */
    getAllUnits(): Array<{ unit: Unit; coord: HexCoord; terrain: Terrain; unitState: UnitState }> {
        return this.board.getAllUnits((coord) => this.getTerrain(coord));
    }

    /**
     * Get all ordered units with their coordinates
     */
    getOrderedUnitsWithPositions(): Array<{ coord: HexCoord; unit: Unit }> {
        return this.board.getOrderedUnitsWithPositions();
    }

    getFriendlyUnits(): Array<Unit> {
        return this.board.getFriendlyUnits(this.activePlayer.side);
    }

    getFriendlyUnitsInSection(section: Section): Array<Unit> {
        return this.board.getFriendlyUnitsInSection(section, this.activePlayer.side, this.activePlayer.position);
    }

    getUnitSections(unit: Unit): Section[] {
        return this.board.getUnitSections(unit, this.activePlayer.position);
    }

    getOrderedUnits(): Array<Unit> {
        return this.board.getOrderedUnits();
    }

    /**
     * Check if a unit has been ordered this turn
     */
    isUnitOrdered(unit: Unit): boolean {
        return this.board.isUnitOrdered(unit);
    }

    /**
     * Check if a unit has moved this turn
     */
    isUnitMoved(unit: Unit): boolean {
        return this.board.isUnitMoved(unit);
    }

    /**
     * Mark a unit as having moved this turn
     */
    markUnitMoved(unit: Unit): void {
        this.board.markUnitMoved(unit);
    }

    /**
     * Remove mark
     */
    unMarkUnitMoved(unit: Unit): void {
        this.board.unMarkUnitMoved(unit);
    }

    /**
     * Mark a unit to skip battle this turn (moved 2 hexes)
     */
    markUnitSkipsBattle(unit: Unit): void {
        this.board.markUnitSkipsBattle(unit);
    }

    /**
     * Remove mark
     */
    unMarkUnitSkipsBattle(unit: Unit): void {
        this.board.unMarkUnitSkipsBattle(unit);
    }

    /**
     * Check if a unit skips battle this turn
     */
    unitSkipsBattle(unit: Unit): boolean {
        return this.board.unitSkipsBattle(unit);
    }

    /**
     * Increment the number of battles a unit has participated in this turn
     */
    incrementUnitBattlesThisTurn(unit: Unit): void {
        this.board.incrementUnitBattlesThisTurn(unit);
    }

    /**
     * Get the number of battles a unit has participated in this turn
     */
    getUnitBattlesThisTurn(unit: Unit): number {
        return this.board.getUnitBattlesThisTurn(unit);
    }

    /**
     * Get the current strength of a unit
     */
    getUnitCurrentStrength(u: Unit): number {
        return this.board.getUnitCurrentStrength(u);
    }

    /**
     * Set the current strength of a unit
     */
    setUnitCurrentStrength(unit: Unit, strength: number): void {
        this.board.setUnitCurrentStrength(unit, strength);
    }

    /**
     * Add an eliminated unit to a player's medal table
     * @param unit The unit that was eliminated
     * @param capturingPlayerIndex Index of the player who captured the unit (0=Bottom, 1=Top)
     */
    addToMedalTable(unit: Unit, capturingPlayerIndex: 0 | 1): void {
        this.scoreTracker.addMedal(unit, capturingPlayerIndex);
    }

    /**
     * Get a player's medal table
     */
    getMedalTable(playerIndex: 0 | 1): Unit[] {
        return this.scoreTracker.getMedalTable(playerIndex);
    }

    /**
     * Roll the specified number of dice for combat
     */
    rollDice(count: number): DiceResult[] {
        const results = this.dice.roll(count);
        console.log(`Rolled ${count} dice:`, results.map(r => r.name).join(', '));
        return results;
    }

    // -- Commands used by CommandCards

    // popPhase ends the current phase and starts the next phase, or the next player turn.
    // Moves that must end a phase will call this.
    popPhase() {
        const { turnEnded } = this.turnCoordinator.popPhase();

        // Clear turn state for all units when turn ends
        if (turnEnded) {
            this.board.clearAllUnitTurnState();
        }
    }

    pushPhase(phase: Phase) {
        this.turnCoordinator.pushPhase(phase);
    }

    replacePhase(phase: Phase) {
        this.turnCoordinator.replacePhase(phase);
    }

    peekCards(n: number): Array<CommandCard> {
        return this.deck.peekCards(n);
    }

    peekOneCard(): CommandCard {
        return this.deck.peekOneCard();
    }

    /**
     * Set the current card. Throws if a card is already selected.
     * Orders units based on the card type and section.
     *
     * @internal This method should ONLY be called from CommandCard.onCardPlayed().
     * UI code must use executeMove(PlayCardMove) instead of calling this directly.
     */
    setCurrentCard(cardId: string): void {
        if (this.activeCardId !== null) {
            throw new Error(
                `Cannot select card: a card is already selected (${this.activeCardId}). Clear the current card first.`
            );
        }
        this.activeCardId = cardId;

        // Get the card from the deck
        const card = this.deck.getCard(cardId);
        if (!card) {
            throw new Error(`Card ${cardId} not found in deck`);
        }
    }

    // -- Commands used by Moves

    /**
     * Move a unit from one coordinate to another. Throws if destination is occupied or off-board.
     * Calls onUnitMoving() on any fortification at the source hex to handle removal behavior.
     */
    moveUnit(from: HexCoord, to: HexCoord): void {
        this.board.moveUnit(from, to);

        // Let the fortification decide what to do when unit moves away
        const fortification = this.getFortification(from);
        fortification.onUnitMoving(this, from);
    }

    /**
     * Remove a unit from the board
     */
    removeUnit(coord: HexCoord): void {
        this.board.removeUnit(coord);
    }

    toggleUnitOrdered(unit: Unit) {
        this.board.toggleUnitOrdered(unit);
    }

    orderUnit(unit: Unit) {
        this.board.orderUnit(unit);
    }

    unOrderUnit(unit: Unit) {
        this.board.unOrderUnit(unit);
    }

    orderAllFriendlyUnitsInSection(section: Section): void {
        this.board.orderAllFriendlyUnitsInSection(section, this.activePlayer.side, this.activePlayer.position);
    }

    discardActiveCard() {
        if (this.activeCardId !== null) {
            this.deck.moveCard(this.activeCardId, CardLocation.DISCARD_PILE);
            this.activeCardId = null;
        }
    }

    /**
     * Create a deep clone of this GameState for AI simulation
     * The clone is fully independent and can execute moves without affecting the original
     */
    clone(): GameState {
        // Create new GameState with cloned deck and dice
        const cloned = new GameState(this.deck.clone(), this.dice.clone());

        // Clone simple properties
        cloned.activeCardId = this.activeCardId;

        // Clone players tuple (Players are immutable, shallow copy is safe)
        cloned.players[0] = this.players[0];
        cloned.players[1] = this.players[1];

        // Clone turn coordinator (phase stack and active player index)
        (cloned as any).turnCoordinator = this.turnCoordinator.clone();

        // Clone board (deep clone of unit positions and states)
        (cloned as any).board = this.board.clone();

        // Clone score tracker (deep clone with medal tables)
        (cloned as any).scoreTracker = this.scoreTracker.clone();

        // Share frozen terrain map (terrain is immutable after freeze(), safe to share)
        // Use type assertion to bypass readonly modifier
        (cloned as any).terrainMap = this.terrainMap;

        // Clone fortification map (fortifications are mutable, need deep clone)
        (cloned as any).fortificationMap = this.fortificationMap.clone();

        return cloned;
    }

    positionOf(unit: Unit): Position {
        if (unit.side == this.players[0].side)
            return Position.BOTTOM;
        if (unit.side == this.players[1].side)
            return Position.TOP;
        throw new Error(`Unknown player side: ${unit.side}`);
    }

    // Experimental; not used yet
    reverseBoard() {
        let temp = this.players[0];
        this.players[0] = this.players[1];
        this.players[1] = temp;
    }
}
