// ABOUTME: Move for advancing into a hex vacated by an enemy after close combat
// ABOUTME: Part of the Take Ground rule that allows attackers to optionally occupy vacated hexes

import {Move} from "./Move";
import {GameState} from "../GameState";
import {Unit, UnitType} from "../Unit";
import {HexCoord, hexDistance} from "../../utils/hex";
import {GameEvent, TookGroundEvent} from "../GameEvent";

export class TakeGroundMove extends Move {
    readonly unit: Unit;
    readonly fromHex: HexCoord;
    readonly toHex: HexCoord;
    readonly allowsOverrun: boolean;

    constructor(unit: Unit, fromHex: HexCoord, toHex: HexCoord, allowsOverrun: boolean = true) {
        super();
        this.unit = unit;
        this.fromHex = fromHex;
        this.toHex = toHex;
        this.allowsOverrun = allowsOverrun;
    }

    execute(gameState: GameState): GameEvent[] {
        // Move the unit first
        gameState.moveUnit(this.fromHex, this.toHex);

        // Pop the TakeGroundPhase
        gameState.popPhase();

        // Check if armor overrun conditions are met
        // (ArmorOverrunPhase is already popped by BattleMove if this came from an overrun)
        if (this.shouldTriggerArmorOverrun(gameState)) {
            gameState.pushArmorOverrunPhase(this.unit, this.toHex);
        }

        return [new TookGroundEvent(this.unit, this.fromHex, this.toHex)];
    }

    private shouldTriggerArmorOverrun(gameState: GameState): boolean {
        // Condition 1: This take ground allows overrun
        if (!this.allowsOverrun) {
            return false;
        }

        // Condition 2: Unit is armor
        if (this.unit.type !== UnitType.ARMOR) {
            return false;
        }

        // Condition 3: Destination terrain allows battle
        const destinationTerrain = gameState.getTerrain(this.toHex);
        if (destinationTerrain.unitMovingInCannotBattle) {
            return false;
        }

        // Condition 4: There are valid enemy targets in range (quick check)
        const allUnits = gameState.getAllUnits();
        const activeSide = gameState.activePlayer.side;

        const hasEnemyInRange = allUnits.some(({coord, unit}) => {
            if (unit.side === activeSide) {
                return false; // Skip friendly units
            }
            const distance = hexDistance(this.toHex, coord);
            return distance >= 1 && distance <= 3; // Armor range
        });

        return hasEnemyInRange;
    }

    toString(): string {
        return `TakeGroundMove(${this.unit.id} from ${this.fromHex} to ${this.toHex})`;
    }
}
