import globals from "globals";
import nextjs from "@eslint/eslintrc/config-schema-json/schemas/eslint-recommended.json" assert { type: "json" };
import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({
  recommendedConfig: nextjs,
  baseDirectory: import.meta.dirname
});

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  {
    ignores: ["node_modules/", "dist/", ".next/", "public/"],
  },
  ...compat.config({
    extends: ["next/core-web-vitals"],
  }),
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      "no-unused-vars": ["error", { "argsIgnorePattern": "^_" }]
    }
  }
];
