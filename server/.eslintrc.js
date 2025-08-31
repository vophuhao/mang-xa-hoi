module.exports = {
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
  },
  plugins: ["@typescript-eslint"],
  extends: ["eslint:recommended"],
  root: true,
  env: {
    node: true,
    es2022: true,
  },
  ignorePatterns: [".eslintrc.js", "dist/", "node_modules/"],
  rules: {
    // Basic rules - more lenient for development
    "no-console": "off", // Allow console in development
    "no-debugger": "error",
    "no-var": "error",
    "prefer-const": "error",
    "no-unused-vars": "off", // Let TypeScript handle this

    // TypeScript basic rules
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    "@typescript-eslint/no-explicit-any": "off", // Allow any for now
  },
  overrides: [
    {
      files: ["*.js"],
      rules: {
        "@typescript-eslint/no-var-requires": "off",
      },
    },
  ],
};
