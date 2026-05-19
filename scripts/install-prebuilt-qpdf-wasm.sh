#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TMP_DIR="$(mktemp -d)"
OUT_DIR="${ROOT_DIR}/public/wasm"
PACKAGE="${QPDF_WASM_PACKAGE:-@jspawn/qpdf-wasm@0.0.2}"

cleanup() {
  rm -rf "${TMP_DIR}"
}
trap cleanup EXIT

mkdir -p "${OUT_DIR}"

pushd "${TMP_DIR}" >/dev/null
npm pack "${PACKAGE}"
TARBALL="$(find . -maxdepth 1 -name '*.tgz' | head -n 1)"
tar -xOf "${TARBALL}" package/qpdf.js > "${OUT_DIR}/qpdf.js"
tar -xOf "${TARBALL}" package/qpdf.wasm > "${OUT_DIR}/qpdf.wasm"
popd >/dev/null

echo "Installed ${PACKAGE} into public/wasm."
