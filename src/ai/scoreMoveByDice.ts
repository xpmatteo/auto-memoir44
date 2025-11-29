// ABOUTME: Score a potential move by how many dice can be rolled in that position
// ABOUTME: It is a part of the AI player strategy

import type {GameState} from "../domain/GameState";
import type {HexCoord} from "../utils/hex";
import {PhaseType} from "../domain/phases/Phase";
import {BattleMove} from "../domain/Move";

export function scoreMoveByDice(gameState: GameState, from: HexCoord, to: HexCoord) {
    // Step 2: Clone the game state
    const clonedState = gameState.clone();

    // Step 3: Move unit to target position
    if (from.q !== to.q || from.r !== to.r) {
        clonedState.moveUnit(from, to);
    }

    // Step 4: Mark unit as ordered (get unit from cloned state)
    const unitInClone = clonedState.getUnitAt(to);
    if (!unitInClone) {
        throw new Error("Should not happen: we lost the unit")
    }

    // Only toggle if not already ordered
    if (!clonedState.isUnitOrdered(unitInClone)) {
        clonedState.toggleUnitOrdered(unitInClone);
    }

    // Step 5: Verify we're in BATTLE phase
    if (clonedState.activePhase.type !== PhaseType.BATTLE) {
        throw new Error("Expected gameState to be in BATTLE phase");
    }

    // Step 6: Get legal moves and filter to BattleMove
    const legalMoves = clonedState.legalMoves();
    const battleMoves = legalMoves.filter(move => move instanceof BattleMove) as BattleMove[];

    // Step 7: Filter to only moves from our unit
    const ourBattleMoves = battleMoves.filter(move => move.fromUnit.id === unitInClone.id);

    // Step 8: Sum dice weighted by target strength and return score
    // Lower strength targets are more valuable (closer to elimination)
    // Strength 4: 100/die, Strength 3: 200/die, Strength 2: 300/die, Strength 1: 400/die
    const totalScore = ourBattleMoves.reduce((sum, move) => {
        const targetStrength = clonedState.getUnitCurrentStrength(move.toUnit);
        const diceValue = 100 * (5 - targetStrength);
        return sum + (move.dice * diceValue);
    }, 0);
    return totalScore;
}
