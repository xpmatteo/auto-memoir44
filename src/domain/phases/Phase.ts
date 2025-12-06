import {GameState} from "../GameState";
import {Move} from "../moves/Move";

export const PhaseType = {
    PLAY_CARD: "play_card",
    ORDER: "order",
    MOVE: "move",
    BATTLE: "battle",
    RETREAT: "retreat",
    REPLENISH_HAND: "replenish_hand"
} as const;

export type PhaseType = typeof PhaseType[keyof typeof PhaseType];

// A Phase defines which moves are available to the current player at any given time
export interface Phase {
    readonly name: string;
    readonly type: PhaseType;
    // If true, temporarily switches the active player to the opponent
    // Used for scenarios like flag results where the owning player chooses retreat hex
    readonly temporaryPlayerSwitch?: boolean;

    legalMoves(gameState: GameState): Array<Move>;
}

