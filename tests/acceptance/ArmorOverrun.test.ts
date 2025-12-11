// ABOUTME: Acceptance tests for armor overrun mechanic
// ABOUTME: Tests the full flow of armor units getting additional attacks after taking ground

import {describe, test, expect} from 'vitest';
import {GameState} from '../../src/domain/GameState';
import {Deck} from '../../src/domain/Deck';
import {Armor, Infantry} from '../../src/domain/Unit';
import {Side} from '../../src/domain/Player';
import {HexCoord} from '../../src/utils/hex';
import {BattleMove} from '../../src/domain/moves/BattleMove';
import {TakeGroundMove} from '../../src/domain/moves/TakeGroundMove';
import {RetreatMove} from '../../src/domain/moves/Move';
import {diceReturningAlways, diceReturning, RESULT_INFANTRY, RESULT_FLAG} from '../../src/domain/Dice';

describe('Armor Overrun', () => {
    test('armor eliminates enemy in close combat, takes ground, then can attack again', () => {
        // Setup: Armor at (5,5), Enemy1 at (6,5), Enemy2 at (7,5)
        const deck = Deck.createStandardDeck();
        const dice = diceReturningAlways([RESULT_INFANTRY, RESULT_INFANTRY, RESULT_INFANTRY]);
        const gameState = new GameState(deck, dice);

        const armor = new Armor(Side.ALLIES, 3);
        const enemy1 = new Infantry(Side.AXIS, 3);
        const enemy2 = new Infantry(Side.AXIS, 3);

        const armorCoord = new HexCoord(5, 5);
        const enemy1Coord = new HexCoord(6, 5); // Adjacent to armor
        const enemy2Coord = new HexCoord(7, 5); // Adjacent to enemy1's position

        gameState.placeUnit(armorCoord, armor);
        gameState.placeUnit(enemy1Coord, enemy1);
        gameState.placeUnit(enemy2Coord, enemy2);

        // Execute close combat battle against enemy1 (3 dice, 3 hits = elimination)
        const battleMove = new BattleMove(armor, enemy1, 3);
        battleMove.execute(gameState);

        // Assert: Enemy1 eliminated, TakeGroundPhase active
        expect(gameState.getUnitAt(enemy1Coord)).toBeUndefined();
        expect(gameState.activePhase.name).toBe('Take Ground');

        // Execute TakeGroundMove
        const legalMoves = gameState.legalMoves();
        const takeGroundMove = legalMoves.find(m => m instanceof TakeGroundMove);
        expect(takeGroundMove).toBeDefined();

        gameState.executeMove(takeGroundMove!);

        // Assert: Armor moved to (6,5), ArmorOverrunPhase active
        expect(gameState.getUnitAt(armorCoord)).toBeUndefined();
        expect(gameState.getUnitAt(enemy1Coord)).toBe(armor);
        expect(gameState.activePhase.name).toBe('Armor Overrun');

        // Assert: Legal moves include battle against enemy2
        const overrunMoves = gameState.legalMoves();
        const overrunBattle = overrunMoves.find(m =>
            m instanceof BattleMove && (m as BattleMove).toUnit === enemy2
        );
        expect(overrunBattle).toBeDefined();
    });

    test('armor overrun prioritizes distance 1 targets', () => {
        // Setup: Armor at (5,5), Enemy1 at (4,5) (will be eliminated),
        // Enemy2 at (3,5) (distance 1 from (4,5)), Enemy3 at (2,5) (distance 2 from (4,5))
        const deck = Deck.createStandardDeck();
        const dice = diceReturningAlways([RESULT_INFANTRY, RESULT_INFANTRY, RESULT_INFANTRY]);
        const gameState = new GameState(deck, dice);

        const armor = new Armor(Side.ALLIES, 3);
        const enemy1 = new Infantry(Side.AXIS, 3);  // Will be eliminated
        const enemy2 = new Infantry(Side.AXIS, 3);  // Distance 1 from (4,5)
        const enemy3 = new Infantry(Side.AXIS, 3);  // Distance 2 from (4,5)

        const armorCoord = new HexCoord(5, 5);
        const enemy1Coord = new HexCoord(4, 5);  // Adjacent to armor
        const enemy2Coord = new HexCoord(3, 5);  // Adjacent to enemy1Coord
        const enemy3Coord = new HexCoord(2, 5);  // 2 away from enemy1Coord

        gameState.placeUnit(armorCoord, armor);
        gameState.placeUnit(enemy1Coord, enemy1);
        gameState.placeUnit(enemy2Coord, enemy2);
        gameState.placeUnit(enemy3Coord, enemy3);

        // Execute battle and take ground
        const battleMove = new BattleMove(armor, enemy1, 3);
        battleMove.execute(gameState);

        const takeGroundMove = gameState.legalMoves().find(m => m instanceof TakeGroundMove);
        expect(takeGroundMove).toBeDefined();
        gameState.executeMove(takeGroundMove!);

        // Assert: ArmorOverrunPhase active and only offers distance 1 target
        expect(gameState.activePhase.name).toBe('Armor Overrun');

        const overrunMoves = gameState.legalMoves();
        const battleMoves = overrunMoves.filter(m => m instanceof BattleMove) as BattleMove[];

        // Should have exactly 1 battle move (against enemy2 only, not enemy3)
        expect(battleMoves.length).toBe(1);
        expect(battleMoves[0].toUnit).toBe(enemy2);
    });

    test('armor overrun, then second take ground does NOT trigger another overrun', () => {
        // Setup: Armor at (5,5), Enemy1 at (6,5), Enemy2 at (7,5), Enemy3 at (8,5)
        const deck = Deck.createStandardDeck();
        const dice = diceReturningAlways([
            RESULT_INFANTRY, RESULT_INFANTRY, RESULT_INFANTRY,  // First battle
            RESULT_INFANTRY, RESULT_INFANTRY, RESULT_INFANTRY   // Second battle
        ]);
        const gameState = new GameState(deck, dice);

        const armor = new Armor(Side.ALLIES, 3);
        const enemy1 = new Infantry(Side.AXIS, 3);
        const enemy2 = new Infantry(Side.AXIS, 3);
        const enemy3 = new Infantry(Side.AXIS, 3);  // Third enemy to test no further overrun

        const armorCoord = new HexCoord(5, 5);
        const enemy1Coord = new HexCoord(6, 5);
        const enemy2Coord = new HexCoord(7, 5);
        const enemy3Coord = new HexCoord(8, 5);

        gameState.placeUnit(armorCoord, armor);
        gameState.placeUnit(enemy1Coord, enemy1);
        gameState.placeUnit(enemy2Coord, enemy2);
        gameState.placeUnit(enemy3Coord, enemy3);

        // Execute first battle and take ground
        const battleMove1 = new BattleMove(armor, enemy1, 3);
        battleMove1.execute(gameState);

        const takeGroundMove1 = gameState.legalMoves().find(m => m instanceof TakeGroundMove);
        expect(takeGroundMove1).toBeDefined();
        gameState.executeMove(takeGroundMove1!);

        // Now in ArmorOverrunPhase - execute overrun battle that eliminates enemy2
        expect(gameState.activePhase.name).toBe('Armor Overrun');

        const overrunBattle = gameState.legalMoves().find(m =>
            m instanceof BattleMove && (m as BattleMove).toUnit === enemy2
        );
        expect(overrunBattle).toBeDefined();
        gameState.executeMove(overrunBattle!);

        // Assert: Second TakeGroundPhase offered
        expect(gameState.activePhase.name).toBe('Take Ground');

        // Execute second TakeGroundMove
        const takeGroundMove2 = gameState.legalMoves().find(m => m instanceof TakeGroundMove);
        expect(takeGroundMove2).toBeDefined();
        gameState.executeMove(takeGroundMove2!);

        // Assert: NO ArmorOverrunPhase pushed (back to previous phase, not overrun)
        expect(gameState.activePhase.name).not.toBe('Armor Overrun');
    });

    test('infantry takes ground, no overrun offered', () => {
        // Setup: Infantry at (5,5), Enemy1 at (6,5), Enemy2 at (7,5)
        const deck = Deck.createStandardDeck();
        const dice = diceReturningAlways([RESULT_INFANTRY, RESULT_INFANTRY, RESULT_INFANTRY]);
        const gameState = new GameState(deck, dice);

        const infantry = new Infantry(Side.ALLIES, 4);
        const enemy1 = new Infantry(Side.AXIS, 3);
        const enemy2 = new Infantry(Side.AXIS, 3);

        const infantryCoord = new HexCoord(5, 5);
        const enemy1Coord = new HexCoord(6, 5);
        const enemy2Coord = new HexCoord(7, 5);

        gameState.placeUnit(infantryCoord, infantry);
        gameState.placeUnit(enemy1Coord, enemy1);
        gameState.placeUnit(enemy2Coord, enemy2);

        // Execute battle and take ground
        const battleMove = new BattleMove(infantry, enemy1, 3);
        battleMove.execute(gameState);

        const takeGroundMove = gameState.legalMoves().find(m => m instanceof TakeGroundMove);
        expect(takeGroundMove).toBeDefined();
        gameState.executeMove(takeGroundMove!);

        // Assert: No ArmorOverrunPhase (infantry doesn't overrun)
        expect(gameState.activePhase.name).not.toBe('Armor Overrun');
    });

    test('armor overrun allows only ONE battle, then phase ends', () => {
        // Setup: Armor at (5,5), Enemy1 at (6,5), Enemy2 at (7,5), Enemy3 at (8,5)
        // Enemy2 and Enemy3 both have 4 strength, so one hit won't eliminate them
        const deck = Deck.createStandardDeck();
        const dice = diceReturningAlways([
            RESULT_INFANTRY, RESULT_INFANTRY, RESULT_INFANTRY,  // First battle eliminates enemy1
            RESULT_INFANTRY,  // Overrun battle damages but doesn't eliminate enemy2
        ]);
        const gameState = new GameState(deck, dice);

        const armor = new Armor(Side.ALLIES, 3);
        const enemy1 = new Infantry(Side.AXIS, 3);
        const enemy2 = new Infantry(Side.AXIS, 4);  // 4 strength - won't be eliminated by 1 hit
        const enemy3 = new Infantry(Side.AXIS, 4);

        const armorCoord = new HexCoord(5, 5);
        const enemy1Coord = new HexCoord(6, 5);
        const enemy2Coord = new HexCoord(7, 5);
        const enemy3Coord = new HexCoord(8, 5);

        gameState.placeUnit(armorCoord, armor);
        gameState.placeUnit(enemy1Coord, enemy1);
        gameState.placeUnit(enemy2Coord, enemy2);
        gameState.placeUnit(enemy3Coord, enemy3);

        // Execute first battle and take ground to enter overrun phase
        const battleMove1 = new BattleMove(armor, enemy1, 3);
        battleMove1.execute(gameState);

        const takeGroundMove = gameState.legalMoves().find(m => m instanceof TakeGroundMove);
        expect(takeGroundMove).toBeDefined();
        gameState.executeMove(takeGroundMove!);

        // Assert: In ArmorOverrunPhase
        expect(gameState.activePhase.name).toBe('Armor Overrun');

        // Execute ONE overrun battle (damages enemy2 but doesn't eliminate)
        const overrunBattle = gameState.legalMoves().find(m =>
            m instanceof BattleMove && (m as BattleMove).toUnit === enemy2
        ) as BattleMove;
        expect(overrunBattle).toBeDefined();
        gameState.executeMove(overrunBattle!);

        // Assert: Phase should have ended - back to regular Battle phase (not Armor Overrun anymore)
        expect(gameState.activePhase.name).not.toBe('Armor Overrun');

        // Assert: No more overrun battles offered (can't attack again during overrun)
        const movesAfterOverrun = gameState.legalMoves();
        const moreOverrunBattles = movesAfterOverrun.filter(m =>
            m instanceof BattleMove && (m as BattleMove).fromUnit === armor
        );

        // Should not be able to battle with the armor again (already attacked in overrun)
        expect(moreOverrunBattles.length).toBe(0);
    });

    test('armor overrun causes retreat, armor cannot battle again', () => {
        // Setup: Armor at (5,5), Enemy1 at (6,5), Enemy2 at (7,5)
        // Overrun battle will roll flags, causing enemy2 to retreat
        const deck = Deck.createStandardDeck();
        const dice = diceReturning([
            RESULT_INFANTRY, RESULT_INFANTRY, RESULT_INFANTRY,  // First battle (3 dice) eliminates enemy1
            RESULT_FLAG, RESULT_FLAG, RESULT_FLAG,  // Overrun battle (3 dice) causes enemy2 to retreat
        ]);
        const gameState = new GameState(deck, dice);

        const armor = new Armor(Side.ALLIES, 3);
        const enemy1 = new Infantry(Side.AXIS, 3);
        const enemy2 = new Infantry(Side.AXIS, 4);

        const armorCoord = new HexCoord(5, 5);
        const enemy1Coord = new HexCoord(6, 5);
        const enemy2Coord = new HexCoord(7, 5);

        gameState.placeUnit(armorCoord, armor);
        gameState.placeUnit(enemy1Coord, enemy1);
        gameState.placeUnit(enemy2Coord, enemy2);

        // Execute first battle and take ground to enter overrun phase
        const battleMove1 = new BattleMove(armor, enemy1, 3);
        battleMove1.execute(gameState);

        const takeGroundMove = gameState.legalMoves().find(m => m instanceof TakeGroundMove);
        expect(takeGroundMove).toBeDefined();
        gameState.executeMove(takeGroundMove!);

        // Assert: In ArmorOverrunPhase
        expect(gameState.activePhase.name).toBe('Armor Overrun');

        // Execute overrun battle that rolls flag (causes retreat)
        const overrunBattle = gameState.legalMoves().find(m =>
            m instanceof BattleMove && (m as BattleMove).toUnit === enemy2
        ) as BattleMove;
        expect(overrunBattle).toBeDefined();
        gameState.executeMove(overrunBattle!);

        // Assert: RetreatPhase is active (enemy must choose retreat hex)
        expect(gameState.activePhase.name).toBe('Retreat');

        // Execute retreat (this is a close combat retreat)
        const retreatMoves = gameState.legalMoves();
        const retreatMove = retreatMoves.find(m => m instanceof RetreatMove) as RetreatMove;
        expect(retreatMove).toBeDefined();
        gameState.executeMove(retreatMove!);

        // BUG: After close combat retreat, TakeGroundPhase is offered
        // If we take ground, it should NOT trigger another armor overrun
        if (gameState.activePhase.name === 'Take Ground') {
            const takeGround = gameState.legalMoves().find(m => m instanceof TakeGroundMove);
            if (takeGround) {
                gameState.executeMove(takeGround);
            }
        }

        // Assert: Back to BattlePhase (not ArmorOverrunPhase)
        expect(gameState.activePhase.name).not.toBe('Armor Overrun');

        // Assert: Armor cannot battle again (already used its overrun attack)
        const movesAfterRetreat = gameState.legalMoves();
        const armorBattles = movesAfterRetreat.filter(m =>
            m instanceof BattleMove && (m as BattleMove).fromUnit === armor
        );
        expect(armorBattles.length).toBe(0);
    });
});
