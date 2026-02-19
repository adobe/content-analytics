module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: ["eslint:recommended"],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: "module",
  },
  rules: {
    "no-console": "error",
    "prefer-const": "error",
    "no-unused-vars": ["error", { ignoreRestSiblings: true }],
  },
  overrides: [
    {
      files: ["test/**/*.js"],
      env: {
        vitest: true,
      },
      rules: {
        "no-console": "off",
      },
    },
  ],
};
