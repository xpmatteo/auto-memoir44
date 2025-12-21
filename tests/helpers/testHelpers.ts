// ABOUTME: Test helper functions for creating test fixtures
// ABOUTME: Provides convenient factory functions for tests

import {Deck} from "../../src/domain/Deck";
import {GameState} from "../../src/domain/GameState";
import {Dice} from "../../src/domain/Dice";
import {Move, PlayCardMove} from "../../src/domain/moves/Move";
import {Side} from "../../src/domain/Player";
import {resetUnitIdCounter} from "../../src/domain/Unit";
import {CardLocation} from "../../src/domain/cards/CommandCard";
import {parseAndSetupUnits} from "../../src/scenarios/Scenario";
import {SituatedUnit} from "../../src/domain/SituatedUnit";
import {hexOf} from "../../src/utils/hex";

/**
 * Create a GameState with a standard deck and default dice for testing
 */
export function createTestGameState(): GameState {
  const deck = Deck.createStandardDeck();
  // Use a simple incrementing random for deterministic tests
  let counter = 0;
  const testDice = new Dice(() => {
    counter = (counter + 1) % 6;
    return counter / 6;
  });
  return new GameState(deck, testDice);
}

export function toStringAndSort(moves: Move[]): string[] {
    return moves.map(move => move.toString()).sort();
}

export function setupGameForCommandCardTests(
    unitSetup: string[],
    cardType: any,
    activePlayer: Side = Side.ALLIES,
    diceToUse: Dice = new Dice()
): GameState {
    resetUnitIdCounter();
    const deck = Deck.createFromComposition([[cardType, 10]]);
    const gameState = new GameState(deck, diceToUse);
    gameState.drawCards(2, CardLocation.BOTTOM_PLAYER_HAND);
    gameState.drawCards(2, CardLocation.TOP_PLAYER_HAND);
    parseAndSetupUnits(gameState, unitSetup);
    if (activePlayer === Side.AXIS) {
        gameState.switchActivePlayer();
    }
    gameState.executeMove(new PlayCardMove(deck.peekOneCard()));
    return gameState;
}

export function getUnitAt(gameState: GameState, q: number, r: number): SituatedUnit {
    const allUnits = gameState.getAllUnits();
    const targetHex = hexOf(q, r);
    const found = allUnits.find(su => su.coord === targetHex);
    if (!found) {
        throw new Error(`No unit at (${q},${r})`);
    }
    return found;
}
