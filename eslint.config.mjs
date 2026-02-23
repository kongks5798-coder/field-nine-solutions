import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import jsxA11y from "eslint-plugin-jsx-a11y";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  // ── Custom stricter rules ──────────────────────────────────────
  {
    plugins: { "jsx-a11y": jsxA11y },
    rules: {
      // Prevent accidental `any` usage
      "@typescript-eslint/no-explicit-any": "warn",

      // Require alt text on images
      "jsx-a11y/alt-text": "warn",

      // Require keyboard events alongside click events
      "jsx-a11y/click-events-have-key-events": "warn",

      // Disallow interactive handlers on static (non-interactive) elements
      "jsx-a11y/no-static-element-interactions": "warn",

      // No console.log in production (allow warn / error)
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },

  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
