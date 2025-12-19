// ABOUTME: Move for confirming Dig In orders and applying sandbag fortifications
// ABOUTME: Used by DigInOrderPhase to complete the ordering phase and fortify units

import {Move} from "./Move";
import {GameState} from "../GameState";
import {sandbagAllies, sandbagAxis, noFortification} from "../fortifications/Fortification";
import {Side} from "../Player";

export class ConfirmDigInMove extends Move {
    execute(gameState: GameState): void {
        // Apply sandbags to all ordered units
        const orderedUnits = gameState.getOrderedUnitsWithPositions();
        const fortification = gameState.activePlayer.side === Side.ALLIES
            ? sandbagAllies
            : sandbagAxis;

        for (const {coord} of orderedUnits) {
            // Units on fortified hexes shouldn't be orderable,
            // but guard against it anyway
            const existing = gameState.getFortification(coord);
            if (existing === noFortification) {
                gameState.setFortification(coord, fortification);
            }
        }

        // Pop the DigInOrderPhase
        gameState.popPhase();
    }

    uiButton() {
        return [{
            label: "Confirm Dig In",
            callback: (gameState: GameState) => {
                this.execute(gameState);
            },
        }];
    }

    toString(): string {
        return "ConfirmDigInMove";
    }
}
