// ABOUTME: Manages terrain storage and provides spatial terrain queries
// ABOUTME: Terrain map is frozen after setup to prevent mid-game modifications

import {HexCoord} from "../utils/hex";
import {Terrain, clearTerrain} from "./terrain/Terrain";
import {coordToKey, keyToCoord} from "./Unit";

export class TerrainMap {
    private readonly terrain: Map<string, Terrain>;
    private frozen: boolean = false;

    constructor() {
        this.terrain = new Map<string, Terrain>();
    }

    /**
     * Set terrain at a hex coordinate
     * @throws Error if the terrain map is frozen
     */
    set(hex: HexCoord, terrain: Terrain): void {
        if (this.frozen) {
            throw new Error("Cannot modify terrain after freeze() has been called");
        }
        this.terrain.set(coordToKey(hex), terrain);
    }

    /**
     * Get terrain at a hex coordinate
     * Returns clearTerrain if no terrain is set at this hex
     */
    get(hex: HexCoord): Terrain {
        const key = coordToKey(hex);
        if (!this.terrain.has(key)) {
            return clearTerrain;
        }
        return this.terrain.get(key)!;
    }

    /**
     * Iterate over all terrain entries
     */
    forEach(callback: (terrain: Terrain, hex: HexCoord) => void): void {
        this.terrain.forEach((terrain: Terrain, key: string) => {
            callback(terrain, keyToCoord(key));
        });
    }

    /**
     * Freeze the terrain map to prevent further modifications
     * After calling this, set() will throw an error
     */
    freeze(): void {
        this.frozen = true;
        Object.freeze(this.terrain);
    }

    /**
     * Get the underlying terrain map (for cloning/sharing)
     * @internal
     */
    getTerrainMap(): Map<string, Terrain> {
        return this.terrain;
    }

    /**
     * Check if the terrain map is frozen
     */
    isFrozen(): boolean {
        return this.frozen;
    }
}
