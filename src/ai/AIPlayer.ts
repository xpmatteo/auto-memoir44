// ABOUTME: AI player interface and implementations for automated move selection
// ABOUTME: Provides strategy pattern for different AI difficulty levels and behaviors

import type {Move} from "../domain/moves/Move";
import {ConfirmOrdersMove, EndBattlesMove, EndMovementsMove, OrderUnitMove, PlayCardMove} from "../domain/moves/Move";
import {SeededRNG} from "../adapters/RNG";
import type {GameState} from "../domain/GameState";
import type {CommandCard} from "../domain/cards/CommandCard";
import {SectionCard} from "../domain/cards/SectionCards";
import {PhaseType} from "../domain/phases/Phase";
import {BattlePhase} from "../domain/phases/BattlePhase";
import {OrderUnitsPhase} from "../domain/phases/OrderUnitsPhase";
import {evaluatePosition} from "./evaluatePosition";
import {MoveUnitMove} from "../domain/moves/MoveUnitMove";
import {BattleMove} from "../domain/moves/BattleMove";
import type {Unit} from "../domain/Unit";
import type {SituatedUnit} from "../domain/SituatedUnit";

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
 *
 * Stateful AI: Remembers the target order combination during the orders phase
 */
export class RandomAIPlayer implements AIPlayer {
    private readonly rng: SeededRNG;
    private targetOrderSet: Set<Unit> | null = null;
    private lastPhaseType: PhaseType | null = null;

    constructor(rng: SeededRNG) {
        this.rng = rng;
    }

