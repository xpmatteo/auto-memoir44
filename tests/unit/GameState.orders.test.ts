// ABOUTME: Unit tests for GameState class
// ABOUTME: Tests current card management, unit positioning, and game state operations

import {describe, it, expect} from "vitest";
import {GameState} from "../../src/domain/GameState";
import {Side} from "../../src/domain/Player";
import {Deck} from "../../src/domain/Deck";
import {Infantry} from "../../src/domain/Unit";
import {HexCoord} from "../../src/utils/hex";

describe("GameState ordering units", () => {
    it("has no ordered units by default", () => {
        const deck = Deck.createStandardDeck();
        const gameState = new GameState(deck);
        const unit = new Infantry(Side.ALLIES);
        gameState.placeUnit(new HexCoord(0, 0), unit)

        expect(gameState.getOrderedUnits()).toEqual([]);
        expect(gameState.getOrderedUnitsWithPositions()).toEqual([]);
    });

    it("toggles an ordered unit", () => {
        const deck = Deck.createStandardDeck();
        const gameState = new GameState(deck);
        const unit1 = new Infantry(Side.ALLIES);
        const unit2 = new Infantry(Side.ALLIES);
        gameState.placeUnit(new HexCoord(0, 0), unit1);
        gameState.placeUnit(new HexCoord(0, 1), unit2);

        gameState.toggleUnitOrdered(unit1);

        expect(gameState.getOrderedUnits()).toEqual([unit1]);
        expect(gameState.getOrderedUnitsWithPositions()).toEqual([{coord: new HexCoord(0, 0), unit: unit1}]);
    });

    it("toggles an ordered unit back to not ordered", () => {
        const deck = Deck.createStandardDeck();
        const gameState = new GameState(deck);
        const unit = new Infantry(Side.ALLIES);
        gameState.placeUnit(new HexCoord(0, 0), unit)

        gameState.toggleUnitOrdered(unit);
        gameState.toggleUnitOrdered(unit);

        expect(gameState.getOrderedUnits()).toEqual([]);
        expect(gameState.getOrderedUnitsWithPositions()).toEqual([]);
    });

});
