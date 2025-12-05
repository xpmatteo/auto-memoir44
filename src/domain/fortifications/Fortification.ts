// ABOUTME: Fortification base class and concrete implementations
// ABOUTME: Fortifications provide defensive bonuses and are destroyed when units move away

export abstract class Fortification {
    abstract readonly name: string;
    abstract readonly imagePath: string;
    abstract readonly infantryBattleInReduction: number;
    abstract readonly armorBattleInReduction: number;

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
}

export const sandbagAllies = new SandbagFortification("images/fortifications/sandbag-al-facing-top.png");
export const sandbagAxis = new SandbagFortification("images/fortifications/sandbag-ax-facing-bottom.png");
export const hedgehog = new HedgehogFortification("images/fortifications/hedgehog.png");
