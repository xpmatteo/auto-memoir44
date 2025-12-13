// ABOUTME: Manages fortification storage and provides spatial fortification queries
// ABOUTME: Unlike TerrainMap, fortifications are mutable and can be destroyed mid-game

import {HexCoord, HexCoordKey} from "../utils/hex";
import {Fortification, noFortification} from "./fortifications/Fortification";

export class FortificationMap {
    private readonly fortifications: Map<HexCoordKey, Fortification>;

    constructor() {
        this.fortifications = new Map<HexCoordKey, Fortification>();
    }

    /**
     * Set fortification at a hex coordinate
     */
    set(hex: HexCoord, fortification: Fortification): void {
        this.fortifications.set(hex.key(), fortification);
    }

    /**
     * Get fortification at a hex coordinate.
     * Returns noFortification if no fortification is set at this hex (null object pattern).
     */
    get(hex: HexCoord): Fortification {
        const key = hex.key();
        return this.fortifications.get(key) ?? noFortification;
    }

    /**
     * Remove fortification at a hex coordinate
     */
    remove(hex: HexCoord): void {
        this.fortifications.delete(hex.key());
    }

    /**
     * Iterate over all fortification entries
     */
    forEach(callback: (fortification: Fortification, hex: HexCoord) => void): void {
        this.fortifications.forEach((fortification: Fortification, key: HexCoordKey) => {
            callback(fortification, HexCoord.from(key));
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
