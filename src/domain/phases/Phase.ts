import {GameState} from "../GameState";
import {Move} from "../Move";

export const PhaseType = {
    PLAY_CARD: "play_card",
    ORDER: "order",
    MOVE: "move",
    BATTLE: "battle",
    REPLENISH_HAND: "replenish_hand"
} as const;

export type PhaseType = typeof PhaseType[keyof typeof PhaseType];

// A Phase defines which moves are available to the current player at any given time
export interface Phase {
    readonly name: string;
    readonly type: PhaseType;

    legalMoves(gameState: GameState): Array<Move>;
}

