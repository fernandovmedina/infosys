"use client";

import { useEffect, useId, useState } from "react";
import {
  getMockScenario,
  isMockMode,
  listMockScenarios,
  setMockScenario,
  type MockScenarioOption,
} from "@/lib/runs/api";

/** Solo en modo mock: elige qué escenario simulado reciben las corridas nuevas. */
export function MockScenarioPicker() {
  const selectId = useId();
  const [options, setOptions] = useState<MockScenarioOption[]>([]);
  const [selected, setSelected] = useState<string>("");

  useEffect(() => {
    if (!isMockMode) return;
    let cancelled = false;
    Promise.all([listMockScenarios(), getMockScenario()]).then(([scenarios, current]) => {
      if (cancelled) return;
      setOptions(scenarios);
      setSelected(current ?? scenarios[0]?.id ?? "");
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!isMockMode || options.length === 0) return null;
  const current = options.find((option) => option.id === selected);

  return (
    <div className="rounded-lg border border-dashed border-sky-300 bg-sky-50 px-4 py-3 text-sm text-sky-900">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <label htmlFor={selectId} className="font-medium">
          Modo mock · escenario para la próxima corrida
        </label>
        <select
          id={selectId}
          value={selected}
          onChange={(event) => {
            setSelected(event.target.value);
            setMockScenario(event.target.value);
          }}
          className="rounded-md border border-sky-300 bg-white px-2 py-1 text-sm text-zinc-900 sm:ml-auto"
        >
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      {current && <p className="mt-1 text-xs text-sky-800">{current.description} También se elige si el nombre del archivo contiene “{current.id}”.</p>}
    </div>
  );
}
