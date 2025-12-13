// ABOUTME: Acceptance tests for AI battle move prioritization
// ABOUTME: Verifies AI prioritizes battles by: 1) fewer targets, 2) weaker targets, 3) most threatened targets

import {expect, test} from "vitest";
import {GameState} from "../../../src/domain/GameState";
import {Deck} from "../../../src/domain/Deck";
import {ProbeCenter} from "../../../src/domain/cards/CommandCard";
import {SeededRNG} from "../../../src/adapters/RNG";
import {Dice} from "../../../src/domain/Dice";
import {RandomAIPlayer} from "../../../src/ai/AIPlayer";
import {Armor, Infantry} from "../../../src/domain/Unit";
import {HexCoord} from "../../../src/utils/hex";
import {Side} from "../../../src/domain/Player";
import {BattlePhase} from "../../../src/domain/phases/BattlePhase";

import {BattleMove} from "../../../src/domain/moves/BattleMove";

test("AI prioritizes unit with fewer target options", () => {
    // Given: Two ordered AXIS units, one with 1 target option, one with 2 target options
    const seed = 12345;
    const rng = new SeededRNG(seed);
    const deck = Deck.createFromComposition([[ProbeCenter, 60]]);
    const gameState = new GameState(deck, new Dice(() => rng.random()));

    // Setup AXIS units (TOP player)
    const unitWithOneTarget = new Infantry(Side.AXIS, 1);
    const unitWithTwoTargets = new Infantry(Side.AXIS, 2);
    gameState.placeUnit(new HexCoord(5, 2), unitWithOneTarget);
    gameState.placeUnit(new HexCoord(7, 2), unitWithTwoTargets);

    // Setup ALLIES targets
    const target1 = new Infantry(Side.ALLIES, 11); // Only reachable by unitWithOneTarget
    const target2 = new Infantry(Side.ALLIES, 12); // Reachable by both units
    gameState.placeUnit(new HexCoord(5, 4), target1); // Distance 2 from unitWithOneTarget
    gameState.placeUnit(new HexCoord(7, 4), target2); // Distance 2 from unitWithTwoTargets

    // Order both units and set active player to TOP
    gameState.orderUnit(unitWithOneTarget);
    gameState.orderUnit(unitWithTwoTargets);
    gameState.switchActivePlayer(); // Switch to TOP player
    gameState.pushPhase(new BattlePhase());

    // When: AI selects a battle move
    const aiPlayer = new RandomAIPlayer(rng);
    const legalMoves = gameState.legalMoves();
    const battleMoves = legalMoves.filter(m => m instanceof BattleMove) as BattleMove[];

    // Verify we have 3 battle moves: unitWithOneTarget -> target1, unitWithTwoTargets -> target1, unitWithTwoTargets -> target2
    expect(battleMoves.length).toBe(3);

    const selectedMove = aiPlayer.selectMove(gameState.clone(), legalMoves) as BattleMove;

    // Then: AI should select the unit with fewer options (unitWithOneTarget)
    expect(selectedMove.fromUnit.id).toBe(unitWithOneTarget.id);
});

test("AI breaks ties by choosing weakest target", () => {
    // Given: Two ordered AXIS units, both with same number of targets, but targets have different strengths
    const seed = 54321;
    const rng = new SeededRNG(seed);
    const deck = Deck.createFromComposition([[ProbeCenter, 60]]);
    const gameState = new GameState(deck, new Dice(() => rng.random()));

    // Setup AXIS unit
    const attacker = new Infantry(Side.AXIS, 1);
    gameState.placeUnit(new HexCoord(6, 2), attacker);

    // Setup ALLIES targets with different strengths
    const strongTarget = new Infantry(Side.ALLIES, 11);
    const weakTarget = new Infantry(Side.ALLIES, 12);
    gameState.placeUnit(new HexCoord(5, 4), strongTarget);
    gameState.placeUnit(new HexCoord(7, 4), weakTarget);

    // Damage the weak target to reduce its strength
    gameState.setUnitCurrentStrength(weakTarget, 2); // Reduce from 4 to 2

    // Order unit and set active player to TOP
    gameState.orderUnit(attacker);
    gameState.switchActivePlayer(); // Switch to TOP player
    gameState.pushPhase(new BattlePhase());

    // When: AI selects a battle move
    const aiPlayer = new RandomAIPlayer(rng);
    const legalMoves = gameState.legalMoves();
    const selectedMove = aiPlayer.selectMove(gameState.clone(), legalMoves) as BattleMove;

    // Then: AI should target the weaker unit
    expect(selectedMove.toUnit.id).toBe(weakTarget.id);
});

test("AI breaks ties by choosing most threatened target", () => {
    // Given: Two ordered AXIS units that can both attack two targets,
    // targets have same strength, but one target is threatened by more total dice
    const seed = 99999;
    const rng = new SeededRNG(seed);
    const deck = Deck.createFromComposition([[ProbeCenter, 60]]);
    const gameState = new GameState(deck, new Dice(() => rng.random()));

    // Setup AXIS units
    const attacker1 = new Armor(Side.AXIS, 1); // Armor rolls more dice at range
    const attacker2 = new Armor(Side.AXIS, 2);
    gameState.placeUnit(new HexCoord(5, 2), attacker1);
    gameState.placeUnit(new HexCoord(7, 2), attacker2);

    // Setup ALLIES targets
    const target1 = new Infantry(Side.ALLIES, 11); // Threatened by both attackers
    const target2 = new Infantry(Side.ALLIES, 12); // Only threatened by one attacker
    gameState.placeUnit(new HexCoord(6, 4), target1); // Distance 2 from both
    gameState.placeUnit(new HexCoord(9, 3), target2); // Distance 2 from attacker2 only

    // Order both units and set active player to TOP
    gameState.orderUnit(attacker1);
    gameState.orderUnit(attacker2);
    gameState.switchActivePlayer(); // Switch to TOP player
    gameState.pushPhase(new BattlePhase());

    // When: AI selects a battle move
    const aiPlayer = new RandomAIPlayer(rng);
    const legalMoves = gameState.legalMoves();
    const battleMoves = legalMoves.filter(m => m instanceof BattleMove) as BattleMove[];

    // Verify setup: should have 3 battle moves
    // attacker1 -> target1, attacker2 -> target1, attacker2 -> target2
    expect(battleMoves.length).toBe(3);

    const selectedMove = aiPlayer.selectMove(gameState.clone(), legalMoves) as BattleMove;

    // Then: AI should target the more threatened unit (target1, which is threatened by both attackers)
    expect(selectedMove.toUnit.id).toBe(target1.id);
});
