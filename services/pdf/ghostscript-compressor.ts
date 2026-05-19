import type { StageKey } from "@/i18n/dictionaries";
import type { CompressionOptions } from "@/types/pdf";

type GhostscriptModule = {
  callMain(args?: string[]): number;
  FS: {
    writeFile(path: string, data: Uint8Array): void;
    readFile(path: string): Uint8Array;
    unlink(path: string): void;
  };
};

type GhostscriptConfig = {
  noInitialRun?: boolean;
  locateFile?: (path: string) => string;
  print?: (message: string) => void;
  printErr?: (message: string) => void;
};

type GhostscriptFactory = (config?: GhostscriptConfig) => Promise<GhostscriptModule>;
type ProgressHandler = (progress: number, stage: StageKey) => void;

const INPUT_PATH = "/input.pdf";
const OUTPUT_PATH = "/output.pdf";

let ghostscriptModulePromise: Promise<GhostscriptModule> | null = null;

export async function compressWithGhostscript(
  inputBuffer: ArrayBuffer,
  options: CompressionOptions,
  onProgress: ProgressHandler,
  shouldCancel: () => boolean
): Promise<ArrayBuffer> {
  onProgress(18, "loadingWasm");
  assertNotCancelled(shouldCancel);

  const ghostscript = await getGhostscriptModule();
  cleanup(ghostscript);
  ghostscript.FS.writeFile(INPUT_PATH, new Uint8Array(inputBuffer));

  onProgress(38, "compressingImages");
  assertNotCancelled(shouldCancel);

  const exitCode = ghostscript.callMain(buildGhostscriptArgs(options));
  if (exitCode !== 0) {
    throw new Error(`Ghostscript failed with exit code ${exitCode}.`);
  }

  onProgress(92, "rewritingObjects");
  assertNotCancelled(shouldCancel);

  const output = ghostscript.FS.readFile(OUTPUT_PATH);
  cleanup(ghostscript);

  return toArrayBuffer(output);
}

async function getGhostscriptModule(): Promise<GhostscriptModule> {
  const loadGhostscript = await loadGhostscriptFactory();

  ghostscriptModulePromise ??= loadGhostscript({
    noInitialRun: true,
    locateFile(path) {
      if (path.endsWith(".wasm")) {
        return "/wasm/ghostscript/gs.wasm";
      }

      return path;
    },
    print() {},
    printErr(message) {
      if (message && !String(message).includes("Program terminated with exit")) {
        console.warn(message);
      }
    }
  });

  return ghostscriptModulePromise;
}

async function loadGhostscriptFactory(): Promise<GhostscriptFactory> {
  const ghostscriptLoaderUrl = "/wasm/ghostscript/gs.js";
  const ghostscriptLoader = (await import(/* webpackIgnore: true */ ghostscriptLoaderUrl)) as {
    default?: GhostscriptFactory;
  };

  if (!ghostscriptLoader.default) {
    throw new Error("Ghostscript WASM loader did not expose a default factory.");
  }

  return ghostscriptLoader.default;
}

function buildGhostscriptArgs(options: CompressionOptions): string[] {
  const preset = getGhostscriptPreset(options.level);

  return [
    "-sDEVICE=pdfwrite",
    "-dCompatibilityLevel=1.5",
    `-dPDFSETTINGS=${preset.pdfSettings}`,
    "-dDetectDuplicateImages=true",
    "-dCompressFonts=true",
    "-dSubsetFonts=true",
    "-dNOPAUSE",
    "-dQUIET",
    "-dBATCH",
    "-dSAFER",
    "-dDownsampleColorImages=true",
    "-dDownsampleGrayImages=true",
    "-dDownsampleMonoImages=true",
    "-dColorImageDownsampleType=/Bicubic",
    "-dGrayImageDownsampleType=/Bicubic",
    "-dMonoImageDownsampleType=/Subsample",
    `-dColorImageResolution=${preset.colorResolution}`,
    `-dGrayImageResolution=${preset.grayResolution}`,
    `-dMonoImageResolution=${preset.monoResolution}`,
    `-sOutputFile=${OUTPUT_PATH}`,
    INPUT_PATH
  ];
}

function getGhostscriptPreset(level: CompressionOptions["level"]) {
  if (level === "quality") {
    return {
      pdfSettings: "/printer",
      colorResolution: 300,
      grayResolution: 300,
      monoResolution: 600
    };
  }

  if (level === "maximum") {
    return {
      pdfSettings: "/screen",
      colorResolution: 96,
      grayResolution: 96,
      monoResolution: 150
    };
  }

  return {
    pdfSettings: "/ebook",
    colorResolution: 150,
    grayResolution: 150,
    monoResolution: 300
  };
}

function cleanup(ghostscript: GhostscriptModule): void {
  for (const path of [INPUT_PATH, OUTPUT_PATH]) {
    try {
      ghostscript.FS.unlink(path);
    } catch {}
  }
}

function assertNotCancelled(shouldCancel: () => boolean): void {
  if (shouldCancel()) {
    throw new DOMException("Processing cancelled.", "AbortError");
  }
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}
