// ABOUTME: Score a potential move by how many dice can be rolled in that position
// ABOUTME: It is a part of the AI player strategy

import type {GameState} from "../domain/GameState";
import type {HexCoord} from "../utils/hex";
import {PhaseType} from "../domain/phases/Phase";
import {MoveUnitMove} from "../domain/moves/MoveUnitMove";
import {BattleMove} from "../domain/moves/BattleMove";

export function scoreMoveByDice(gameState: GameState, from: HexCoord, to: HexCoord) {
    const unit = gameState.getUnitAt(from);
    if (!unit) {
        throw new Error("Should not happen: unit not found")
    }

    // Expect unit to be ordered, or it will not get any BattleMove
    if (!gameState.isUnitOrdered(unit)) {
        throw new Error("Expecting units to be ordered");
    }

    // Verify we're in BATTLE phase, or we will get no BattleMove
    if (gameState.activePhase.type !== PhaseType.BATTLE) {
        throw new Error("Expected gameState to be in BATTLE phase");
    }

    // Move unit to target position (disable auto-advance to keep phase stable for scoring)
    const move = new MoveUnitMove(from, to, false);
    const clonedState = gameState.clone();
    clonedState.executeMove(move);

    // Get legal moves and filter to BattleMove
    const legalMoves = clonedState.legalMoves();
    const battleMoves = legalMoves.filter(move => move instanceof BattleMove) as BattleMove[];

    // Filter to only moves from our unit
    const ourBattleMoves = battleMoves.filter(move => move.fromUnit.id === unit.id);

    // Sum dice weighted by target strength and return score
    // Lower strength targets are more valuable (closer to elimination)
    // Strength 4: 100/die, Strength 3: 200/die, Strength 2: 300/die, Strength 1: 400/die
    const totalScore = ourBattleMoves.reduce((sum, move) => {
        const targetStrength = clonedState.getUnitCurrentStrength(move.toUnit);
        const diceValue = 100 * (5 - targetStrength);
        return sum + (move.dice * diceValue);
    }, 0);

    // Move back the unit so that we restore the gameState as it was
    // move.undo(gameState);
    return totalScore;
}
