#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUILD_DIR="${ROOT_DIR}/.wasm-build"
QPDF_REF="${QPDF_REF:-v12.2.0}"
QPDF_REPO="${QPDF_REPO:-https://github.com/qpdf/qpdf.git}"
QPDF_SRC="${BUILD_DIR}/qpdf"
QPDF_BUILD="${BUILD_DIR}/qpdf-build"
OUT_DIR="${ROOT_DIR}/public/wasm"

if ! command -v emcmake >/dev/null 2>&1 || ! command -v emcc >/dev/null 2>&1; then
  cat >&2 <<'MSG'
Emscripten is required.

Install and activate emsdk first:

  git clone https://github.com/emscripten-core/emsdk.git .wasm-build/emsdk
  .wasm-build/emsdk/emsdk install latest
  .wasm-build/emsdk/emsdk activate latest
  source .wasm-build/emsdk/emsdk_env.sh

Then rerun:

  npm run wasm:build:qpdf
MSG
  exit 1
fi

if ! command -v cmake >/dev/null 2>&1; then
  echo "cmake is required. Install cmake and rerun this script." >&2
  exit 1
fi

mkdir -p "${BUILD_DIR}" "${OUT_DIR}"

if [ ! -d "${QPDF_SRC}/.git" ]; then
  git clone --depth 1 --branch "${QPDF_REF}" "${QPDF_REPO}" "${QPDF_SRC}"
fi

embuilder build zlib libjpeg

rm -rf "${QPDF_BUILD}"

emcmake cmake -S "${QPDF_SRC}" -B "${QPDF_BUILD}" \
  -DCMAKE_BUILD_TYPE=MinSizeRel \
  "-DCMAKE_EXE_LINKER_FLAGS=-sMODULARIZE=1 -sEXPORT_NAME=createQpdfModule -sENVIRONMENT=worker,web -sALLOW_MEMORY_GROWTH=1 -sEXIT_RUNTIME=0 -sEXPORTED_RUNTIME_METHODS=FS,callMain" \
  -DBUILD_SHARED_LIBS=OFF \
  -DBUILD_STATIC_LIBS=ON \
  -DBUILD_DOC=OFF \
  -DBUILD_TESTING=OFF \
  -DREQUIRE_CRYPTO_NATIVE=OFF \
  -DREQUIRE_CRYPTO_GNUTLS=OFF \
  -DREQUIRE_CRYPTO_OPENSSL=OFF \
  -DZLIB_H_PATH=/emsdk/upstream/emscripten/cache/sysroot/include \
  -DZLIB_LIB_PATH=/emsdk/upstream/emscripten/cache/sysroot/lib/wasm32-emscripten/libz.a \
  -DLIBJPEG_H_PATH=/emsdk/upstream/emscripten/cache/sysroot/include \
  -DLIBJPEG_LIB_PATH=/emsdk/upstream/emscripten/cache/sysroot/lib/wasm32-emscripten/libjpeg.a

cmake --build "${QPDF_BUILD}" --target qpdf --parallel

QPDF_JS="$(find "${QPDF_BUILD}" -type f -name qpdf.js | head -n 1)"
QPDF_WASM="$(find "${QPDF_BUILD}" -type f -name qpdf.wasm | head -n 1)"

if [ -z "${QPDF_JS}" ] || [ -z "${QPDF_WASM}" ]; then
  echo "Unable to find the built qpdf.js/qpdf.wasm artifacts." >&2
  exit 1
fi

cp "${QPDF_JS}" "${OUT_DIR}/qpdf.js"
cp "${QPDF_WASM}" "${OUT_DIR}/qpdf.wasm"

echo "QPDF WASM artifacts were written to ${OUT_DIR}/qpdf.js and ${OUT_DIR}/qpdf.wasm."
