// ABOUTME: Fortification types and their effects on combat
// ABOUTME: Similar to terrain, but can be removed when units move away

export abstract class Fortification {
    public name: string = "";
    public battleInReduction = 0; // Dice reduction for attacks against units in this fortification

    toString(): string {
        return this.name;
    }
}

class NoFortification extends Fortification {
    name = "None";
    battleInReduction = 0;
}
export const noFortification = new NoFortification();

class SandbagsFortification extends Fortification {
    name = "Sandbags";
    battleInReduction = 1; // Reduce attack dice by 1
}
export const sandbagsFortification = new SandbagsFortification();
