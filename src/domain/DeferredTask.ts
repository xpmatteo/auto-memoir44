// ABOUTME: Interface for deferred tasks that execute automatically when phases are popped
// ABOUTME: Used for sequencing automatic actions like combat that may pause for user input

import {GameState} from "./GameState";

export type TaskResult =
    | { type: 'complete' }   // Task is done, continue to next task
    | { type: 'paused' }     // Task pushed a phase for user input, pause task execution

export interface DeferredTask {
    /**
     * Execute this task. The task may modify game state, roll dice, push phases, etc.
     * @returns TaskResult indicating whether to continue processing tasks or pause
     */
    execute(gameState: GameState): TaskResult;

    /**
     * Create a deep clone of this task for GameState cloning
     */
    clone(): DeferredTask;
}
