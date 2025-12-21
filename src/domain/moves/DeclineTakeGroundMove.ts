// ABOUTME: Move for declining to take ground after close combat
// ABOUTME: Pops the TakeGroundPhase without moving the attacking unit

import {Move} from "./Move";
import {GameState} from "../GameState";
import {GameEvent} from "../GameEvent";

export class DeclineTakeGroundMove extends Move {
    execute(gameState: GameState): GameEvent[] {
        gameState.popPhase();
        return [];
    }

    uiButton() {
        return [{
            label: "Don't Advance",
            callback: (gameState: GameState) => {
                gameState.popPhase();
            },
        }];
    }

    toString(): string {
        return "DeclineTakeGroundMove()";
    }
}
