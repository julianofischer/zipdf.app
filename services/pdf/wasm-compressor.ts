import type { CompressionOptions } from "@/types/pdf";

export type WasmPdfCompressor = {
  compressPdf(input: Uint8Array, options: CompressionOptions): Promise<Uint8Array>;
};

declare global {
  interface WindowOrWorkerGlobalScope {
    createPdfCompressor?: () => Promise<WasmPdfCompressor>;
  }
}

export async function loadQpdfWasmCompressor(): Promise<WasmPdfCompressor | null> {
  try {
    // Place the QPDF WASM loader at /public/wasm/pdf-compressor.js.
    // It should assign self.createPdfCompressor and return an implementation of
    // the WasmPdfCompressor contract above.
    const wasmLoaderUrl = "/wasm/pdf-compressor.js";
    await import(/* webpackIgnore: true */ wasmLoaderUrl);
    return self.createPdfCompressor ? await self.createPdfCompressor() : null;
  } catch {
    return null;
  }
}
