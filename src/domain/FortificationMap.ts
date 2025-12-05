// ABOUTME: Manages fortification storage and provides spatial fortification queries
// ABOUTME: Unlike TerrainMap, fortifications are mutable and can be destroyed mid-game

import {HexCoord} from "../utils/hex";
import {Fortification} from "./fortifications/Fortification";
import {coordToKey, keyToCoord} from "./Unit";

export class FortificationMap {
    private readonly fortifications: Map<string, Fortification>;

    constructor() {
        this.fortifications = new Map<string, Fortification>();
    }

    /**
     * Set fortification at a hex coordinate
     */
    set(hex: HexCoord, fortification: Fortification): void {
        this.fortifications.set(coordToKey(hex), fortification);
    }

    /**
     * Get fortification at a hex coordinate
     * Returns undefined if no fortification is set at this hex
     */
    get(hex: HexCoord): Fortification | undefined {
        const key = coordToKey(hex);
        return this.fortifications.get(key);
    }

    /**
     * Remove fortification at a hex coordinate
     */
    remove(hex: HexCoord): void {
        this.fortifications.delete(coordToKey(hex));
    }

    /**
     * Iterate over all fortification entries
     */
    forEach(callback: (fortification: Fortification, hex: HexCoord) => void): void {
        this.fortifications.forEach((fortification: Fortification, key: string) => {
            callback(fortification, keyToCoord(key));
        });
    }

    /**
     * Create a deep clone of this fortification map for AI simulation
     */
    clone(): FortificationMap {
        const cloned = new FortificationMap();
        this.fortifications.forEach((fortification, key) => {
            cloned.fortifications.set(key, fortification);
        });
        return cloned;
    }
}
