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

const DEFAULT_DIE_FACES: DiceResult[] = [
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
    private faces: DiceResult[];

    constructor(random: () => number = Math.random, faces: DiceResult[] = DEFAULT_DIE_FACES) {
        this.random = random;
        this.faces = faces;
    }

    roll(): void {
        this.value = this.faces[Math.floor(this.random() * this.faces.length)];
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
    private faces: DiceResult[];

    constructor(random: () => number = Math.random, faces: DiceResult[] = DEFAULT_DIE_FACES) {
        this.random = random;
        this.faces = faces;
    }

    /**
     * Roll the specified number of dice and return sorted results
     */
    roll(count: number): DiceResult[] {
        const results: DiceResult[] = [];
        const die = new Die(this.random, this.faces);
        for (let i = 0; i < count; i++) {
            die.roll();
            results.push(die.getValue());
        }
        results.sort((a, b) => a.sortValue - b.sortValue);
        return results;
    }

    /**
     * Create a clone of this Dice that shares the same RNG function
     * This ensures deterministic behavior across original and clone
     */
    clone(): Dice {
        return new Dice(this.random, this.faces);
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

/**
 * Programmable dice for testing - allows setting exact dice results dynamically
 */
export class ProgrammableDice extends Dice {
    private queuedResults: DiceResult[] = [];

    constructor() {
        super(() => 0); // Dummy random function since we won't use it
    }

    setNextRolls(results: DiceResult[]): void {
        this.queuedResults.push(...results);
    }

    override roll(count: number): DiceResult[] {
        if (this.queuedResults.length < count) {
            throw new Error(`Not enough queued results: need ${count}, have ${this.queuedResults.length}`);
        }
        return this.queuedResults.splice(0, count);
    }

    override clone(): Dice {
        const cloned = new ProgrammableDice();
        cloned.queuedResults = [...this.queuedResults];
        return cloned;
    }
}
