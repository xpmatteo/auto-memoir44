// ABOUTME: Dice rolling system for combat resolution
// ABOUTME: Provides DiceResult types and Dice class for rolling multiple dice

export class DiceResult {
    readonly name: string;
    readonly sortValue: number;

    constructor(name: string, value: number) {
        this.name = name;
        this.sortValue = value;
    }

    toString(): string {
        return this.name;
    }
}

export const RESULT_INFANTRY = new DiceResult('INF', 0);
export const RESULT_ARMOR = new DiceResult('ARM', 2);
export const RESULT_GRENADE = new DiceResult('GRE', 3);
export const RESULT_STAR = new DiceResult('STAR', 4);
export const RESULT_FLAG = new DiceResult('FLAG', 5);

const values: DiceResult[] = [
    RESULT_INFANTRY,
    RESULT_INFANTRY,
    RESULT_ARMOR,
    RESULT_GRENADE,
    RESULT_STAR,
    RESULT_FLAG
];

export class Die {
    private value: DiceResult | null = null;
    private random: () => number;

    constructor(random: () => number = Math.random) {
        this.random = random;
    }

    roll(): void {
        this.value = values[Math.floor(this.random() * 6)];
    }

    getValue(): DiceResult {
        if (this.value === null) {
            throw new Error("Die has not been rolled yet");
        }
        return this.value;
    }
}

export class Dice {
    private random: () => number;

    constructor(random: () => number = Math.random) {
        this.random = random;
    }

    /**
     * Roll the specified number of dice and return sorted results
     */
    roll(count: number): DiceResult[] {
        const results: DiceResult[] = [];
        const die = new Die(this.random);
        for (let i = 0; i < count; i++) {
            die.roll();
            results.push(die.getValue());
        }
        results.sort((a, b) => a.sortValue - b.sortValue);
        return results;
    }

    /**
     * Get a random integer in the range [min, max] (inclusive)
     */
    getRandomInt(min: number, max: number): number {
        return Math.floor(this.random() * (max - min + 1)) + min;
    }

    /**
     * Create a clone of this Dice that shares the same RNG function
     * This ensures deterministic behavior across original and clone
     */
    clone(): Dice {
        return new Dice(this.random);
    }
}

/**
 * Test helper: Creates a Dice that always returns the same fixed results
 */
export function diceReturningAlways(fixedResults: DiceResult[]): Dice {
    return {
        roll: (count: number) => fixedResults.slice(0, count)
    } as Dice;
}

/**
 * Test helper: Creates a Dice that returns results from a list, consuming them
 */
export function diceReturning(listOfResults: DiceResult[]): Dice {
    return {
        roll: (count: number) => {
            if (listOfResults.length < count) {
                throw new Error(`Not enough results in the list of results: ${listOfResults}`);
            }
            const result = listOfResults.slice(0, count);
            listOfResults = listOfResults.slice(count);
            return result;
        }
    } as Dice;
}
