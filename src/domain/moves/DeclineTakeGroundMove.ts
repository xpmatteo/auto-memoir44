// ABOUTME: Move for declining to take ground after close combat
// ABOUTME: Pops the TakeGroundPhase without moving the attacking unit

import {Move} from "./Move";
import {GameState} from "../GameState";

export class DeclineTakeGroundMove extends Move {
    execute(gameState: GameState): void {
        gameState.popPhase();
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
