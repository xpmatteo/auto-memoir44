// ABOUTME: Phase interface and PhaseType enum - defines the turn structure contract
// ABOUTME: Each phase implements legalMoves() to determine what the active player can do

import {GameState} from "../GameState";
import {Move} from "../moves/Move";

export const PhaseType = {
    PLAY_CARD: "play_card",
    ORDER: "order",
    MOVE: "move",
    BATTLE: "battle",
    RETREAT: "retreat",
    REPLENISH_HAND: "replenish_hand",
    TARGET_SELECTION: "target_selection",
} as const;

export type PhaseType = typeof PhaseType[keyof typeof PhaseType];

// A Phase defines which moves are available to the current player at any given time
export abstract class Phase {
    abstract readonly name: string;
    abstract readonly type: PhaseType;
    // If true, temporarily switches the active player to the opponent
    // Used for scenarios like flag results where the owning player chooses retreat hex
    readonly temporaryPlayerSwitch?: boolean;

    abstract legalMoves(gameState: GameState): Array<Move>;
}

