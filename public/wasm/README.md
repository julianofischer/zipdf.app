# QPDF WASM compressor

This folder contains the checked-in QPDF browser-side compression engine.

```text
public/wasm/pdf-compressor.js
public/wasm/qpdf.js
public/wasm/qpdf.wasm
```

`pdf-compressor.js` exposes this factory in the worker global scope:

```ts
self.createPdfCompressor = async () => ({
  async compressPdf(input, options) {
    // input: Uint8Array
    // options.level: "quality" | "balanced" | "maximum"
    // return Uint8Array
  }
});
```

The current checked-in `qpdf.js`/`qpdf.wasm` pair is a single-thread QPDF 12.2.0
WASM build, so it does not require `SharedArrayBuffer`, COOP, or COEP. It runs
inside the app's PDF worker and never uploads the user's PDF.

Rebuild from source with:

```bash
docker run --rm \
  -v "$PWD:/workspace" \
  -w /workspace \
  emscripten/emsdk:3.1.74 \
  bash scripts/build-qpdf-wasm.sh
```

If this loader is removed or fails to initialize while QPDF is selected, the
application automatically falls back to the JavaScript `pdf-lib` engine, still
100% inside the browser.

Ghostscript WASM is loaded from the npm package `@okathira/ghostpdl-wasm` by the
worker service, not from this folder.
