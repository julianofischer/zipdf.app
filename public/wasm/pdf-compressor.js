let createQpdfModulePromise;
let qpdfModulePromise;

const INPUT_PATH = "/tmp/input.pdf";
const OUTPUT_PATH = "/tmp/output.pdf";

self.createPdfCompressor = async () => ({
  async compressPdf(input, options) {
    const qpdf = await getQpdfModule();

    cleanup(qpdf);
    qpdf.FS.writeFile(INPUT_PATH, input);

    const args = buildQpdfArgs(options);
    const exitCode = qpdf.callMain(args);

    if (exitCode !== 0) {
      throw new Error(`QPDF failed with exit code ${exitCode}.`);
    }

    const output = qpdf.FS.readFile(OUTPUT_PATH);
    cleanup(qpdf);
    return output;
  }
});

async function getQpdfModule() {
  qpdfModulePromise ??= loadQpdfModule();
  return qpdfModulePromise;
}

async function loadQpdfModule() {
  const createQpdfModule = await getCreateQpdfModule();

  return createQpdfModule({
    noInitialRun: true,
    locateFile(path) {
      return new URL(path, import.meta.url).href;
    },
    print() {},
    printErr(message) {
      if (message && !String(message).includes("Program terminated with exit")) {
        console.warn(message);
      }
    }
  });
}

async function getCreateQpdfModule() {
  createQpdfModulePromise ??= fetch(new URL("./qpdf.js", import.meta.url))
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Unable to load qpdf.js: ${response.status}`);
      }
      return response.text();
    })
    .then((source) => {
      // QPDF can be emitted either as a classic Emscripten global module or as
      // a modularized factory depending on the build flags. This adapter accepts
      // both shapes and keeps evaluation inside this worker.
      return async (config) => {
        const moduleConfig = { ...config };
        const runtimeReady = new Promise((resolve) => {
          const onRuntimeInitialized = moduleConfig.onRuntimeInitialized;
          moduleConfig.onRuntimeInitialized = () => {
            onRuntimeInitialized?.();
            resolve(moduleConfig);
          };
        });
        const moduleOrFactory = new Function(
          "moduleConfig",
          `var Module = moduleConfig; ${source}; return typeof createQpdfModule !== "undefined" ? createQpdfModule : Module;`
        )(moduleConfig);

        if (typeof moduleOrFactory === "function") {
          return moduleOrFactory(config);
        }

        return runtimeReady;
      };
    });

  return createQpdfModulePromise;
}

function buildQpdfArgs(options) {
  if (options.level === "quality") {
    return [
      "--object-streams=preserve",
      "--stream-data=compress",
      "--recompress-flate",
      "--compression-level=6",
      INPUT_PATH,
      OUTPUT_PATH
    ];
  }

  if (options.level === "maximum") {
    return [
      "--object-streams=generate",
      "--stream-data=compress",
      "--decode-level=all",
      "--recompress-flate",
      "--compression-level=9",
      "--optimize-images",
      "--jpeg-quality=40",
      "--oi-min-width=1",
      "--oi-min-height=1",
      "--oi-min-area=1",
      "--deterministic-id",
      INPUT_PATH,
      OUTPUT_PATH
    ];
  }

  return [
    "--object-streams=generate",
    "--stream-data=compress",
    "--recompress-flate",
    "--compression-level=7",
    "--deterministic-id",
    INPUT_PATH,
    OUTPUT_PATH
  ];
}

function cleanup(qpdf) {
  for (const path of [INPUT_PATH, OUTPUT_PATH]) {
    try {
      qpdf.FS.unlink(path);
    } catch {}
  }
}
