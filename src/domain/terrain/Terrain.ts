
export abstract class Terrain {
    public imagePath: string | undefined;
}

class ClearTerrain extends Terrain {
}
export const clearTerrain = new ClearTerrain();

class HillTerrain extends Terrain {
    readonly imagePath = "images/terrain/hill.png";
}
export const hillTerrain = new HillTerrain();

class WoodsTerrain extends Terrain {
    readonly imagePath = "images/terrain/woods.png";
}
export const woodsTerrain = new WoodsTerrain();

class HedgerowsTerrain extends Terrain {
    readonly imagePath = "images/terrain/hedgerows.png";
}
export const hedgerowsTerrain = new HedgerowsTerrain();

class TownTerrain extends Terrain {
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

