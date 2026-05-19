import { create } from "zustand";
import type { CompressionLevel } from "@/types/pdf";

type CompressionPreferences = {
  defaultLevel: CompressionLevel;
  batchModeEnabled: boolean;
  setDefaultLevel: (level: CompressionLevel) => void;
  setBatchModeEnabled: (enabled: boolean) => void;
};

export const useCompressionPreferences = create<CompressionPreferences>((set) => ({
  defaultLevel: "balanced",
  batchModeEnabled: false,
  setDefaultLevel: (defaultLevel) => set({ defaultLevel }),
  setBatchModeEnabled: (batchModeEnabled) => set({ batchModeEnabled })
}));
