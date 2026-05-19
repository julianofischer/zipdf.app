"use client";

import { Cpu, FileCode2, ImageDown } from "lucide-react";
import type { Dictionary } from "@/i18n/dictionaries";
import type { PdfEngine } from "@/types/pdf";

const ENGINE_IDS: PdfEngine[] = ["qpdf-wasm", "javascript", "ghostscript-wasm"];

const icons: Record<PdfEngine, React.ReactNode> = {
  "qpdf-wasm": <Cpu size={17} />,
  javascript: <FileCode2 size={17} />,
  "ghostscript-wasm": <ImageDown size={17} />
};

type Props = {
  value: PdfEngine;
  onChange: (engine: PdfEngine) => void;
  disabled?: boolean;
  t: Dictionary["engines"];
};

export function EngineSelector({ value, onChange, disabled, t }: Props) {
  return (
    <fieldset className="space-y-3" aria-label={t.legend}>
      <legend className="text-sm font-medium text-ink">{t.legend}</legend>
      <div className="grid gap-2 sm:grid-cols-3">
        {ENGINE_IDS.map((engineId) => {
          const engine = t.options[engineId];
          const isSelected = engineId === value;

          return (
            <button
              type="button"
              key={engineId}
              onClick={() => onChange(engineId)}
              disabled={disabled}
              className={`min-h-28 rounded-lg border bg-white p-4 text-left transition hover:border-mint/60 focus:outline-none focus:ring-2 focus:ring-mint disabled:cursor-not-allowed disabled:opacity-60 ${
                isSelected ? "border-mint shadow-glow" : "border-black/10"
              }`}
              aria-pressed={isSelected}
            >
              <span className="flex items-center gap-2 text-mint">{icons[engineId]}</span>
              <span className="mt-3 block text-sm font-semibold text-ink">{engine.label}</span>
              <span className="mt-2 block text-xs leading-5 text-black/58">{engine.description}</span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
