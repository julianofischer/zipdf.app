import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextVitals,
  ...nextTypescript,
  {
    ignores: [
      ".next/**",
      ".wasm-build/**",
      "node_modules/**",
      "next-env.d.ts",
      "public/wasm/qpdf.js",
      "public/wasm/ghostscript/gs.js"
    ]
  }
];

export default eslintConfig;
