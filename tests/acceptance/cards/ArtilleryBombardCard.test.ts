// ABOUTME: Acceptance tests for Artillery Bombard card
// ABOUTME: Tests artillery-specific movement (up to 3 hexes) and double battle

import {expect, test, describe} from "vitest";
import {EndMovementsMove} from "../../../src/domain/moves/Move";
import {HexCoord} from "../../../src/utils/hex";
import {ArtilleryBombard} from "../../../src/domain/cards/ArtilleryBombard";
import {getUnitAt, setupGameForCommandCardTests} from "../../helpers/testHelpers";
import {MoveUnitMove} from "../../../src/domain/moves/MoveUnitMove";
import {BattleMove} from "../../../src/domain/moves/BattleMove";

describe("Artillery Bombard card", () => {

    test('Automatically orders all artillery units', () => {
        const unitSetup = [
            "   0   1   2   3   4   5   6   7   8   9  10  11  12",
            "....    ....    ....    ....    ....    ....    ....",
            "~~....    ....    ....    ....    ....    ....    ~~",
            "....    ....    ....    ....    ....    ....    ....",
            "~~....    ....    ....    ....    ....    ....    ~~",
            "....    ....    ....    ....    ....    ....    ....",
            "~~....    ....    ....    .in.    ....    ....    ~~",
            "....    ....    .RT. IN .RT. IN ....    ....    ....",
            "~~....    ....    ....    ....    ....    ....    ~~",
            "....    ....    ....    ....    ....    ....    ....",
        ];
        const gameState = setupGameForCommandCardTests(unitSetup, ArtilleryBombard);

        // After playing the card, we should be in movement phase
        // Both artillery units should be automatically ordered
        const artillery1 = getUnitAt(gameState, 2, 6);
        const artillery2 = getUnitAt(gameState, 4, 6);

        expect(artillery1.unitState.isOrdered).toBe(true);
        expect(artillery2.unitState.isOrdered).toBe(true);

        // Infantry units should not be ordered
        const infantry1 = getUnitAt(gameState, 3, 6);
        expect(infantry1.unitState.isOrdered).toBe(false);
    });

    test('Artillery can move up to 3 hexes', () => {
        const unitSetup = [
            "   0   1   2   3   4   5   6   7   8   9  10  11  12",
            "....    ....    ....    ....    ....    ....    ....",
            "~~....    ....    ....    ....    ....    ....    ~~",
            "....    ....    ....    ....    ....    ....    ....",
            "~~....    ....    ....    ....    ....    ....    ~~",
            "....    ....    ....    ....    ....    ....    ....",
            "~~....    ....    ....    ....    ....    ....    ~~",
            "....    ....    .RT.    ....    ....    ....    ....",
            "~~....    ....    ....    ....    ....    ....    ~~",
            "....    ....    ....    ....    ....    ....    ....",
        ];
        const gameState = setupGameForCommandCardTests(unitSetup, ArtilleryBombard);
        const artillery = getUnitAt(gameState, 2, 6);

        // Check that artillery can move to a hex 3 hexes away
        const movesFrom2_6 = gameState.legalMoves()
            .filter(m => m instanceof MoveUnitMove && m.from.q === artillery.coord.q && m.from.r === artillery.coord.r)
            .map(m => m as MoveUnitMove);

        // Find moves that are 3 hexes away
        const threeHexMoves = movesFrom2_6.filter(m => {
            const q = m.to.q - m.from.q;
            const r = m.to.r - m.from.r;
            const distance = Math.max(Math.abs(q), Math.abs(r), Math.abs(q + r));
            return distance === 3;
        });

        expect(threeHexMoves.length).toBeGreaterThan(0);
    });

    test('Artillery that moves cannot battle', () => {
        const unitSetup = [
            "   0   1   2   3   4   5   6   7   8   9  10  11  12",
            "....    ....    ....    ....    ....    ....    ....",
            "~~....    ....    ....    ....    ....    ....    ~~",
            "....    ....    ....    ....    ....    ....    ....",
            "~~....    ....    ....    ....    ....    ....    ~~",
            "....    ....    ....    ....    ....    ....    ....",
            "~~....    ....    ....    .in.    ....    ....    ~~",
            "....    ....    .RT.    ....    ....    ....    ....",
            "~~....    ....    ....    ....    ....    ....    ~~",
            "....    ....    ....    ....    ....    ....    ....",
        ];
        const gameState = setupGameForCommandCardTests(unitSetup, ArtilleryBombard);
        const artillery = getUnitAt(gameState, 2, 6);

        // Move the artillery unit
        gameState.executeMove(new MoveUnitMove(new HexCoord(2, 6), new HexCoord(3, 6)));
        gameState.executeMove(new EndMovementsMove());

        // Check that no battle moves are available for the artillery
        const battleMoves = gameState.legalMoves()
            .filter(m => m instanceof BattleMove)
            .map(m => m as BattleMove);

        const artilleryBattles = battleMoves.filter(m => m.fromUnit === artillery.unit);
        expect(artilleryBattles.length).toBe(0);
    });

    test('Artillery that does not move can battle twice', () => {
        const unitSetup = [
            "   0   1   2   3   4   5   6   7   8   9  10  11  12",
            "....    ....    ....    ....    ....    ....    ....",
            "~~....    ....    ....    ....    ....    ....    ~~",
            "....    ....    ....    ....    ....    ....    ....",
            "~~....    ....    ....    ....    ....    ....    ~~",
            "....    ....    ....    ....    ....    ....    ....",
            "~~....    ....    ....    .in.    ....    ....    ~~",
            "....    ....    .RT.    ....    ....    ....    ....",
            "~~....    ....    ....    ....    ....    ....    ~~",
            "....    ....    ....    ....    ....    ....    ....",
        ];
        const gameState = setupGameForCommandCardTests(unitSetup, ArtilleryBombard);
        const artillery = getUnitAt(gameState, 2, 6);
        const enemy = getUnitAt(gameState, 4, 5);

        // Don't move - just end movements
        gameState.executeMove(new EndMovementsMove());

        // First battle
        const battleMove1 = new BattleMove(artillery.unit, enemy.unit, 1);
        gameState.executeMove(battleMove1);

        // After first battle, should still be able to battle again
        const battleMovesAfterFirst = gameState.legalMoves()
            .filter(m => m instanceof BattleMove)
            .map(m => m as BattleMove);

        const artilleryBattlesAfterFirst = battleMovesAfterFirst.filter(m => m.fromUnit === artillery.unit);
        expect(artilleryBattlesAfterFirst.length).toBeGreaterThan(0);

        // Second battle (same target)
        const battleMove2 = new BattleMove(artillery.unit, enemy.unit, 1);
        gameState.executeMove(battleMove2);

        // After second battle, should not be able to battle again
        const battleMovesAfterSecond = gameState.legalMoves()
            .filter(m => m instanceof BattleMove)
            .map(m => m as BattleMove);

        const artilleryBattlesAfterSecond = battleMovesAfterSecond.filter(m => m.fromUnit === artillery.unit);
        expect(artilleryBattlesAfterSecond.length).toBe(0);
    });

    test('Can battle the same target twice', () => {
        const unitSetup = [
            "   0   1   2   3   4   5   6   7   8   9  10  11  12",
            "....    ....    ....    ....    ....    ....    ....",
            "~~....    ....    ....    ....    ....    ....    ~~",
            "....    ....    ....    ....    ....    ....    ....",
            "~~....    ....    ....    ....    ....    ....    ~~",
            "....    ....    ....    ....    ....    ....    ....",
            "~~....    ....    ....    .in.    ....    ....    ~~",
            "....    ....    .RT.    ....    ....    ....    ....",
            "~~....    ....    ....    ....    ....    ....    ~~",
            "....    ....    ....    ....    ....    ....    ....",
        ];
        const gameState = setupGameForCommandCardTests(unitSetup, ArtilleryBombard);
        const artillery = getUnitAt(gameState, 2, 6);
        const enemy = getUnitAt(gameState, 4, 5);

        // Don't move
        gameState.executeMove(new EndMovementsMove());

        // First battle against the enemy
        const battleMove1 = new BattleMove(artillery.unit, enemy.unit, 1);
        gameState.executeMove(battleMove1);

        // Check if we can battle the same target again
        const battleMovesAfterFirst = gameState.legalMoves()
            .filter(m => m instanceof BattleMove)
            .map(m => m as BattleMove);

        const sameTargetBattles = battleMovesAfterFirst.filter(
            m => m.fromUnit === artillery.unit && m.toUnit === enemy.unit
        );

        expect(sameTargetBattles.length).toBeGreaterThan(0);
    });

    test('Movement respects terrain that stops movement', () => {
        const unitSetup = [
            "   0   1   2   3   4   5   6   7   8   9  10  11  12",
            "....    ....    ....    ....    ....    ....    ....",
            "~~....    ....    ....    ....    ....    ....    ~~",
            "....    ....    ....    ....    ....    ....    ....",
            "~~....    ....    ....    ....    ....    ....    ~~",
            "....    ....    ....    ....    ....    ....    ....",
            "~~....    ....    W...    ....    ....    ....    ~~",
            "....    ....    .RT.    ....    ....    ....    ....",
            "~~....    ....    ....    ....    ....    ....    ~~",
            "....    ....    ....    ....    ....    ....    ....",
        ];
        const gameState = setupGameForCommandCardTests(unitSetup, ArtilleryBombard);
        const artillery = getUnitAt(gameState, 2, 6);

        const movesFrom2_6 = gameState.legalMoves()
            .filter(m => m instanceof MoveUnitMove && m.from.q === artillery.coord.q && m.from.r === artillery.coord.r)
            .map(m => m as MoveUnitMove);

        // Artillery can move to woods at (2,5) - 1 hex away
        const canMoveToWoods = movesFrom2_6.some(m => m.to.q === 2 && m.to.r === 5);
        expect(canMoveToWoods).toBe(true);

        // But cannot move through woods to (2,4) or (2,3) which are 2 and 3 hexes away
        const canMoveThroughWoods = movesFrom2_6.some(m =>
            (m.to.q === 2 && m.to.r === 4) || (m.to.q === 2 && m.to.r === 3)
        );
        expect(canMoveThroughWoods).toBe(false);
    });

    describe('When no artillery units exist', () => {
        test('Can order one unit from any section', () => {
            const unitSetup = [
                "   0   1   2   3   4   5   6   7   8   9  10  11  12",
                "....    ....    ....    ....    ....    ....    ....",
                "~~....    ....    ....    ....    ....    ....    ~~",
                "....    ....    ....    ....    ....    ....    ....",
                "~~....    ....    ....    ....    ....    ....    ~~",
                "....    ....    ....    ....    ....    ....    ....",
                "~~....    ....    ....    .in.    ....    ....    ~~",
                "....    ....    .IN. IN .IN. IN ....    ....    ....",
                "~~....    ....    ....    ....    ....    ....    ~~",
                "....    ....    ....    ....    ....    ....    ....",
            ];
            const gameState = setupGameForCommandCardTests(unitSetup, ArtilleryBombard);

            // Should be in order phase with ability to order any unit
            const legalMoves = gameState.legalMoves().map(m => m.toString());

            expect(legalMoves).toContain("ConfirmOrdersMove");
            expect(legalMoves).toContain("OrderUnitMove(unit-2/Allies)");
            expect(legalMoves).toContain("OrderUnitMove(unit-3/Allies)");
            expect(legalMoves).toContain("OrderUnitMove(unit-4/Allies)");
            expect(legalMoves).toContain("OrderUnitMove(unit-5/Allies)");
        });

        test('Uses normal movement and battle phases', () => {
            const unitSetup = [
                "   0   1   2   3   4   5   6   7   8   9  10  11  12",
                "....    ....    ....    ....    ....    ....    ....",
                "~~....    ....    ....    ....    ....    ....    ~~",
                "....    ....    ....    ....    ....    ....    ....",
                "~~....    ....    ....    ....    ....    ....    ~~",
                "....    ....    ....    ....    ....    ....    ....",
                "~~....    ....    ....    .in.    ....    ....    ~~",
                "....    ....    .IN.    ....    ....    ....    ....",
                "~~....    ....    ....    ....    ....    ....    ~~",
                "....    ....    ....    ....    ....    ....    ....",
            ];
            const gameState = setupGameForCommandCardTests(unitSetup, ArtilleryBombard);
            const infantry = getUnitAt(gameState, 2, 6);

            // Order the infantry
            gameState.executeMove(gameState.legalMoves().find(m =>
                m.toString() === "OrderUnitMove(unit-2/Allies)"
            )!);

            // Confirm orders
            gameState.executeMove(gameState.legalMoves().find(m =>
                m.toString() === "ConfirmOrdersMove"
            )!);

            // Should be able to move normally (infantry moves 1 hex max normally)
            const moveMoves = gameState.legalMoves()
                .filter(m => m instanceof MoveUnitMove)
                .map(m => m as MoveUnitMove);

            expect(moveMoves.length).toBeGreaterThan(0);

            // End movements without moving
            gameState.executeMove(new EndMovementsMove());

            // Should be able to battle only once (normal battle phase)
            const battleMove = new BattleMove(infantry.unit, getUnitAt(gameState, 4, 5).unit, 1);
            gameState.executeMove(battleMove);

            // After one battle, infantry should not be able to battle again
            const battleMovesAfter = gameState.legalMoves()
                .filter(m => m instanceof BattleMove)
                .map(m => m as BattleMove);

            const infantryBattlesAfter = battleMovesAfter.filter(m => m.fromUnit === infantry.unit);
            expect(infantryBattlesAfter.length).toBe(0);
        });
    });
});
