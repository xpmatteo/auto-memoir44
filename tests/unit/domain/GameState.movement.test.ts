// ABOUTME: Unit tests for GameState movement tracking
// ABOUTME: Tests marking units as moved and clearing moved state on turn end

import {describe, expect, it} from "vitest";
import {GameState} from "../../../src/domain/GameState";
import {Deck} from "../../../src/domain/Deck";
import {Infantry} from "../../../src/domain/Unit";
import {Side} from "../../../src/domain/Player";
import {HexCoord} from "../../../src/utils/hex";
import {CardLocation} from "../../../src/domain/CommandCard";
import {OrderUnitsPhase} from "../../../src/domain/phases/OrderUnitsPhase";
import {Section} from "../../../src/domain/Section";

describe("GameState movement tracking", () => {
    it("should mark a unit as moved", () => {
        const deck = Deck.createStandardDeck();
        const gameState = new GameState(deck);
        const unit = new Infantry(Side.ALLIES);
        const coord = new HexCoord(5, 3);

        gameState.placeUnit(coord, unit);
        gameState.markUnitMoved(unit);

        expect(gameState.isUnitMoved(unit)).toBe(true);
    });

    it("should return false for units that have not moved", () => {
        const deck = Deck.createStandardDeck();
        const gameState = new GameState(deck);
        const unit = new Infantry(Side.ALLIES);
        const coord = new HexCoord(5, 3);

        gameState.placeUnit(coord, unit);

        expect(gameState.isUnitMoved(unit)).toBe(false);
    });

    it("should clear moved units when turn ends", () => {
        const deck = Deck.createStandardDeck();
        const gameState = new GameState(deck);
        gameState.drawCards(3, CardLocation.BOTTOM_PLAYER_HAND);
        const [card] = gameState.getCardsInLocation(CardLocation.BOTTOM_PLAYER_HAND);

        const unit = new Infantry(Side.ALLIES);
        const coord = new HexCoord(5, 3);

        gameState.placeUnit(coord, unit);
        gameState.markUnitMoved(unit);
        expect(gameState.isUnitMoved(unit)).toBe(true);

        // Set up and complete turn
        gameState.setCurrentCard(card.id);
        gameState.replacePhase(new OrderUnitsPhase([Section.CENTER], 1));
        gameState.popPhase();

        expect(gameState.isUnitMoved(unit)).toBe(false);
    });

    it("should track multiple units independently", () => {
        const deck = Deck.createStandardDeck();
        const gameState = new GameState(deck);
        const unit1 = new Infantry(Side.ALLIES);
        const unit2 = new Infantry(Side.ALLIES);
        const coord1 = new HexCoord(5, 3);
        const coord2 = new HexCoord(6, 3);

        gameState.placeUnit(coord1, unit1);
        gameState.placeUnit(coord2, unit2);

        gameState.markUnitMoved(unit1);

        expect(gameState.isUnitMoved(unit1)).toBe(true);
        expect(gameState.isUnitMoved(unit2)).toBe(false);
    });
});

describe("GameState battle restriction tracking", () => {
    it("should mark a unit to skip battle", () => {
        const deck = Deck.createStandardDeck();
        const gameState = new GameState(deck);
        const unit = new Infantry(Side.ALLIES);
        const coord = new HexCoord(5, 3);

        gameState.placeUnit(coord, unit);
        gameState.markUnitSkipsBattle(unit);

        expect(gameState.unitSkipsBattle(unit)).toBe(true);
    });

    it("should return false for units that do not skip battle", () => {
        const deck = Deck.createStandardDeck();
        const gameState = new GameState(deck);
        const unit = new Infantry(Side.ALLIES);
        const coord = new HexCoord(5, 3);

        gameState.placeUnit(coord, unit);

        expect(gameState.unitSkipsBattle(unit)).toBe(false);
    });

    it("should clear battle restrictions when turn ends", () => {
        const deck = Deck.createStandardDeck();
        const gameState = new GameState(deck);
        gameState.drawCards(3, CardLocation.BOTTOM_PLAYER_HAND);
        const [card] = gameState.getCardsInLocation(CardLocation.BOTTOM_PLAYER_HAND);

        const unit = new Infantry(Side.ALLIES);
        const coord = new HexCoord(5, 3);

        gameState.placeUnit(coord, unit);
        gameState.markUnitSkipsBattle(unit);
        expect(gameState.unitSkipsBattle(unit)).toBe(true);

        // Set up and complete turn
        gameState.setCurrentCard(card.id);
        gameState.replacePhase(new OrderUnitsPhase([Section.CENTER], 1));
        gameState.popPhase();

        expect(gameState.unitSkipsBattle(unit)).toBe(false);
    });

    it("should track battle restrictions for multiple units independently", () => {
        const deck = Deck.createStandardDeck();
        const gameState = new GameState(deck);
        const unit1 = new Infantry(Side.ALLIES);
        const unit2 = new Infantry(Side.ALLIES);
        const coord1 = new HexCoord(5, 3);
        const coord2 = new HexCoord(6, 3);

        gameState.placeUnit(coord1, unit1);
        gameState.placeUnit(coord2, unit2);

        gameState.markUnitSkipsBattle(unit1);

        expect(gameState.unitSkipsBattle(unit1)).toBe(true);
        expect(gameState.unitSkipsBattle(unit2)).toBe(false);
    });
});
