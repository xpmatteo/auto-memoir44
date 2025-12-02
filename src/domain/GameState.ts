// ABOUTME: Main game state with GameState pattern implementation
// ABOUTME: All game logic flows through legalMoves() and executeMove()

import {createPlayer, Player, Position, Side} from "./Player";
import {Deck} from "./Deck";
import {GameVictoryMove, Move} from "./Move";
import {Unit, UnitState, coordToKey, keyToCoord} from "./Unit";
import {HexCoord} from "../utils/hex";
import {CardLocation, CommandCard} from "./CommandCard";
import {isHexInSection, Section} from "./Section";
import {Phase} from "./phases/Phase";
import {PlayCardPhase} from "./phases/PlayCardPhase";
import {BOARD_GEOMETRY} from "./BoardGeometry";
import {Dice, DiceResult} from "./Dice";
import {Terrain, clearTerrain} from "./terrain/Terrain";

export class GameState {
    private readonly deck: Deck;
    private readonly dice: Dice;
    private readonly phases: Array<Phase>;
    private readonly players: [Player, Player];
    private activePlayerIndex: 0 | 1;
    private activeCardId: string | null; // Currently played card ID
    private unitPositions: Map<string, Unit>; // Map from coordinate key to Unit
    private units: Map<string, Unit>; // Map from unit ID to unit
    private unitStates: Map<string, UnitState>; // Map from unit ID to unit state
    private readonly medalTables: [Unit[], Unit[]]; // Eliminated units by capturing player (0=Bottom, 1=Top)
    private readonly terrain: Map<string, Terrain>;
    private setupFinished: boolean = false; // True after finishSetup() is called
    private prerequisiteNumberOfMedals = 4;

    constructor(
        deck: Deck,
        dice: Dice = new Dice(),
    ) {
        this.deck = deck;
        this.dice = dice;
        this.players = [createPlayer(Side.ALLIES, Position.BOTTOM), createPlayer(Side.AXIS, Position.TOP)];
        this.activePlayerIndex = 0;
        this.unitPositions = new Map<string, Unit>();
        this.units = new Map<string, Unit>();
        this.unitStates = new Map<string, UnitState>();
        this.medalTables = [[], []];
        this.terrain = new Map<string, Terrain>();
        this.activeCardId = null;
        this.phases = new Array<Phase>();
        this.phases.push(new PlayCardPhase());
    }

    // -- getters used in the UI
    get activePlayer(): Player {
        return this.players[this.activePlayerIndex];
    }

    get activePlayerHand(): CardLocation {
        return this.activePlayerIndex === 0 ? CardLocation.BOTTOM_PLAYER_HAND : CardLocation.TOP_PLAYER_HAND;
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
        if (this.activeCardId === null) {
            return null;
        }
        return this.deck.getCard(this.activeCardId);
    }

    getCardsInLocation(location: CardLocation) {
        return this.deck.getCardsInLocation(location);
    }

    setPrerequisiteNumberOfMedals(medals: number): void {
        this.prerequisiteNumberOfMedals = medals;
    }

    setTerrain(hex: HexCoord, terrain : Terrain) {
        if (this.setupFinished) {
            throw new Error("Cannot modify terrain after finishSetup() has been called");
        }
        this.terrain.set(coordToKey(hex), terrain);
    }

    getTerrain(hex: HexCoord): Terrain {
        const key = coordToKey(hex);
        if (!this.terrain.has(key)) {
            return clearTerrain;
        }
        return this.terrain.get(key)!;
    }

    forAllTerrain(callbackfn: (terrain: Terrain, hex: HexCoord) => void) {
        this.terrain.forEach((terrain: Terrain, key: string)=> callbackfn(terrain, keyToCoord(key)))
    }

    /**
     * Finalize game setup by freezing the terrain map.
     * After this is called, terrain cannot be modified.
     * This should be called by scenarios after all terrain is placed.
     */
    finishSetup(): void {
        this.setupFinished = true;
        Object.freeze(this.terrain);
    }


