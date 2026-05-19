"use client";

import { Check } from "lucide-react";
import type { Dictionary } from "@/i18n/dictionaries";
import { COMPRESSION_PRESET_IDS } from "@/services/pdf/presets";
import type { CompressionLevel } from "@/types/pdf";

type Props = {
  value: CompressionLevel;
  onChange: (value: CompressionLevel) => void;
  disabled?: boolean;
  t: Dictionary["compression"];
};

export function CompressionLevelSelector({ value, onChange, disabled, t }: Props) {
  return (
    <fieldset className="space-y-3" aria-label={t.legend}>
      <legend className="text-sm font-medium text-ink">{t.legend}</legend>
      <div className="grid gap-2 sm:grid-cols-3">
        {COMPRESSION_PRESET_IDS.map((presetId) => {
          const preset = t.presets[presetId];
          const isSelected = presetId === value;

          return (
            <button
              type="button"
              key={presetId}
              onClick={() => onChange(presetId)}
              disabled={disabled}
              className="group min-h-28 rounded-lg border border-black/10 bg-white p-4 text-left transition hover:border-mint/60 focus:outline-none focus:ring-2 focus:ring-mint disabled:cursor-not-allowed disabled:opacity-60"
              aria-pressed={isSelected}
            >
              <span className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-ink">{preset.label}</span>
                <span
                  className={`inline-flex size-5 items-center justify-center rounded-full border ${
                    isSelected ? "border-mint bg-mint text-white" : "border-black/15 text-transparent"
                  }`}
                  aria-hidden="true"
                >
                  <Check size={13} />
                </span>
              </span>
              <span className="mt-2 block text-xs leading-5 text-black/58">{preset.description}</span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
