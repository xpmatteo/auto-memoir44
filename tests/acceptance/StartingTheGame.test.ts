// ABOUTME: Acceptance tests for ordering units with command cards
// ABOUTME: Tests section-based unit ordering when cards are played

import {describe, expect, it} from "vitest";
import {GameState} from "../../src/domain/GameState";
import {Deck} from "../../src/domain/Deck";
import {AssaultLeft, CardLocation} from "../../src/domain/CommandCard";
import {PlayCardMove} from "../../src/domain/Move";
import {Position, Side} from "../../src/domain/Player";
import {Infantry, Unit} from "../../src/domain/Unit";

describe("At game start", () => {
    describe("Legal moves for each card played", () => {
        it("Cards available for bottom player", () => {
            let cards = [
                new AssaultLeft(),
                new AssaultLeft(),
                new AssaultLeft(),
            ];
            const deck = new Deck(cards);
            const gameState = new GameState(deck);
            gameState.drawCards(3, CardLocation.BOTTOM_PLAYER_HAND);

            let actual = gameState.legalMoves();

            expect(gameState.activePlayer.position).toBe(Position.BOTTOM)
            expect(actual).toEqual([
                new PlayCardMove(cards[0]),
                new PlayCardMove(cards[1]),
                new PlayCardMove(cards[2]),
            ]);
        });
    });

    describe("Activating one card", () => {
        it("When selecting AssaultLeft, all units in the left section are ordered", () => {
            let cards = [
                new AssaultLeft(),
            ];
            const deck = new Deck(cards);
            const gameState = new GameState(deck);
            const unitInLeft = placeUnitInLeftSection(gameState);
            gameState.drawCards(1, CardLocation.BOTTOM_PLAYER_HAND);
            placeUnitInCenterSection(gameState);

            gameState.executeMove(new PlayCardMove(cards[0]));

            expect(gameState.getCurrentCard()).toEqual(cards[0]);
            expect(gameState.getOrderedUnits()).toEqual([
                unitInLeft,
            ]);
        });
    });
});

function placeUnitInCenterSection(gameState: GameState): Unit {
    let unit = new Infantry(gameState.activePlayer.side);
    gameState.placeUnit({q: 2, r: 8}, unit);
    return unit;
}

function placeUnitInLeftSection(gameState: GameState): Unit {
    let unit = new Infantry(gameState.activePlayer.side);
    gameState.placeUnit({q: -4, r: 8}, unit);
    return unit;
}