    selectMove(gameState: GameState, legalMoves: Move[]): Move {
        // Detect phase changes and clear target order set
        if (this.lastPhaseType !== gameState.activePhase.type) {
            this.targetOrderSet = null;
            this.lastPhaseType = gameState.activePhase.type;
        }

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

        if (gameState.activePhase.type === PhaseType.ORDER) {
            const orderMove = this.selectOrderMove(gameState, legalMoves);
            if (orderMove !== null) {
                return orderMove;
            }
            // Fall through to general logic if no order-specific move found
        }

        if (gameState.activePhase.type === PhaseType.MOVE) {
            const moveUnitMoves = legalMoves.filter(m => m instanceof MoveUnitMove);
            if (moveUnitMoves.length > 0) {
                return this.selectBestMove(gameState, moveUnitMoves as MoveUnitMove[]);
            }
        }

        if (gameState.activePhase.type === PhaseType.BATTLE) {
            const battleMoves = legalMoves.filter(m => m instanceof BattleMove);
            if (battleMoves.length > 0) {
                return this.selectBestBattle(gameState, battleMoves as BattleMove[]);
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
     * Returns min(total units across all sections, card's unit limit)
     * Returns 0 for non-section cards
     */
    private calculateOrderableUnits(gameState: GameState, card: CommandCard): number {
        if (!(card instanceof SectionCard)) {
            return 0;
        }
        let totalOrderable = 0;
        for (const section of card.sections) {
            const friendlyUnits = gameState.getFriendlyUnitsInSection(section);
            totalOrderable += friendlyUnits.length;
        }
        return Math.min(totalOrderable, card.howManyUnits);
    }

    /**
     * Select the best unit movement move based on board position scoring
     * Evaluates the overall position after each potential move
     */
    private selectBestMove(gameState: GameState, moves: MoveUnitMove[]): MoveUnitMove {
        // Calculate position score for each move by simulating it
        const movesWithScores = moves.map(move => {
            // Clone state, push BattlePhase, execute move, then evaluate
            const clonedState = gameState.clone();
            clonedState.pushPhase(new BattlePhase());
            clonedState.executeMove(new MoveUnitMove(move.from, move.to, false));
            const score = evaluatePosition(clonedState);
            return { move, score };
        });

        // movesWithScores.sort((a, b) => b.score - a.score);
        // for (const {move, score} of movesWithScores) {
        //     console.log(score, move.toString());
        // }

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
     * Select the best battle move based on prioritization criteria:
     * 1. Prioritize units with fewer target options (focus fire from constrained units)
     * 2. Break ties by targeting weaker units (closer to elimination)
     * 3. Break ties by targeting more threatened units (coordinate attacks)
     */
    private selectBestBattle(gameState: GameState, battleMoves: BattleMove[]): BattleMove {
        // Count how many targets each attacking unit can hit
        const targetCountByUnit = new Map<string, number>();
        for (const move of battleMoves) {
            const unitId = move.fromUnit.id;
            const count = targetCountByUnit.get(unitId) || 0;
            targetCountByUnit.set(unitId, count + 1);
        }

        // Calculate total dice threat to each target
        const totalDiceByTarget = new Map<string, number>();
        for (const move of battleMoves) {
            const targetId = move.toUnit.id;
            const currentDice = totalDiceByTarget.get(targetId) || 0;
            totalDiceByTarget.set(targetId, currentDice + move.dice);
        }

        // Score each battle move
        interface ScoredBattleMove {
            move: BattleMove;
            targetCount: number;
            targetStrength: number;
            totalThreatDice: number;
        }

        const scoredMoves: ScoredBattleMove[] = battleMoves.map(move => ({
            move,
            targetCount: targetCountByUnit.get(move.fromUnit.id) || 0,
            targetStrength: gameState.getUnitCurrentStrength(move.toUnit),
            totalThreatDice: totalDiceByTarget.get(move.toUnit.id) || 0,
        }));

        // Sort by criteria (ascending target count, ascending strength, descending threat)
        scoredMoves.sort((a, b) => {
            // Primary: fewer targets is better (ascending)
            if (a.targetCount !== b.targetCount) {
                return a.targetCount - b.targetCount;
            }
            // Secondary: lower strength is better (ascending)
            if (a.targetStrength !== b.targetStrength) {
                return a.targetStrength - b.targetStrength;
            }
            // Tertiary: more threat is better (descending)
            return b.totalThreatDice - a.totalThreatDice;
        });

        // Find all moves tied for first place
        const best = scoredMoves[0];
        const bestMoves = scoredMoves.filter(scored =>
            scored.targetCount === best.targetCount &&
            scored.targetStrength === best.targetStrength &&
            scored.totalThreatDice === best.totalThreatDice
        ).map(scored => scored.move);

        // Random selection among ties (maintains seeded behavior)
        return this.randomSelect(bestMoves) as BattleMove;
    }

    /**
     * Select the best move during the orders phase
     * Computes the optimal order combination (if not already computed) by simulating
     * full turns for each possible combination, then orders units in that combination
     */
    private selectOrderMove(gameState: GameState, legalMoves: Move[]): Move | null {
        // Compute target order set if not already done
        if (this.targetOrderSet === null) {
            this.targetOrderSet = this.computeBestOrderSet(gameState);
        }

        // Find an unordered unit in our target set
        const orderUnitMoves = legalMoves.filter(m => m instanceof OrderUnitMove) as OrderUnitMove[];
        const targetMoves = orderUnitMoves.filter(move =>
            this.targetOrderSet!.has(move.unit)
        );

        if (targetMoves.length > 0) {
            // Order a unit from our target set
            return this.randomSelect(targetMoves);
        }

        // All target units are ordered, confirm
        const confirmMove = legalMoves.find(m => m instanceof ConfirmOrdersMove);
        if (confirmMove) {
            return confirmMove;
        }

        // No valid order-specific moves found, fall back to general logic
        return null;
    }

    /**
     * Compute the best combination of units to order by simulating full turns
     * For each possible order combination, simulates: order → confirm → move → evaluate
     * Returns the Set of Units that yields the best position score
     */
    private computeBestOrderSet(gameState: GameState): Set<Unit> {
        const phase = gameState.activePhase;
        if (!(phase instanceof OrderUnitsPhase)) {
            throw new Error("computeBestOrderSet called outside OrderUnitsPhase");
        }

        const friendlyUnits = gameState.getFriendlySituatedUnits();
        const orderableSets = phase.getOrderableSets(friendlyUnits);

        if (orderableSets.size === 0) {
            // No orderable combinations, return empty set
            return new Set<Unit>();
        }

        // Evaluate each combination
        const setsWithScores = Array.from(orderableSets).map(orderSet => ({
            orderSet,
            score: this.simulateOrderCombination(gameState, orderSet)
        }));

        // Find max score
        const maxScore = Math.max(...setsWithScores.map(s => s.score));

        // Filter to best sets
        const bestSets = setsWithScores
            .filter(s => s.score === maxScore)
            .map(s => s.orderSet);

        // Random tie-breaking (can't use randomSelect because it expects Move[])
        const index = Math.floor(this.rng.random() * bestSets.length);
        const chosenSet = bestSets[index];

        // Convert SituatedUnit set to Unit set
        return new Set(Array.from(chosenSet).map(su => su.unit));
    }

    /**
     * Simulate a complete turn with the given order combination
     * Orders all units, confirms orders, simulates all movements, then evaluates position
     * Returns the position score after all movements are complete
     */
    private simulateOrderCombination(gameState: GameState, orderSet: Set<SituatedUnit>): number {
        const cloned = gameState.clone();

        // Order all units in the set
        for (const su of orderSet) {
            const orderMove = new OrderUnitMove(su.unit);
            cloned.executeMove(orderMove);
        }

        // Confirm orders to proceed to next phase
        cloned.executeMove(new ConfirmOrdersMove());

        // Simulate movement phase
        while (cloned.activePhase.type === PhaseType.MOVE) {
            const moves = cloned.legalMoves();
            const moveUnitMoves = moves.filter(m => m instanceof MoveUnitMove);

            if (moveUnitMoves.length === 0) {
                // No more moves, end movements
                const endMove = moves.find(m => m instanceof EndMovementsMove);
                if (endMove) {
                    cloned.executeMove(endMove);
                }
                break;
            }

            // Select and execute best move using existing logic
            const bestMove = this.selectBestMove(cloned, moveUnitMoves as MoveUnitMove[]);
            cloned.executeMove(bestMove);
        }

        // Should now be in BattlePhase, evaluate position
        if (cloned.activePhase.type !== PhaseType.BATTLE) {
            // Need to push battle phase
            cloned.pushPhase(new BattlePhase());
        }

        return evaluatePosition(cloned);
    }
}

