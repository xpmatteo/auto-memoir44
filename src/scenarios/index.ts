// ABOUTME: Scenario registry for loading scenarios by name
// ABOUTME: Maps scenario codes to their factory functions

import { GameState } from "../domain/GameState";
import { createST02Scenario } from "./ST02";

type ScenarioFactory = () => GameState;

const scenarios: Record<string, ScenarioFactory> = {
  ST02: createST02Scenario,
};

export function loadScenario(scenarioCode: string): GameState {
  const factory = scenarios[scenarioCode];
  if (!factory) {
    throw new Error(`Unknown scenario: ${scenarioCode}`);
  }
  return factory();
}

export function getDefaultScenario(): GameState {
  return createST02Scenario();
}
