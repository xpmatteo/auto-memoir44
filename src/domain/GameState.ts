// ABOUTME: Main game state with GameState pattern implementation
// ABOUTME: All game logic flows through legalMoves() and executeMove()

import { Player } from "./Player";
import { Deck } from "./Deck";
import { Move } from "./Move";
import { Unit, coordToKey, keyToCoord } from "./Unit";
import type { HexCoord } from "../utils/hex";

export class GameState {
  players: [Player, Player];
  activePlayerIndex: 0 | 1;
  deck: Deck;
  unitPositions: Map<string, Unit>; // Map from coordinate key to Unit

  constructor(
    players: [Player, Player],
    activePlayerIndex: 0 | 1,
    deck: Deck,
    unitPositions: Map<string, Unit> = new Map()
  ) {
    this.players = players;
    this.activePlayerIndex = activePlayerIndex;
    this.deck = deck;
    this.unitPositions = unitPositions;
  }

  get activePlayer(): Player {
    return this.players[this.activePlayerIndex];
  }

  /**
   * Get the unit at a specific coordinate, or undefined if empty
   */
  getUnitAt(coord: HexCoord): Unit | undefined {
    return this.unitPositions.get(coordToKey(coord));
  }

  /**
   * Place a unit at a coordinate. Throws if coordinate is occupied.
   */
  placeUnit(coord: HexCoord, unit: Unit): void {
    const key = coordToKey(coord);
    if (this.unitPositions.has(key)) {
      throw new Error(
        `Cannot place unit at (${coord.q}, ${coord.r}): coordinate already occupied`
      );
    }
    this.unitPositions.set(key, unit);
  }

  /**
   * Move a unit from one coordinate to another. Throws if destination is occupied.
   */
  moveUnit(from: HexCoord, to: HexCoord): void {
    const fromKey = coordToKey(from);
    const toKey = coordToKey(to);

    const unit = this.unitPositions.get(fromKey);
    if (!unit) {
      throw new Error(`No unit at (${from.q}, ${from.r}) to move`);
    }

    if (this.unitPositions.has(toKey)) {
      throw new Error(
        `Cannot move unit to (${to.q}, ${to.r}): coordinate already occupied`
      );
    }

    this.unitPositions.delete(fromKey);
    this.unitPositions.set(toKey, unit);
  }

  /**
   * Remove a unit from the board
   */
  removeUnit(coord: HexCoord): void {
    this.unitPositions.delete(coordToKey(coord));
  }

  /**
   * Get all units with their coordinates
   */
  getAllUnitsWithPositions(): Array<{ coord: HexCoord; unit: Unit }> {
    return Array.from(this.unitPositions.entries()).map(([key, unit]) => ({
      coord: keyToCoord(key),
      unit,
    }));
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
