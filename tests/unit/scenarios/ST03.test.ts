import {test} from "vitest";
import {SeededRNG} from "../../../src/adapters/RNG";
import {ST03Scenario} from "../../../src/scenarios/ST03";

test('parse', () => {
    const scenario = new ST03Scenario();

    // should not break
    scenario.createGameState(new SeededRNG(12345));
});
