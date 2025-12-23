// ABOUTME: Acceptance tests for armor unit movement
// ABOUTME: Tests armor-specific movement (0-3 hexes) and battle eligibility

import {expect, test, describe} from "vitest";
import {GameState} from "../../src/domain/GameState";
import {Deck} from "../../src/domain/Deck";
import {CardLocation} from "../../src/domain/cards/CommandCard";
import {ProbeCenter} from "../../src/domain/cards/SectionCards";
import {ConfirmOrdersMove, PlayCardMove, OrderUnitMove} from "../../src/domain/moves/Move";
import {Infantry, Armor} from "../../src/domain/Unit";
import {Side} from "../../src/domain/Player";
import {hexOf} from "../../src/utils/hex";
import {woodsTerrain} from "../../src/domain/terrain/Terrain";
import {MoveUnitMove} from "../../src/domain/moves/MoveUnitMove";
import {BattleMove} from "../../src/domain/moves/BattleMove";

describe("Armor movement", () => {
    test("Armor can move up to 3 hexes", () => {
        // Arrange
        const deck = Deck.createFromComposition([[ProbeCenter, 60]]);
        const gameState = new GameState(deck);
        gameState.drawCards(3, CardLocation.BOTTOM_PLAYER_HAND);

        const armor = new Armor(Side.ALLIES);
        const startPos = hexOf(5, 5);
        gameState.placeUnit(startPos, armor);

        // Play card and order the armor unit
        const card = gameState.getCardsInLocation(CardLocation.BOTTOM_PLAYER_HAND)[0];
        gameState.executeMove(new PlayCardMove(card));
        gameState.executeMove(new OrderUnitMove(armor));
        gameState.executeMove(new ConfirmOrdersMove());

        // Assert: Should be in MovePhase
        expect(gameState.activePhase.name).toBe("Move Units");

        // Assert: Can move 1 hex east
        const oneHexEast = hexOf(6, 5);
        expect(gameState.legalMoves()).toContainEqual(new MoveUnitMove(startPos, oneHexEast));

        // Assert: Can move 2 hexes east
        const twoHexesEast = hexOf(7, 5);
        expect(gameState.legalMoves()).toContainEqual(new MoveUnitMove(startPos, twoHexesEast));

        // Assert: Can move 3 hexes east
        const threeHexesEast = hexOf(8, 5);
        expect(gameState.legalMoves()).toContainEqual(new MoveUnitMove(startPos, threeHexesEast));

        // Act: Execute a 3-hex move
        gameState.executeMove(new MoveUnitMove(startPos, threeHexesEast));

        // Assert: Armor moved successfully
        expect(gameState.getUnitAt(threeHexesEast)).toBe(armor);
        expect(gameState.getUnitAt(startPos)).toBeUndefined();
    });

    test("Armor can battle after moving 3 hexes", () => {
        // Arrange
        const deck = Deck.createFromComposition([[ProbeCenter, 60]]);
        const gameState = new GameState(deck);
        gameState.drawCards(3, CardLocation.BOTTOM_PLAYER_HAND);

        const armor = new Armor(Side.ALLIES);
        const enemy = new Infantry(Side.AXIS);
        const armorStart = hexOf(5, 5);
        const enemyPos = hexOf(9, 5);

        gameState.placeUnit(armorStart, armor);
        gameState.placeUnit(enemyPos, enemy);

        // Play card and order armor
        const card = gameState.getCardsInLocation(CardLocation.BOTTOM_PLAYER_HAND)[0];
        gameState.executeMove(new PlayCardMove(card));
        gameState.executeMove(new OrderUnitMove(armor));
        gameState.executeMove(new ConfirmOrdersMove());

        // Act: Move armor 3 hexes closer to enemy
        const armorEnd = hexOf(8, 5); // 3 hexes from start, 1 hex from enemy
        gameState.executeMove(new MoveUnitMove(armorStart, armorEnd));

        // Assert: Phase auto-advanced to BattlePhase
        expect(gameState.activePhase.name).toBe("Battle");

        // Assert: Armor is NOT marked to skip battle
        expect(gameState.unitSkipsBattle(armor)).toBe(false);

        // Assert: BattleMove against enemy is available
        const legalMoves = gameState.legalMoves();
        const battleMove = legalMoves.find(m =>
            m instanceof BattleMove &&
            m.fromUnit === armor &&
            m.toUnit === enemy
        );
        expect(battleMove).toBeDefined();
    });

    test("Armor can battle after moving 2 hexes", () => {
        // Arrange
        const deck = Deck.createFromComposition([[ProbeCenter, 60]]);
        const gameState = new GameState(deck);
        gameState.drawCards(3, CardLocation.BOTTOM_PLAYER_HAND);

        const armor = new Armor(Side.ALLIES);
        const enemy = new Infantry(Side.AXIS);
        const armorStart = hexOf(5, 5);
        const enemyPos = hexOf(8, 5);

        gameState.placeUnit(armorStart, armor);
        gameState.placeUnit(enemyPos, enemy);

        // Play card and order armor
        const card = gameState.getCardsInLocation(CardLocation.BOTTOM_PLAYER_HAND)[0];
        gameState.executeMove(new PlayCardMove(card));
        gameState.executeMove(new OrderUnitMove(armor));
        gameState.executeMove(new ConfirmOrdersMove());

        // Act: Move armor 2 hexes
        const armorEnd = hexOf(7, 5); // 2 hexes from start, 1 hex from enemy
        gameState.executeMove(new MoveUnitMove(armorStart, armorEnd));

        // Assert: Phase auto-advanced to BattlePhase
        expect(gameState.activePhase.name).toBe("Battle");

        // Assert: Armor is NOT marked to skip battle (unlike infantry)
        expect(gameState.unitSkipsBattle(armor)).toBe(false);

        // Assert: BattleMove against enemy is available
        const legalMoves = gameState.legalMoves();
        const battleMove = legalMoves.find(m =>
            m instanceof BattleMove &&
            m.fromUnit === armor &&
            m.toUnit === enemy
        );
        expect(battleMove).toBeDefined();
    });

    test("Infantry moving 2 hexes still cannot battle (regression)", () => {
        // Arrange
        const deck = Deck.createFromComposition([[ProbeCenter, 60]]);
        const gameState = new GameState(deck);
        gameState.drawCards(3, CardLocation.BOTTOM_PLAYER_HAND);

        const infantry = new Infantry(Side.ALLIES);
        const enemy = new Infantry(Side.AXIS);
        const infantryStart = hexOf(5, 5);
        const enemyPos = hexOf(8, 5);

        gameState.placeUnit(infantryStart, infantry);
        gameState.placeUnit(enemyPos, enemy);

        // Play card and order infantry
        const card = gameState.getCardsInLocation(CardLocation.BOTTOM_PLAYER_HAND)[0];
        gameState.executeMove(new PlayCardMove(card));
        gameState.executeMove(new OrderUnitMove(infantry));
        gameState.executeMove(new ConfirmOrdersMove());

        // Act: Move infantry 2 hexes
        const infantryEnd = hexOf(7, 5); // 2 hexes from start, 1 hex from enemy
        gameState.executeMove(new MoveUnitMove(infantryStart, infantryEnd));

        // Assert: Phase auto-advanced to BattlePhase
        expect(gameState.activePhase.name).toBe("Battle");

        // Assert: Infantry IS marked to skip battle
        expect(gameState.unitSkipsBattle(infantry)).toBe(true);

        // Assert: NO BattleMove against enemy is available
        const legalMoves = gameState.legalMoves();
        const battleMove = legalMoves.find(m =>
            m instanceof BattleMove &&
            m.fromUnit === infantry &&
            m.toUnit === enemy
        );
        expect(battleMove).toBeUndefined();
    });

    test("Armor entering Woods cannot battle (terrain rule)", () => {
        // Arrange
        const deck = Deck.createFromComposition([[ProbeCenter, 60]]);
        const gameState = new GameState(deck);
        gameState.drawCards(3, CardLocation.BOTTOM_PLAYER_HAND);

        const armor = new Armor(Side.ALLIES);
        const enemy = new Infantry(Side.AXIS);
        const armorStart = hexOf(5, 5);
        const woodsPos = hexOf(6, 5);
        const enemyPos = hexOf(7, 5);

        gameState.placeUnit(armorStart, armor);
        gameState.placeUnit(enemyPos, enemy);
        gameState.setTerrain(woodsPos, woodsTerrain);
        gameState.finishSetup();

        // Play card and order armor
        const card = gameState.getCardsInLocation(CardLocation.BOTTOM_PLAYER_HAND)[0];
        gameState.executeMove(new PlayCardMove(card));
        gameState.executeMove(new OrderUnitMove(armor));
        gameState.executeMove(new ConfirmOrdersMove());

        // Act: Move armor into woods
        gameState.executeMove(new MoveUnitMove(armorStart, woodsPos));

        // Assert: Phase auto-advanced to BattlePhase
        expect(gameState.activePhase.name).toBe("Battle");

        // Assert: Armor IS marked to skip battle (terrain restriction applies to all unit types)
        expect(gameState.unitSkipsBattle(armor)).toBe(true);

        // Assert: NO BattleMove available
        const legalMoves = gameState.legalMoves();
        const battleMove = legalMoves.find(m =>
            m instanceof BattleMove &&
            m.fromUnit === armor
        );
        expect(battleMove).toBeUndefined();
    });

    test("Armor respects stop-terrain within 3-hex range", () => {
        // Arrange
        const deck = Deck.createFromComposition([[ProbeCenter, 60]]);
        const gameState = new GameState(deck);
        gameState.drawCards(3, CardLocation.BOTTOM_PLAYER_HAND);

        const armor = new Armor(Side.ALLIES);
        const armorStart = hexOf(5, 5);
        const woodsPos = hexOf(6, 5); // 1 hex east

        gameState.placeUnit(armorStart, armor);
        gameState.setTerrain(woodsPos, woodsTerrain);
        gameState.finishSetup();

        // Play card and order armor
        const card = gameState.getCardsInLocation(CardLocation.BOTTOM_PLAYER_HAND)[0];
        gameState.executeMove(new PlayCardMove(card));
        gameState.executeMove(new OrderUnitMove(armor));
        gameState.executeMove(new ConfirmOrdersMove());

        // Assert: Can move TO woods (1 hex)
        const legalMoves = gameState.legalMoves();
        const moveToWoods = legalMoves.find(m =>
            m instanceof MoveUnitMove &&
            m.to === hexOf(6, 5)
        );
        expect(moveToWoods).toBeDefined();

        // Assert: Cannot reach hex directly beyond woods along same path
        // (8,5) is 3 hexes east, but path goes through woods which stops movement
        const threeHexesThroughWoods = legalMoves.find(m =>
            m instanceof MoveUnitMove &&
            m.to === hexOf(8, 5)
        );
        expect(threeHexesThroughWoods).toBeUndefined();

        // Note: (7,5) may be reachable via alternate paths (around the woods)
        // so we don't test that specifically - the key is that the direct path is blocked
    });
});
