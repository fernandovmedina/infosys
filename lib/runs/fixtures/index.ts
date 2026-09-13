import { cleanScenario } from "./clean";
import { cleanWithLeadsScenario } from "./clean-with-leads";
import { failedScenario } from "./failed";
import { fraudScenario } from "./fraud";
import { partialScenario } from "./partial";
import type { ScenarioDefinition, ScenarioId } from "./types";

export const SCENARIOS: Record<ScenarioId, ScenarioDefinition> = {
  fraud: fraudScenario,
  clean_with_leads: cleanWithLeadsScenario,
  clean: cleanScenario,
  partial: partialScenario,
  failed: failedScenario,
};

export const SCENARIO_IDS = Object.keys(SCENARIOS) as ScenarioId[];

export function isScenarioId(value: string): value is ScenarioId {
  return value in SCENARIOS;
}

export type { ScenarioDefinition, ScenarioId } from "./types";
