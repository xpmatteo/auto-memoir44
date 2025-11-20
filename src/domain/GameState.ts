// ABOUTME: Main game state with GameState pattern implementation
// ABOUTME: All game logic flows through legalMoves() and executeMove()

import { Player } from "./Player";
import { Deck } from "./Deck";
import { Move } from "./Move";
import { Unit } from "./Unit";

export class GameState {
  players: [Player, Player];
  activePlayerIndex: 0 | 1;
  deck: Deck;
  units: Unit[];

  constructor(
    players: [Player, Player],
    activePlayerIndex: 0 | 1,
    deck: Deck,
    units: Unit[] = []
  ) {
    this.players = players;
    this.activePlayerIndex = activePlayerIndex;
    this.deck = deck;
    this.units = units;
  }

  get activePlayer(): Player {
    return this.players[this.activePlayerIndex];
  }

  /**
   * Returns all valid moves for the active player
   * TODO: Implement actual move generation logic
   */
  legalMoves(): Move[] {
    return [];
  }

  /**
   * Applies a move and updates state
   * TODO: Implement actual move execution logic
   */
  executeMove(move: Move): void {
    // Placeholder for move execution
  }
}
