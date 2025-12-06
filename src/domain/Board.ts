// ABOUTME: Manages unit positions and state on the game board
// ABOUTME: Handles spatial queries, unit movement, and turn-based unit state

import {HexCoord} from "../utils/hex";
import {Unit, UnitState, coordToKey, keyToCoord} from "./Unit";
import {Terrain} from "./terrain/Terrain";
import {Section} from "./Section";
import {isHexInSection} from "./Section";
import {Position, Side} from "./Player";
import {BOARD_GEOMETRY} from "./BoardGeometry";

export class Board {
    private unitPositions: Map<string, Unit>; // Map from coordinate key to Unit
    private units: Map<string, Unit>; // Map from unit ID to unit
    private unitStates: Map<string, UnitState>; // Map from unit ID to unit state

    constructor() {
        this.unitPositions = new Map<string, Unit>();
        this.units = new Map<string, Unit>();
        this.unitStates = new Map<string, UnitState>();
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
    getAllUnits(getTerrainFn: (coord: HexCoord) => Terrain): Array<{ unit: Unit; coord: HexCoord; terrain: Terrain; unitState: UnitState }> {
        return Array.from(this.unitPositions.entries()).map(([key, unit]) => {
            const coord = keyToCoord(key);
            return {
                unit,
                coord,
                terrain: getTerrainFn(coord),
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

    /**
     * Get all friendly units
     */
    getFriendlyUnits(activeSide: Side): Array<Unit> {
        return this.getAllUnitsWithPositions()
            .filter(({unit}) => unit.side === activeSide)
            .map(({unit}) => unit);
    }

    /**
     * Get all friendly units in a section
     */
    getFriendlyUnitsInSection(section: Section, activeSide: Side, activePosition: Position): Array<Unit> {
        return this.getAllUnitsWithPositions()
            .filter(({coord}) => isHexInSection(coord, section, activePosition))
            .filter(({unit}) => unit.side === activeSide)
            .map(({unit}) => unit);
    }

    /**
     * Get all sections a unit belongs to
     */
    getUnitSections(unit: Unit, activePosition: Position): Section[] {
        // Find the unit's position
        const unitWithPos = this.getAllUnitsWithPositions().find(({unit: u}) => u === unit);
        if (!unitWithPos) {
            return [];
        }

        // Check which sections this position belongs to
        const sections: Section[] = [];
        for (const section of [Section.LEFT, Section.CENTER, Section.RIGHT]) {
            if (isHexInSection(unitWithPos.coord, section, activePosition)) {
                sections.push(section);
            }
        }
        return sections;
    }

    /**
     * Get all ordered units
     */
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
    setUnitCurrentStrength(unit: Unit, newStrength: number): void {
        this.getUnitState(unit).strength = Math.max(0, newStrength);
    }

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

    /**
     * Toggle unit ordered state
     */
    toggleUnitOrdered(unit: Unit): void {
        this.validateUnit(unit);
        const state = this.getUnitState(unit);
        state.isOrdered = !state.isOrdered;
    }

    /**
     * Mark unit as ordered
     */
    orderUnit(unit: Unit): void {
        this.validateUnit(unit);
        const state = this.getUnitState(unit);
        state.isOrdered = true;
    }

    /**
     * Remove ordered mark from unit
     */
    unOrderUnit(unit: Unit): void {
        this.validateUnit(unit);
        const state = this.getUnitState(unit);
        state.isOrdered = false;
    }

    /**
     * Validate that unit exists
     */
    private validateUnit(unit: Unit): void {
        if (!this.unitStates.has(unit.id)) {
            throw new Error(`Unknown unit "${unit.id}"`);
        }
    }

    /**
     * Order all friendly units in a section
     */
    orderAllFriendlyUnitsInSection(section: Section, activeSide: Side, activePosition: Position): void {
        const allUnitsWithPositions = this.getAllUnitsWithPositions();

        for (const {coord, unit} of allUnitsWithPositions) {
            // Only order units owned by the active player
            if (unit.side !== activeSide) {
                continue;
            }

            // Check if unit is in the target section
            if (isHexInSection(coord, section, activePosition)) {
                this.getUnitState(unit).isOrdered = true;
            }
        }
    }

    /**
     * Clear turn state for all units (called at end of turn)
     */
    clearAllUnitTurnState(): void {
        for (const unit of this.unitPositions.values()) {
            this.getUnitState(unit).clearTurnState();
        }
    }

    /**
     * Create a deep clone of this Board for AI simulation
     */
    clone(): Board {
        const cloned = new Board();

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

        return cloned;
    }
}
