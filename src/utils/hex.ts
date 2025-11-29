// ABOUTME: Hex grid coordinate system utilities for pointy-top hexagons
// ABOUTME: Includes pixel-to-hex conversion and axial rounding

const SQRT3 = Math.sqrt(3);

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

export class HexCoord {
    constructor(public q: number, public r: number) {
    }

    // 6 axial directions (pointy-top, "q,r" layout)

    east(): HexCoord {
        return new HexCoord(this.q + 1, this.r);
    }

    west(): HexCoord {
        return new HexCoord(this.q - 1, this.r);
    }

    northeast(): HexCoord {
        return new HexCoord(this.q + 1, this.r - 1);
    }

    northwest(): HexCoord {
        return new HexCoord(this.q, this.r - 1);
    }

    southeast(): HexCoord {
        return new HexCoord(this.q, this.r + 1);
    }

    southwest(): HexCoord {
        return new HexCoord(this.q - 1, this.r + 1);
    }

    toString(): string {
        return `(${this.q},${this.r})`;
    }
}

export type CanvasCoord = {
    x: number;
    y: number;
};

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
    return axialRound(q, r);
}

/**
 * Round fractional axial coordinates to the nearest hex center.
 * Uses cube coordinate constraint (q + r + s = 0) for accurate rounding.
 */
export function axialRound(q: number, r: number): HexCoord {
    const s = -q - r;
    let rq = Math.round(q);
    let rr = Math.round(r);
    let rs = Math.round(s);

    const qDiff = Math.abs(rq - q);
    const rDiff = Math.abs(rr - r);
    const sDiff = Math.abs(rs - s);

    if (qDiff > rDiff && qDiff > sDiff) {
        rq = -rr - rs;
    } else if (rDiff > sDiff) {
        rr = -rq - rs;
    } else {
        rs = -rq - rr;
    }

    return new HexCoord(rq, rr);
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
