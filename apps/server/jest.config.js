/** @type {import('jest').Config} */
const config = {
  preset: "ts-jest",
  testEnvironment: "node",
  rootDir: ".",
  testMatch: ["<rootDir>/tests/**/*.test.ts"],
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        tsconfig: "./tsconfig.test.json",
      },
    ],
  },
  moduleNameMapper: {},
  testTimeout: 30000,
  maxWorkers: 1,
  verbose: true,
  clearMocks: true,
  forceExit: true,
  globalTeardown:
    "<rootDir>/tests/helpers/globalTeardown.ts",

  // Suppress console.log/info during tests
  // Set to false to see output, true to hide
  silent: true,

  collectCoverageFrom: [
    "src/modules/expenses/split.service.ts",
    "src/modules/settlements/debt-simplifier.ts",
    "src/modules/auth/auth.service.ts",
    "src/modules/expenses/expense.service.ts",
  ],
};

module.exports = config;