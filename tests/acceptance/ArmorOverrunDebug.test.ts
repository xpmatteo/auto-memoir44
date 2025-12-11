// ABOUTME: Debug test to reproduce the armor overrun bug from the screenshot
// ABOUTME: Creates a scenario with armor surrounded by 4 infantry at distance 1

import {describe, test, expect} from 'vitest';
import {GameState} from '../../src/domain/GameState';
import {Deck} from '../../src/domain/Deck';
import {Armor, Infantry} from '../../src/domain/Unit';
import {Side} from '../../src/domain/Player';
import {HexCoord} from '../../src/utils/hex';
import {BattleMove} from '../../src/domain/moves/BattleMove';
import {TakeGroundMove} from '../../src/domain/moves/TakeGroundMove';
import {diceReturningAlways, RESULT_INFANTRY} from '../../src/domain/Dice';

describe('Armor Overrun Bug Reproduction', () => {
    test('armor takes ground and should offer battles against 4 surrounding infantry', () => {
        // Setup: Armor at (5,5), Enemy at (6,5), then 4 enemies surrounding (6,5)
        const deck = Deck.createStandardDeck();
        const dice = diceReturningAlways([RESULT_INFANTRY, RESULT_INFANTRY, RESULT_INFANTRY]);
        const gameState = new GameState(deck, dice);

        const armor = new Armor(Side.ALLIES, 3);
        const enemy1 = new Infantry(Side.AXIS, 3);  // Will be eliminated

        // 4 infantry surrounding the position armor will take
        const enemy2 = new Infantry(Side.AXIS, 4);  // North
        const enemy3 = new Infantry(Side.AXIS, 4);  // Northeast
        const enemy4 = new Infantry(Side.AXIS, 4);  // Southeast
        const enemy5 = new Infantry(Side.AXIS, 4);  // South

        const armorStart = new HexCoord(5, 5);
        const enemy1Coord = new HexCoord(6, 5);  // Adjacent to armor, will be eliminated

        // 4 positions adjacent to (6,5) where armor will advance
        const enemy2Coord = new HexCoord(6, 4);   // North of (6,5)
        const enemy3Coord = new HexCoord(7, 4);   // Northeast of (6,5)
        const enemy4Coord = new HexCoord(7, 5);   // East of (6,5)
        const enemy5Coord = new HexCoord(6, 6);   // South of (6,5)

        gameState.placeUnit(armorStart, armor);
        gameState.placeUnit(enemy1Coord, enemy1);
        gameState.placeUnit(enemy2Coord, enemy2);
        gameState.placeUnit(enemy3Coord, enemy3);
        gameState.placeUnit(enemy4Coord, enemy4);
        gameState.placeUnit(enemy5Coord, enemy5);
        gameState.finishSetup();

        gameState.orderUnit(armor);

        console.log('=== INITIAL STATE ===');
        console.log(`Armor at ${armorStart.q},${armorStart.r}`);
        console.log(`Enemy1 (to be eliminated) at ${enemy1Coord.q},${enemy1Coord.r}`);
        console.log(`Enemy2 at ${enemy2Coord.q},${enemy2Coord.r}`);
        console.log(`Enemy3 at ${enemy3Coord.q},${enemy3Coord.r}`);
        console.log(`Enemy4 at ${enemy4Coord.q},${enemy4Coord.r}`);
        console.log(`Enemy5 at ${enemy5Coord.q},${enemy5Coord.r}`);

        // Execute battle against enemy1 (should eliminate)
        console.log('\n=== EXECUTING BATTLE ===');
        const battleMove = new BattleMove(armor, enemy1, 3);
        battleMove.execute(gameState);

        // Assert: Enemy1 eliminated, TakeGroundPhase active
        expect(gameState.getUnitAt(enemy1Coord)).toBeUndefined();
        expect(gameState.activePhase.name).toBe('Take Ground');

        // Execute TakeGroundMove
        console.log('\n=== EXECUTING TAKE GROUND ===');
        const legalMoves = gameState.legalMoves();
        const takeGroundMove = legalMoves.find(m => m instanceof TakeGroundMove);
        expect(takeGroundMove).toBeDefined();

        gameState.executeMove(takeGroundMove!);

        // Assert: Armor moved to (6,5), ArmorOverrunPhase active
        expect(gameState.getUnitAt(armorStart)).toBeUndefined();
        expect(gameState.getUnitAt(enemy1Coord)).toBe(armor);
        expect(gameState.activePhase.name).toBe('Armor Overrun');

        console.log('\n=== IN ARMOR OVERRUN PHASE ===');
        console.log(`Armor now at ${enemy1Coord.q},${enemy1Coord.r}`);
        console.log('Getting legal moves...\n');

        // Assert: Legal moves include battles against ALL 4 surrounding enemies
        const overrunMoves = gameState.legalMoves();
        const battleMoves = overrunMoves.filter(m => m instanceof BattleMove) as BattleMove[];

        console.log(`\n=== RESULT ===`);
        console.log(`Found ${battleMoves.length} battle moves (expected 4)`);
        battleMoves.forEach((bm, i) => {
            const targetCoord = [enemy2Coord, enemy3Coord, enemy4Coord, enemy5Coord].find(
                c => gameState.getUnitAt(c) === bm.toUnit
            );
            console.log(`  Battle ${i+1}: vs ${bm.toUnit.type} at ${targetCoord?.q},${targetCoord?.r} with ${bm.dice} dice`);
        });

        // Should have exactly 4 battle moves (one against each surrounding enemy)
        expect(battleMoves.length).toBe(4);
    });
});
