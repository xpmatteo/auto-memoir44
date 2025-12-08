// ABOUTME: Tracks medals (eliminated units) and checks victory conditions
// ABOUTME: Maintains score state and determines when a player has won

import {Unit} from "./Unit";
import {Player} from "./Player";
import {GameVictoryMove} from "./moves/Move";

export class ScoreTracker {
    private readonly medalTables: [Unit[], Unit[]]; // Eliminated units by capturing player (0=Bottom, 1=Top)
    private prerequisiteNumberOfMedals: number;

    constructor(prerequisiteNumberOfMedals: number = 4) {
        this.medalTables = [[], []];
        this.prerequisiteNumberOfMedals = prerequisiteNumberOfMedals;
    }

    /**
     * Set the number of medals required to win
     */
    setPrerequisiteNumberOfMedals(medals: number): void {
        this.prerequisiteNumberOfMedals = medals;
    }

    /**
     * Add an eliminated unit to a player's medal table
     * @param unit The unit that was eliminated
     * @param capturingPlayerIndex Index of the player who captured the unit (0=Bottom, 1=Top)
     */
    addMedal(unit: Unit, capturingPlayerIndex: 0 | 1): void {
        this.medalTables[capturingPlayerIndex].push(unit);
    }

    /**
     * Get a player's medal table
     */
    getMedalTable(playerIndex: 0 | 1): Unit[] {
        return this.medalTables[playerIndex];
    }

    /**
     * Check if any player has won by reaching the prerequisite number of medals
     * @returns GameVictoryMove if a player has won, null otherwise
     */
    checkVictory(players: [Player, Player]): GameVictoryMove | null {
        // Check bottom player (index 0)
        if (this.medalTables[0].length >= this.prerequisiteNumberOfMedals) {
            return new GameVictoryMove(players[0].side);
        }
        // Check top player (index 1)
        if (this.medalTables[1].length >= this.prerequisiteNumberOfMedals) {
            return new GameVictoryMove(players[1].side);
        }
        return null;
    }

    /**
     * Create a deep clone of this ScoreTracker for AI simulation
     */
    clone(): ScoreTracker {
        const cloned = new ScoreTracker(this.prerequisiteNumberOfMedals);
        // Clone medalTables (shallow copy of arrays containing immutable Units)
        cloned.medalTables[0] = [...this.medalTables[0]];
        cloned.medalTables[1] = [...this.medalTables[1]];
        return cloned;
    }
}
