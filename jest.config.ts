import type { Config } from "jest";
import nextJest from "next/jest";

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: "./",
});

const config: Config = {
  projects: [
    // Browser/DOM tests (React components, integration tests)
    {
      displayName: "Frontend Tests",
      testEnvironment: "jsdom",
      testMatch: ["<rootDir>/src/components/**/*.{test,spec}.{ts,tsx}"],
      setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
      moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/src/$1",
      },
      transform: {
        "^.+\\.(js|jsx|ts|tsx)$": [
          "babel-jest",
          {
            presets: [
              ["@babel/preset-env", { targets: { node: "current" } }],
              ["@babel/preset-react", { runtime: "automatic" }],
              "@babel/preset-typescript",
            ],
          },
        ],
      },
    },
    // Node.js tests (API routes, utilities, server-side logic)
    {
      displayName: "Backend Tests",
      testEnvironment: "node",
      testMatch: ["<rootDir>/src/lib/**/*.{test,spec}.{js,ts}"],
      moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/src/$1",
      },
      transform: {
        "^.+\\.(js|jsx|ts|tsx)$": [
          "babel-jest",
          {
            presets: [
              ["@babel/preset-env", { targets: { node: "current" } }],
              ["@babel/preset-react", { runtime: "automatic" }],
              "@babel/preset-typescript",
            ],
          },
        ],
      },
    },
  ],
};

export default createJestConfig(config);
