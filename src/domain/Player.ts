// ABOUTME: Player model representing a game participant
// ABOUTME: Tracks side (Allies/Axis) and position (Bottom/Top) but not cards directly

export const Side = {
    ALLIES: "Allies",
    AXIS: "Axis",
} as const;

export type Side = typeof Side[keyof typeof Side];

export const Position = {
    BOTTOM: 0,
    TOP: 1,
} as const;

export type Position = typeof Position[keyof typeof Position];

export class Player {
    readonly side: Side;
    readonly position: Position;

    constructor(side: Side, position: Position) {
        this.side = side;
        this.position = position;
    }

    toString(): string {
        const positionLabel = this.position === Position.BOTTOM ? "Bottom" : "Top";
        return `${this.side} (${positionLabel})`;
    }
}
