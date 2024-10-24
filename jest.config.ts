import { Config } from '@jest/types';
const config: Config.InitialOptions = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['./tests/e2e/utils/setup.ts'], // Optional: Set up the DB before tests
  testMatch: ['**/*.e2e.test.ts'], // Only run E2E tests in this setup
  moduleFileExtensions: ['ts', 'js'],
  verbose: true,
  forceExit: true,
  clearMocks: true,
};

export default config;
