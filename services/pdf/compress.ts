import { PDFDocument } from "pdf-lib";
import type { StageKey } from "@/i18n/dictionaries";
import type { CompressionOptions, PdfEngine } from "@/types/pdf";
import { compressWithGhostscript } from "./ghostscript-compressor";
import { loadQpdfWasmCompressor } from "./wasm-compressor";

type ProgressHandler = (progress: number, stage: StageKey) => void;

export async function compressPdfLocally(
  inputBuffer: ArrayBuffer,
  options: CompressionOptions,
  onProgress: ProgressHandler,
  shouldCancel: () => boolean
): Promise<{ output: ArrayBuffer; engine: PdfEngine }> {
  onProgress(8, "preparingEngine");
  assertNotCancelled(shouldCancel);

  if (options.engine === "ghostscript-wasm") {
    const output = await compressWithGhostscript(inputBuffer, options, onProgress, shouldCancel);
    onProgress(100, "finished");
    return { output, engine: "ghostscript-wasm" };
  }

  if (options.engine === "qpdf-wasm") {
    const wasmCompressor = await loadQpdfWasmCompressor();
    if (!wasmCompressor) {
      return compressWithJavascript(inputBuffer, options, onProgress, shouldCancel);
    }

    onProgress(20, "loadingWasm");
    assertNotCancelled(shouldCancel);
    const output = await wasmCompressor.compressPdf(new Uint8Array(inputBuffer), options);
    onProgress(100, "finished");
    return { output: toArrayBuffer(output), engine: "qpdf-wasm" };
  }

  return compressWithJavascript(inputBuffer, options, onProgress, shouldCancel);
}

async function compressWithJavascript(
  inputBuffer: ArrayBuffer,
  options: CompressionOptions,
  onProgress: ProgressHandler,
  shouldCancel: () => boolean
): Promise<{ output: ArrayBuffer; engine: PdfEngine }> {
  onProgress(22, "readingStructure");
  const pdf = await PDFDocument.load(inputBuffer, {
    ignoreEncryption: false,
    updateMetadata: false
  });

  assertNotCancelled(shouldCancel);
  onProgress(48, "rewritingObjects");

  // pdf-lib cannot downsample embedded raster images. This fallback still runs
  // fully client-side and often reduces PDFs by removing duplicated structure
  // and saving with object streams. Drop a real QPDF/Ghostscript WASM build into
  // /public/wasm for image-heavy compression.
  pdf.setProducer("zipdf local browser compressor");
  pdf.setCreator("zipdf");

  const objectStreams = options.level !== "quality";
  const addDefaultPage = false;

  assertNotCancelled(shouldCancel);
  onProgress(74, "compressingObjects");

  const outputBytes = await pdf.save({
    useObjectStreams: objectStreams,
    addDefaultPage,
    updateFieldAppearances: false,
    objectsPerTick: options.level === "maximum" ? 150 : 75
  });

  assertNotCancelled(shouldCancel);
  onProgress(100, "finished");

  return {
    output: toArrayBuffer(outputBytes),
    engine: "javascript"
  };
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
