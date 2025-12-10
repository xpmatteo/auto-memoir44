import {describe, expect, it} from "vitest";
import {Player, Position, Side} from "./Player";

describe("Player", () => {
    it.each([
        {side: Side.ALLIES, position: Position.BOTTOM, expected: "Allies (Bottom)"},
        {side: Side.AXIS, position: Position.TOP, expected: "Axis (Top)"},
    ])("renders toString for $side/$position", ({side, position, expected}) => {
        const player = new Player(side, position);
        expect(player.toString()).toBe(expected);
    });

    it("stores side and position", () => {
        const player = new Player(Side.ALLIES, Position.TOP);
        expect(player.side).toBe(Side.ALLIES);
        expect(player.position).toBe(Position.TOP);
    });
});
