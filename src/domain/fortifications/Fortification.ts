// ABOUTME: Fortification base class and concrete implementations
// ABOUTME: Fortifications provide defensive bonuses with different removal behaviors

import type {GameState} from "../GameState";
import type {HexCoord} from "../../utils/hex";

export abstract class Fortification {
    abstract readonly name: string;
    abstract readonly imagePath: string;
    abstract readonly infantryBattleInReduction: number;
    abstract readonly armorBattleInReduction: number;

    /**
     * Called when a unit moves away from this fortification's hex.
     * Different fortifications can have different behaviors:
     * - Sandbags are removed when the unit moves away
     * - Hedgehogs remain in place
     */
    abstract onUnitMoving(gameState: GameState, hex: HexCoord): void;

    toString(): string {
        return this.name;
    }
}

class SandbagFortification extends Fortification {
    readonly name = "Sandbag";
    readonly infantryBattleInReduction = 1;
    readonly armorBattleInReduction = 1;
    readonly imagePath: string;

    constructor(imagePath: string) {
        super();
        this.imagePath = imagePath;
    }

    onUnitMoving(gameState: GameState, hex: HexCoord): void {
        // Sandbags are removed when unit moves away
        gameState.removeFortification(hex);
    }
}

class HedgehogFortification extends Fortification {
    readonly name = "Hedgehog";
    readonly infantryBattleInReduction = 0;
    readonly armorBattleInReduction = 0;
    readonly imagePath: string;

    constructor(imagePath: string) {
        super();
        this.imagePath = imagePath;
    }

    onUnitMoving(_gameState: GameState, _hex: HexCoord): void {
        // Hedgehogs remain in place when unit moves away
        // (do nothing)
    }
}

/**
 * Null object pattern: represents the absence of a fortification.
 * Provides neutral behavior (no defensive bonus, no actions on unit movement).
 */
class NoFortification extends Fortification {
    readonly name = "None";
    readonly infantryBattleInReduction = 0;
    readonly armorBattleInReduction = 0;
    readonly imagePath = "";

    onUnitMoving(_gameState: GameState, _hex: HexCoord): void {
        // No fortification means no action needed
    }
}

export const sandbagAllies = new SandbagFortification("images/fortifications/sandbag-al-facing-top.png");
export const sandbagAxis = new SandbagFortification("images/fortifications/sandbag-ax-facing-bottom.png");
export const hedgehog = new HedgehogFortification("images/fortifications/hedgehog.png");
export const noFortification = new NoFortification();
