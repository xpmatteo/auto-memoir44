
export class DiceResult {
    constructor(name, value) {
        this.name = name;
        this.value = value;
    }

    toString() {
        return this.name;
    }
}

export const RESULT_INFANTRY  = new DiceResult('INF', 0);
export const RESULT_ARMOR  = new DiceResult('ARM', 2);
export const RESULT_GRENADE = new DiceResult('GRE', 3);
export const RESULT_STAR = new DiceResult('STAR', 4);
export const RESULT_FLAG   = new DiceResult('FLAG', 5);

const values = [
    RESULT_INFANTRY,
    RESULT_INFANTRY,
    RESULT_ARMOR,
    RESULT_GRENADE,
    RESULT_STAR,
    RESULT_FLAG
];

export class Die {
    /** @type {DiceResult} */
    #value;
    #random;

    constructor(random = Math.random) {
        this.#random = random;
    }

    roll() {
        this.#value = values[Math.floor(this.#random() * 6)];
    }

    get value() {
        return this.#value;
    }
}

export class Dice {
    #random;

    constructor(random = Math.random) {
        this.#random = random;
    }

    /**
     * @param {number} count
     * @returns {DiceResult[]}
     */
    roll(count) {
        let results = [];
        let die = new Die(this.#random);
        for (let i = 0; i < count; i++) {
            die.roll();
            results.push(die.value);
        }
        results.sort((a, b) => a.value - b.value);
        return results;
    }
}

/**
 * @param {DiceResult[]} fixedResults
 * @returns {{roll: (function(number): DiceResult[])}}
 */
export function diceReturningAlways(fixedResults) {
    return {
        roll: function (count) {
            return fixedResults.slice(0, count);
        }
    }
}

export function diceReturning(listOfResults) {
    return {
        roll: function (count) {
            if (listOfResults.length < count) {
                throw new Error(`Not enough results in the list of results: ${listOfResults}`);
            }
            let result = listOfResults.slice(0, count);
            listOfResults = listOfResults.slice(count);
            return result;
        }
    }
}
