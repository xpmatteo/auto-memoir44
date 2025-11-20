// ABOUTME: Scenario registry for loading scenarios by name
// ABOUTME: Maps scenario codes to their factory functions

import type { Scenario } from "./Scenario";
import { ST02Scenario } from "./ST02";

type ScenarioFactory = () => Scenario;

const scenarios: Record<string, ScenarioFactory> = {
  ST02: () => new ST02Scenario(),
};

export function loadScenario(scenarioCode: string): Scenario {
  const factory = scenarios[scenarioCode];
  if (!factory) {
    throw new Error(`Unknown scenario: ${scenarioCode}`);
  }
  return factory();
}

export function getDefaultScenario(): Scenario {
  return new ST02Scenario();
}
