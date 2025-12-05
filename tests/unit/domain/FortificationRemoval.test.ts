// ABOUTME: Unit tests for fortification removal when units move
// ABOUTME: Tests different removal behaviors for Sandbag vs Hedgehog fortifications

import {describe, expect, test} from 'vitest';
import {GameState} from '../../../src/domain/GameState';
import {Deck} from '../../../src/domain/Deck';
import {HexCoord} from '../../../src/utils/hex';
import {Infantry} from '../../../src/domain/Unit';
import {Side} from '../../../src/domain/Player';
import {sandbagAllies, hedgehog} from '../../../src/domain/fortifications/Fortification';

interface FortificationRemovalCase {
    name: string;
    fortification: typeof sandbagAllies | typeof hedgehog;
    shouldRemove: boolean;
}

describe('Fortification removal on unit movement', () => {
    const cases: FortificationRemovalCase[] = [
        {
            name: 'sandbag is removed when unit moves',
            fortification: sandbagAllies,
            shouldRemove: true,
        },
        {
            name: 'hedgehog remains when unit moves',
            fortification: hedgehog,
            shouldRemove: false,
        },
    ];

    test.each(cases)('$name', ({fortification, shouldRemove}) => {
        const gameState = new GameState(new Deck([]));
        const unit = new Infantry(Side.ALLIES);
        const from = new HexCoord(0, 0);
        const to = new HexCoord(1, 0);

        // Setup: place unit and fortification
        gameState.placeUnit(from, unit);
        gameState.setFortification(from, fortification);

        // Verify fortification exists before move
        expect(gameState.getFortification(from)).toBe(fortification);

        // Action: move unit
        gameState.moveUnit(from, to);

        // Assert: check if fortification was removed or remains
        if (shouldRemove) {
            expect(gameState.getFortification(from)).toBeUndefined();
        } else {
            expect(gameState.getFortification(from)).toBe(fortification);
        }
    });
});

describe('Fortification persistence when unit does not move', () => {
    test('sandbag persists when unit stays in place', () => {
        const gameState = new GameState(new Deck([]));
        const unit = new Infantry(Side.ALLIES);
        const coord = new HexCoord(0, 0);

        gameState.placeUnit(coord, unit);
        gameState.setFortification(coord, sandbagAllies);

        // Verify fortification exists
        expect(gameState.getFortification(coord)).toBe(sandbagAllies);

        // Unit doesn't move - fortification should remain
        // (we're not calling moveUnit, so the fortification should persist)
        expect(gameState.getFortification(coord)).toBe(sandbagAllies);
    });

    test('hedgehog persists when unit stays in place', () => {
        const gameState = new GameState(new Deck([]));
        const unit = new Infantry(Side.ALLIES);
        const coord = new HexCoord(0, 0);

        gameState.placeUnit(coord, unit);
        gameState.setFortification(coord, hedgehog);

        // Verify fortification exists
        expect(gameState.getFortification(coord)).toBe(hedgehog);

        // Unit doesn't move - fortification should remain
        expect(gameState.getFortification(coord)).toBe(hedgehog);
    });
});

describe('Fortification in hex without unit', () => {
    test('sandbag can exist in empty hex', () => {
        const gameState = new GameState(new Deck([]));
        const coord = new HexCoord(0, 0);

        // Place fortification in empty hex
        gameState.setFortification(coord, sandbagAllies);

        // Verify fortification exists
        expect(gameState.getFortification(coord)).toBe(sandbagAllies);
    });

    test('hedgehog can exist in empty hex', () => {
        const gameState = new GameState(new Deck([]));
        const coord = new HexCoord(0, 0);

        // Place fortification in empty hex
        gameState.setFortification(coord, hedgehog);

        // Verify fortification exists
        expect(gameState.getFortification(coord)).toBe(hedgehog);
    });
});

describe('Unit moving into hex with fortification', () => {
    test('unit can move into hex with sandbag', () => {
        const gameState = new GameState(new Deck([]));
        const unit = new Infantry(Side.ALLIES);
        const from = new HexCoord(0, 0);
        const to = new HexCoord(1, 0);

        // Setup: place fortification at destination
        gameState.placeUnit(from, unit);
        gameState.setFortification(to, sandbagAllies);

        // Move unit into hex with fortification
        gameState.moveUnit(from, to);

        // Fortification at destination should remain (onUnitMoving is only called at source hex)
        expect(gameState.getFortification(to)).toBe(sandbagAllies);
        // Unit is now at destination
        expect(gameState.getUnitAt(to)).toBe(unit);
    });

    test('unit can move into hex with hedgehog', () => {
        const gameState = new GameState(new Deck([]));
        const unit = new Infantry(Side.ALLIES);
        const from = new HexCoord(0, 0);
        const to = new HexCoord(1, 0);

        // Setup: place fortification at destination
        gameState.placeUnit(from, unit);
        gameState.setFortification(to, hedgehog);

        // Move unit into hex with fortification
        gameState.moveUnit(from, to);

        // Fortification at destination should remain
        expect(gameState.getFortification(to)).toBe(hedgehog);
        // Unit is now at destination
        expect(gameState.getUnitAt(to)).toBe(unit);
    });
});
