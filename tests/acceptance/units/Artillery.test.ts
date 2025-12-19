// ABOUTME: Acceptance tests for artillery

import {expect, test, describe, beforeEach} from "vitest";
import {GameState} from "../../../src/domain/GameState";
import {AssaultLeft, } from "../../../src/domain/cards/CommandCard";
import {ConfirmOrdersMove, OrderUnitMove, EndMovementsMove} from "../../../src/domain/moves/Move";
import {Side} from "../../../src/domain/Player";
import {SituatedUnit} from "../../../src/domain/SituatedUnit";
import {getUnitAt, setupGameForCommandCardTests} from "../../helpers/testHelpers";
import {MoveUnitMove} from "../../../src/domain/moves/MoveUnitMove";
import {HexCoord} from "../../../src/utils/hex";

describe("Artillery", () => {
        const unitSetup = [
            "   0   1   2   3   4   5   6   7   8   9  10  11  12",
            ".RT.    .in. in .in. in .in. in ....    ....    ....",
            "~~....    ....    ....    ....    ....    ....    ~~",
            "....    ....    ....    ....    ....    ....    ....",
            "~~....    ....    ....    ....    ....    ....    ~~",
            "....    ....    ....    ....    ....    ....    ....",
            "~~....    ....    ....    ....    ....    ....    ~~",
            "....    ....    ....    ....    ....    ....    ....",
            "~~....    ....    ....    ....    ....    ....    ~~",
            "....    ....    ....    ....    ....    ....    ....",
        ];

        let gameState: GameState;
        let artillery: SituatedUnit;
        // let enemy2: SituatedUnit;
        // let enemy3: SituatedUnit;
        // let enemy4: SituatedUnit;
        // let enemy5: SituatedUnit;
        // let enemy6: SituatedUnit;
        // let enemy7: SituatedUnit;

        beforeEach(() => {
            gameState = setupGameForCommandCardTests(unitSetup, AssaultLeft, Side.ALLIES);
            artillery = getUnitAt(gameState, 0, 0)!;
            // enemy2 = getUnitAt(gameState, 2, 0);
            // enemy3 = getUnitAt(gameState, 3, 0);
            // enemy4 = getUnitAt(gameState, 4, 0);
            // enemy5 = getUnitAt(gameState, 5, 0);
            // enemy6 = getUnitAt(gameState, 6, 0);
            // enemy7 = getUnitAt(gameState, 7, 0);
        });

    test("it moves by one hex only", () => {
        gameState.executeMove(new OrderUnitMove(artillery.unit));
        gameState.executeMove(new ConfirmOrdersMove());

        const moves = gameState.legalMoves().map(m => m.toString()).sort();
        expect(moves).toEqual([
            "EndMovements",
            "Move from (0,0) to (0,0)",
            "Move from (0,0) to (0,1)",
            "Move from (0,0) to (1,0)",
        ]);
    });

    test("if it moves, it does not battle", () => {
        gameState.executeMove(new OrderUnitMove(artillery.unit));
        gameState.executeMove(new ConfirmOrdersMove());
        gameState.executeMove(new MoveUnitMove(new HexCoord(0, 0), new HexCoord(1, 0)));
        gameState.executeMove(new EndMovementsMove());

        // cannot battle
        expect(gameState.legalMoves().map(m => m.toString())).toEqual([
            "ReplenishHandMove(Assault Left)",
        ]);
    });

    test("ranged battle", () => {
        gameState.executeMove(new OrderUnitMove(artillery.unit));
        gameState.executeMove(new ConfirmOrdersMove());
        gameState.executeMove(new EndMovementsMove());

        expect(gameState.legalMoves().map(m => m.toString())).toEqual([
            "EndBattles",
            "Battle(Artillery/Allies/unit-1, Infantry/Axis/unit-2, 3)",
            "Battle(Artillery/Allies/unit-1, Infantry/Axis/unit-3, 2)",
            "Battle(Artillery/Allies/unit-1, Infantry/Axis/unit-4, 2)",
            "Battle(Artillery/Allies/unit-1, Infantry/Axis/unit-5, 1)",
            "Battle(Artillery/Allies/unit-1, Infantry/Axis/unit-6, 1)",
        ]);
    });
});
