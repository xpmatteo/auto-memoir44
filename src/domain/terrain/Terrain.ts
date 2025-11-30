
export abstract class Terrain {
    public imagePath: string | undefined;
    public name: string = "";
    public unitMovingInMustStop = false;
    public unitMovingInCannotBattle = false;
    public infantryBattleInReduction = 0;
    public armorBattleInReduction = 0;
    public armorBattleOutReduction = 0;
    toString(): string {
        return this.name;
    }
}

class ClearTerrain extends Terrain {
    name = "Clear";
}
export const clearTerrain = new ClearTerrain();

class HillTerrain extends Terrain {
    name = "Hill";
    readonly imagePath = "images/terrain/hill.png";
}
export const hillTerrain = new HillTerrain();

class WoodsTerrain extends Terrain {
    name = "Woods";
    unitMovingInMustStop = true;
    unitMovingInCannotBattle = true;
    infantryBattleInReduction = 1;
    armorBattleInReduction = 2;
    readonly imagePath = "images/terrain/woods.png";
}
export const woodsTerrain = new WoodsTerrain();

class HedgerowsTerrain extends Terrain {
    name = "Hedgerows";
    unitMovingInMustStop = true;
    unitMovingInCannotBattle = true;
    infantryBattleInReduction = 1;
    armorBattleInReduction = 2;
    readonly imagePath = "images/terrain/hedgerows.png";
}
export const hedgerowsTerrain = new HedgerowsTerrain();

export class TownTerrain extends Terrain {
    name = "Town";
    unitMovingInMustStop = true;
    unitMovingInCannotBattle = true;
    infantryBattleInReduction = 1;
    armorBattleInReduction = 2;
    armorBattleOutReduction = 2;
    constructor(imagePath: string) {
        super();
        this.imagePath = "images/terrain/" + imagePath;
    }
}
export const town1Terrain = new TownTerrain("town.png");
export const town2Terrain = new TownTerrain("town2.png");
export const town3Terrain = new TownTerrain("town3.png");
export const town4Terrain = new TownTerrain("town4.png");
export const town5Terrain = new TownTerrain("town5.png");

