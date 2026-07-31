import {
  defineConfig,
  globalIgnores,
} from "eslint/config";

import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypeScript,

  {
    name: "ugurbeyspot/custom-rules",

    rules: {
      /*
       * Projede Firebase Storage, blob URL ve dinamik admin
       * görselleri yoğun olarak kullanılıyor. Bu nedenle mevcut
       * <img> kullanımları bilinçli şekilde korunuyor.
       */
      "@next/next/no-img-element": "off",
    },
  },

  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "coverage/**",
    "node_modules/**",
    "next-env.d.ts",
    "firebase-debug.log",
    "tmp/**",
  ]),
]);