import type { StageKey } from "@/i18n/dictionaries";

export type CompressionLevel = "quality" | "balanced" | "maximum";

export type PdfEngine = "qpdf-wasm" | "javascript" | "ghostscript-wasm";

export type ProcessingStatus = "idle" | "validating" | "processing" | "completed" | "error" | "cancelled";

export type PdfJob = {
  id: string;
  file: File;
  fileName: string;
  originalSize: number;
  outputBlob?: Blob;
  outputSize?: number;
  reduction?: number;
  startedAt?: number;
  elapsedMs?: number;
  progress: number;
  status: ProcessingStatus;
  error?: string;
  notice?: string;
};

export type CompressionOptions = {
  level: CompressionLevel;
  engine: PdfEngine;
};

export type WorkerRequest =
  | {
      type: "compress";
      jobId: string;
      fileName: string;
      fileBuffer: ArrayBuffer;
      options: CompressionOptions;
    }
  | {
      type: "cancel";
      jobId: string;
    };

export type WorkerResponse =
  | {
      type: "progress";
      jobId: string;
      progress: number;
      stage: StageKey;
    }
  | {
      type: "complete";
      jobId: string;
      outputBuffer: ArrayBuffer;
      elapsedMs: number;
      engine: PdfEngine;
    }
  | {
      type: "error";
      jobId: string;
      error: string;
    }
  | {
      type: "cancelled";
      jobId: string;
    };

export type CompressionPreset = {
  id: CompressionLevel;
  label: string;
  description: string;
};
