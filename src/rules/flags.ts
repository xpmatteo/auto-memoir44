import {HexCoord} from "../utils/hex";

/*
export class FlagResult {
    damage: number;
    retreats: HexCoord[];

    constructor(damage: number, retreatHexes: HexCoord[]) {
        this.damage = damage;
        this.retreats = retreatHexes;
    }

    static NO_EFFECT = new FlagResult(0, []);

    toString() {
        return `FlagResult(damage: ${this.damage}, retreatHexes: ${this.retreats})`;
    }

    static retreat(hexes: HexCoord[]) {
        return new FlagResult(0, hexes);
    }

    static damage(number: number) {
        return new FlagResult(number, []);
    }
}

function handleFlagsNonIgnorable(flags: number, retreatHexesPerFlag: number, retreatPaths: RetreatPaths): FlagResult {
    const requiredRetreat = flags * retreatHexesPerFlag;
    const damage = Math.max(0, requiredRetreat - retreatPaths.maxDistance);
    const distance = Math.min(retreatPaths.maxDistance, requiredRetreat);
    const retreatPath = (distance === 0) ? [] : retreatPaths.paths.get(distance);
    return new FlagResult(damage, retreatPath);
}

function handleFlagsWithOneIgnorable(flags: number, retreatHexesPerFlag: number, retreatPaths: RetreatPaths): FlagResult {
    const requiredRetreat = flags * retreatHexesPerFlag;
    const retreatWithIgnoredFlag = (flags - 1) * retreatHexesPerFlag;
    if (requiredRetreat === retreatPaths.maxDistance) {
        const notIgnoring = retreatPaths[requiredRetreat];
        const ignoring = retreatPaths[retreatWithIgnoredFlag];
        return new FlagResult(0, ignoring.concat(notIgnoring));
    }
    return handleFlagsNonIgnorable(flags - 1, retreatHexesPerFlag, retreatPaths);
}

export function handleFlags(flags: number, retreatHexesPerFlag: number, ignorableFlags: number, retreatPaths: RetreatPaths): FlagResult {
    if (flags === 0) {
        return FlagResult.NO_EFFECT;
    }

    switch (ignorableFlags) {
        case 0:
            return handleFlagsNonIgnorable(flags, retreatHexesPerFlag, retreatPaths);
        case 1:
            return handleFlagsWithOneIgnorable(flags, retreatHexesPerFlag, retreatPaths);
        default:
            throw new Error("unsupported ignorableFlags: " + ignorableFlags);
    }
}


 */