    // -- GameState pattern
    /**
     * Check if any player has won by reaching the prerequisite number of medals
     * @returns GameVictoryMove if a player has won, null otherwise
     */
    private checkVictory(): GameVictoryMove | null {
        // Check bottom player (index 0)
        if (this.medalTables[0].length >= this.prerequisiteNumberOfMedals) {
            return new GameVictoryMove(this.players[0].side);
        }
        // Check top player (index 1)
        if (this.medalTables[1].length >= this.prerequisiteNumberOfMedals) {
            return new GameVictoryMove(this.players[1].side);
        }
        return null;
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
        this.activePlayerIndex = this.activePlayerIndex == 0 ? 1 : 0;
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
        // Create a new state for this unit
        const unitState = new UnitState(unit.initialStrength);
        this.unitPositions.set(key, unit);
        this.units.set(unit.id, unit);
        this.unitStates.set(unit.id, unitState);
    }


    // -- Unit getters
    /**
     * Get the unit at a specific coordinate, or undefined if empty
     */
    getUnitAt(coord: HexCoord): Unit | undefined {
        return this.unitPositions.get(coordToKey(coord));
    }

    /**
     * Get the state for a unit
     */
    private getUnitState(unit: Unit): UnitState {
        const state = this.unitStates.get(unit.id);
        if (!state) {
            throw new Error(`No state found for unit ${unit.id}`);
        }
        return state;
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
     * Get all units with their coordinates, terrain, and mutable state
     */
    getAllUnits(): Array<{ unit: Unit; coord: HexCoord; terrain: Terrain; unitState: UnitState }> {
        return Array.from(this.unitPositions.entries()).map(([key, unit]) => {
            const coord = keyToCoord(key);
            return {
                unit,
                coord,
                terrain: this.getTerrain(coord),
                unitState: this.getUnitState(unit).clone(),
            };
        });
    }

    /**
     * Get all ordered units with their coordinates
     */
    getOrderedUnitsWithPositions(): Array<{ coord: HexCoord; unit: Unit }> {
        return Array.from(this.unitPositions.entries())
            .filter(([_, unit]) => this.getUnitState(unit).isOrdered)
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

    getUnitSections(unit: Unit): Section[] {
        // Find the unit's position
        const unitWithPos = this.getAllUnitsWithPositions().find(({unit: u}) => u === unit);
        if (!unitWithPos) {
            return [];
        }

        // Check which sections this position belongs to
        const sections: Section[] = [];
        for (const section of [Section.LEFT, Section.CENTER, Section.RIGHT]) {
            if (isHexInSection(unitWithPos.coord, section, this.activePlayer.position)) {
                sections.push(section);
            }
        }
        return sections;
    }

    getOrderedUnits(): Array<Unit> {
        return Array.from(this.units.values()).filter(unit => this.getUnitState(unit).isOrdered);
    }

    /**
     * Check if a unit has been ordered this turn
     */
    isUnitOrdered(unit: Unit): boolean {
        return this.getUnitState(unit).isOrdered;
    }

    /**
     * Check if a unit has moved this turn
     */
    isUnitMoved(unit: Unit): boolean {
        return this.getUnitState(unit).hasMoved;
    }

    /**
     * Mark a unit as having moved this turn
     */
    markUnitMoved(unit: Unit): void {
        this.getUnitState(unit).hasMoved = true;
    }

    /**
     * Remove mark
     */
    unMarkUnitMoved(unit: Unit): void {
        this.getUnitState(unit).hasMoved = false;
    }

    /**
     * Mark a unit to skip battle this turn (moved 2 hexes)
     */
    markUnitSkipsBattle(unit: Unit): void {
        this.getUnitState(unit).skipsBattle = true;
    }

    /**
     * Remove mark
     */
    unMarkUnitSkipsBattle(unit: Unit): void {
        this.getUnitState(unit).skipsBattle = false;
    }

    /**
     * Check if a unit skips battle this turn
     */
    unitSkipsBattle(unit: Unit): boolean {
        return this.getUnitState(unit).skipsBattle;
    }

    /**
     * Increment the number of battles a unit has participated in this turn
     */
    incrementUnitBattlesThisTurn(unit: Unit): void {
        this.getUnitState(unit).battlesThisTurn++;
    }

    /**
     * Get the number of battles a unit has participated in this turn
     */
    getUnitBattlesThisTurn(unit: Unit): number {
        return this.getUnitState(unit).battlesThisTurn;
    }

    /**
     * Get the current strength of a unit
     */
    getUnitCurrentStrength(u: Unit): number {
        return this.getUnitState(u).strength;
    }

    /**
     * Set the current strength of a unit
     */
    setUnitCurrentStrength(unit: Unit, strength: number): void {
        if (strength < 0) {
            throw new Error(`Unit strength cannot be negative: ${strength}`);
        }
        this.getUnitState(unit).strength = strength;
    }

    /**
     * Add an eliminated unit to a player's medal table
     * @param unit The unit that was eliminated
     * @param capturingPlayerIndex Index of the player who captured the unit (0=Bottom, 1=Top)
     */
    addToMedalTable(unit: Unit, capturingPlayerIndex: 0 | 1): void {
        this.medalTables[capturingPlayerIndex].push(unit);
    }

    /**
     * Get a player's medal table
     */
    getMedalTable(playerIndex: 0 | 1): Unit[] {
        return this.medalTables[playerIndex];
    }

    /**
     * Roll the specified number of dice for combat
     */
    rollDice(count: number): DiceResult[] {
        const results = this.dice.roll(count);
        console.log(`Rolled ${count} dice:`, results.map(r => r.name).join(', '));
        return results;
    }

    /**
     * Get a random integer in the range [min, max] (inclusive)
     * Uses the same RNG as dice rolls for deterministic gameplay
     */
    getRandomInt(min: number, max: number): number {
        return this.dice.getRandomInt(min, max);
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
            // Clear turn state for all units
            for (const unit of this.unitPositions.values()) {
                this.getUnitState(unit).clearTurnState();
            }

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
        this.validateUnit(unit);
        const state = this.getUnitState(unit);
        state.isOrdered = !state.isOrdered;
    }

    orderUnit(unit: Unit) {
        this.validateUnit(unit);
        const state = this.getUnitState(unit);
        state.isOrdered = true;
    }

    unOrderUnit(unit: Unit) {
        this.validateUnit(unit);
        const state = this.getUnitState(unit);
        state.isOrdered = false;
    }

    private validateUnit(unit: Unit) {
        if (!this.unitStates.has(unit.id)) {
            throw new Error(`Unknown unit "${unit.id}"`)
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
                this.getUnitState(unit).isOrdered = true;
            }
        }
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
        cloned.activePlayerIndex = this.activePlayerIndex;
        cloned.activeCardId = this.activeCardId;
        cloned.prerequisiteNumberOfMedals = this.prerequisiteNumberOfMedals;

        // Clone players tuple (Players are immutable, shallow copy is safe)
        cloned.players[0] = this.players[0];
        cloned.players[1] = this.players[1];

        // Clone phases array (Phase instances are stateless, shallow copy is safe)
        cloned.phases.length = 0; // Clear the default PlayCardPhase
        this.phases.forEach(phase => cloned.phases.push(phase));

        // Clone unitPositions Map (Units are immutable, keys are strings)
        cloned.unitPositions.clear();
        for (const [key, unit] of this.unitPositions.entries()) {
            cloned.unitPositions.set(key, unit);
        }

        // Clone units Map (Units are immutable)
        cloned.units.clear();
        for (const [id, unit] of this.units.entries()) {
            cloned.units.set(id, unit);
        }

        // Clone unitStates Map (CRITICAL: deep clone each UnitState)
        cloned.unitStates.clear();
        for (const [id, unitState] of this.unitStates.entries()) {
            cloned.unitStates.set(id, unitState.clone());
        }

        // Clone medalTables (shallow copy of arrays containing immutable Units)
        cloned.medalTables[0] = [...this.medalTables[0]];
        cloned.medalTables[1] = [...this.medalTables[1]];

        // Share frozen terrain map (terrain is immutable after finishSetup(), safe to share)
        // Use type assertion to bypass readonly modifier
        (cloned as any).terrain = this.terrain;

        return cloned;
    }
}
