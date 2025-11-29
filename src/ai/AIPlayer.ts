// ABOUTME: AI player interface and implementations for automated move selection
// ABOUTME: Provides strategy pattern for different AI difficulty levels and behaviors

import type {Move} from "../domain/Move";
import {ConfirmOrdersMove, EndBattlesMove, EndMovementsMove, MoveUnitMove, OrderUnitMove, PlayCardMove} from "../domain/Move";
import {SeededRNG} from "../adapters/RNG";
import type {GameState} from "../domain/GameState";
import type {CommandCard} from "../domain/CommandCard";
import {PhaseType} from "../domain/phases/Phase";
import type {HexCoord} from "../utils/hex";
import {hexDistance} from "../utils/hex";

/**
 * Interface for AI players that can select moves from legal options
 */
export interface AIPlayer {
    /**
     * Select a move from the available legal moves
     * @param gameState Current game state (cloned for AI safety)
     * @param legalMoves Array of legal moves to choose from
     * @returns The selected move to execute
     */
    selectMove(gameState: GameState, legalMoves: Move[]): Move;
}

/**
 * AI player that makes smart decisions during card selection
 * Selects cards that order the most units, with random tie-breaking
 * Uses seeded RNG for reproducible behavior
 * Prefers action moves over phase-ending moves to be more active
 */
export class RandomAIPlayer implements AIPlayer {
    private readonly rng: SeededRNG;
    constructor(rng: SeededRNG) {
        this.rng = rng;
    }

    selectMove(gameState: GameState, legalMoves: Move[]): Move {
        if (legalMoves.length === 0) {
            throw new Error("No legal moves available for AI to select");
        }

        if (gameState.activePhase.type === PhaseType.PLAY_CARD) {
            const playCardMoves = legalMoves.filter(m => m instanceof PlayCardMove);
            if (playCardMoves.length <= 0) {
                throw new Error("No cards to play?");
            }
            return this.selectBestCard(gameState, playCardMoves as PlayCardMove[]);
        }

        if (gameState.activePhase.type === PhaseType.MOVE) {
            const moveUnitMoves = legalMoves.filter(m => m instanceof MoveUnitMove);
            if (moveUnitMoves.length > 0) {
                return this.selectBestMove(gameState, moveUnitMoves as MoveUnitMove[]);
            }
        }

        if (gameState.activePhase.type === PhaseType.ORDER) {
            const orderUnitMoves = legalMoves.filter(m => m instanceof OrderUnitMove);
            if (orderUnitMoves.length > 0) {
                return this.randomSelect(orderUnitMoves);
            }
            // No OrderUnitMove available - select ConfirmOrdersMove to advance phase
            const confirmMove = legalMoves.find(m => m instanceof ConfirmOrdersMove);
            if (confirmMove) {
                return confirmMove;
            }
        }

        // Filter out phase-ending moves if there are other options
        const actionMoves = this.filterActionMoves(legalMoves);
        const movesToChooseFrom = actionMoves.length > 0 ? actionMoves : legalMoves;


        // Otherwise, random selection (existing behavior)
        return this.randomSelect(movesToChooseFrom);
    }

    /**
     * Filter out phase-ending moves if there are other options
     * Note: ConfirmOrdersMove is allowed to prevent infinite toggling of unit orders
     */
    private filterActionMoves(legalMoves: Move[]): Move[] {
        return legalMoves.filter(move =>
            !(move instanceof EndMovementsMove) &&
            !(move instanceof EndBattlesMove)
        );
    }

    /**
     * Randomly select one move from the available moves
     * Uses the same random selection pattern as Dice and Deck
     */
    private randomSelect(moves: Move[]): Move {
        const index = Math.floor(this.rng.random() * moves.length);
        return moves[index];
    }

    /**
     * Select the card that orders the most units
     * Breaks ties randomly using seeded RNG
     */
    private selectBestCard(gameState: GameState, moves: PlayCardMove[]): PlayCardMove {
        // Calculate orderable units for each card
        const movesWithCounts = moves.map(move => ({
            move,
            orderableUnits: this.calculateOrderableUnits(gameState, move.card)
        }));

        // Find maximum orderable count
        const maxOrderable = Math.max(...movesWithCounts.map(m => m.orderableUnits));

        // Filter to only best cards (handles ties)
        const bestMoves = movesWithCounts
            .filter(m => m.orderableUnits === maxOrderable)
            .map(m => m.move);

        // Random selection among ties (maintains seeded behavior)
        return this.randomSelect(bestMoves) as PlayCardMove;
    }

    /**
     * Calculate how many units a card would order
     * Returns min(units in section, card's unit limit)
     */
    private calculateOrderableUnits(gameState: GameState, card: CommandCard): number {
        const friendlyUnits = gameState.getFriendlyUnitsInSection(card.section);
        return Math.min(friendlyUnits.length, card.howManyUnits);
    }

    /**
     * Select the best unit movement move based on board position scoring
     * Moves units closer to enemy units to maximize engagement opportunities
     */
    private selectBestMove(gameState: GameState, moves: MoveUnitMove[]): MoveUnitMove {
        // Calculate position score for each move
        const movesWithScores = moves.map(move => ({
            move,
            score: this.calculatePositionScore(gameState, move.to)
        }));

        // Find maximum score
        const maxScore = Math.max(...movesWithScores.map(m => m.score));

        // Filter to only best moves (handles ties)
        const bestMoves = movesWithScores
            .filter(m => m.score === maxScore)
            .map(m => m.move);

        // Random selection among ties (maintains seeded behavior)
        return this.randomSelect(bestMoves) as MoveUnitMove;
    }

    /**
     * Calculate a position score for a hex coordinate
     * Higher scores indicate better positions (closer to enemy units)
     *
     * Score = sum of (1 / distance) for each enemy unit
     * This rewards being close to multiple enemies
     */
    private calculatePositionScore(gameState: GameState, position: HexCoord): number {
        // Get all enemy units
        const enemyUnits = this.getEnemyUnitsWithPositions(gameState);

        if (enemyUnits.length === 0) {
            return 0;
        }

        // Calculate score as sum of inverse distances to all enemies
        let score = 0;
        for (const {coord} of enemyUnits) {
            const distance = hexDistance(position, coord);
            // Avoid division by zero (should never happen since we can't move onto enemy units)
            // Add small bonus for very close positions
            if (distance === 0) {
                score += 1000; // Should never happen, but handle it
            } else {
                score += 1.0 / distance;
            }
        }

        return score;
    }

    /**
     * Get all enemy units with their positions
     */
    private getEnemyUnitsWithPositions(gameState: GameState): Array<{ coord: HexCoord; unit: any }> {
        const activeSide = gameState.activePlayer.side;
        return gameState.getAllUnitsWithPositions()
            .filter(({unit}) => unit.side !== activeSide);
    }

}

