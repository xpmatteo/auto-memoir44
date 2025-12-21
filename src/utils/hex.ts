// ABOUTME: Hex grid coordinate system utilities for pointy-top hexagons
// ABOUTME: Includes pixel-to-hex conversion and axial rounding

const SQRT3 = Math.sqrt(3);

export type HexCoordKey = number & { readonly __brand: 'HexCoordKey' };

export type GridConfig = {
    cols: number;
    rows: number;
    hexRadius: number;
    originX: number;
    originY: number;
    lineWidth: number;
    strokeStyle: string;
    showCoords: boolean;
    coordColor: string;
};

const KEY_BUILDER = 1024;

function key(q: number, r: number): HexCoordKey {
    // adding KEY_BUILDER/2 to account for negative q
    return (q + KEY_BUILDER / 2 + r * KEY_BUILDER) as HexCoordKey;
}

export class HexCoord {
    private constructor(public q: number, public r: number) {
    }

    // use only in this file: everywhere else use the hexOf function,
    // to preserve the Flyweight pattern
    static create(q: number, r: number): HexCoord {
        return new HexCoord(q, r);
    }

    // 6 axial directions (pointy-top, "q,r" layout)
    east(): HexCoord {
        return hexOf(this.q + 1, this.r);
    }

    west(): HexCoord {
        return hexOf(this.q - 1, this.r);
    }

    northeast(): HexCoord {
        return hexOf(this.q + 1, this.r - 1);
    }

    northwest(): HexCoord {
        return hexOf(this.q, this.r - 1);
    }

    southeast(): HexCoord {
        return hexOf(this.q, this.r + 1);
    }

    southwest(): HexCoord {
        return hexOf(this.q - 1, this.r + 1);
    }

    toString(): string {
        return `(${this.q},${this.r})`;
    }

    key(): HexCoordKey {
        return key(this.q, this.r);
    }

    static from(key: HexCoordKey) {
        return hexOf(key % KEY_BUILDER - KEY_BUILDER / 2, Math.trunc(key / KEY_BUILDER));
    }

    isNorthOf(otherHex: HexCoord) {
        return this.q - otherHex.q === 1 && this.r - otherHex.r === -2;
    }

    isNorthWestOf(otherHex: HexCoord) {
        return this.q - otherHex.q === -1 && this.r - otherHex.r === -1;
    }

    isSouthWestOf(otherHex: HexCoord) {
        return this.q - otherHex.q === -2 && this.r - otherHex.r === 1;
    }

    northernNeighbors(): [HexCoord, HexCoord] {
        return [this.northwest(), this.northeast()];
    }

    southernNeighbors(): [HexCoord, HexCoord] {
        return [this.southwest(), this.southeast()];
    }
}

export type CanvasCoord = {
    x: number;
    y: number;
};

const ALL_HEXES: HexCoord[] = [];

// Implement the Flyweight pattern.  As a result, instances of HexCoord can be compared safely by reference
export function hexOf(q: number, r: number): HexCoord {
    const theKey = key(q, r);
    if (!ALL_HEXES[theKey]) {
        ALL_HEXES[theKey] = HexCoord.create(q, r);
    }
    return ALL_HEXES[theKey];
}

/**
 * Convert mouse event coordinates to canvas pixel coordinates,
 * accounting for canvas scaling.
 */
export function toCanvasCoords(event: MouseEvent, canvas: HTMLCanvasElement): CanvasCoord {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
        x: (event.clientX - rect.left) * scaleX,
        y: (event.clientY - rect.top) * scaleY
    };
}

/**
 * Convert canvas pixel coordinates to hex grid coordinates (offset coordinates).
 * Uses pointy-top orientation.
 */
export function pixelToHex(x: number, y: number, grid: GridConfig): HexCoord {
    const px = x - grid.originX;
    const py = y - grid.originY;
    const q = (SQRT3 / 3 * px - py / 3) / grid.hexRadius;
    const r = ((2 / 3) * py) / grid.hexRadius;
    return hexRound(q, r);
}

/**
 * Convert hex grid coordinates to canvas pixel coordinates.
 * Returns the center point of the hex in canvas space.
 */
export function hexToPixel(coord: HexCoord, grid: GridConfig): CanvasCoord {
    const horizStep = SQRT3 * grid.hexRadius;
    const vertStep = grid.hexRadius * 1.5;

    return {
        x: grid.originX + horizStep * (coord.q + coord.r / 2),
        y: grid.originY + vertStep * coord.r
    };
}

/**
 * Calculate the distance between two hexes in hex grid coordinates.
 * Uses the cube coordinate system where q + r + s = 0.
 * Based on the algorithm from doc/hexlib.js.
 */
export function hexDistance(from: HexCoord, to: HexCoord): number {
    const dq = Math.abs(from.q - to.q);
    const dr = Math.abs(from.r - to.r);
    const ds = Math.abs((from.q + from.r) - (to.q + to.r));
    return Math.trunc((dq + dr + ds) / 2);
}

function hexSubtract(a: HexCoord, b: HexCoord) {
    return hexOf(a.q - b.q, a.r - b.r);
}

function hexRound(fracq: number, fracr: number): HexCoord {
    const fracs = -fracq - fracr;
    let q = Math.round(fracq);
    let r = Math.round(fracr);
    let s = Math.round(fracs);
    let q_diff = Math.abs(q - fracq);
    let r_diff = Math.abs(r - fracr);
    let s_diff = Math.abs(s - fracs);
    if (q_diff > r_diff && q_diff > s_diff) {
        q = -r - s;
    } else if (r_diff > s_diff) {
        r = -q - s;
    }
    return hexOf(q, r);
}

/**
 * Returns true if there is a line of sight from fromHex to toHex.
 * Based on the algorithm from doc/hexlib.js.
 *
 * Special handling for when LOS runs along a hex edge:
 * LOS is blocked only if BOTH sides of the edge have obstacles.
 */
export function hasLineOfSight(toHex: HexCoord, fromHex: HexCoord, isBlocked: (hexCoord: HexCoord) => boolean) {
    // Handle edge cases where LOS runs along a hex edge
    // These work for distance 2, which covers all cases up to range 3
    if (fromHex.isNorthOf(toHex)) {
        // Check both southern neighbors - blocked only if BOTH are blocked
        return !isBlocked(fromHex.southwest()) || !isBlocked(fromHex.southeast());
    }
    if (toHex.isNorthOf(fromHex)) {
        return !isBlocked(toHex.southwest()) || !isBlocked(toHex.southeast());
    }
    if (fromHex.isNorthWestOf(toHex)) {
        return !isBlocked(fromHex.east()) || !isBlocked(fromHex.southeast());
    }
    if (toHex.isNorthWestOf(fromHex)) {
        return !isBlocked(toHex.east()) || !isBlocked(toHex.southeast());
    }
    if (fromHex.isSouthWestOf(toHex)) {
        return !isBlocked(fromHex.east()) || !isBlocked(fromHex.northeast());
    }
    if (toHex.isSouthWestOf(fromHex)) {
        return !isBlocked(toHex.east()) || !isBlocked(toHex.northeast());
    }

    // Standard case: sample points along the line
    const distance = hexDistance(fromHex, toHex);
    const step = hexSubtract(toHex, fromHex);
    const stepSize = 1.0 / distance;
    for (let i = 1; i < distance; i++) {
        const stepHex = hexRound(
            fromHex.q + (step.q * stepSize * i),
            fromHex.r + (step.r * stepSize * i));
        if (isBlocked(stepHex)) {
            return false;
        }
    }
    return true;
}
