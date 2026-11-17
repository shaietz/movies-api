/**
 * Three Jest "projects", one per test level:
 *   unit        - pure logic, no database, dependencies mocked
 *   integration - services/models against an in-memory MongoDB
 *   api         - full HTTP requests through Express (supertest) + in-memory MongoDB
 *
 * Run one level with: npm run test:unit | test:integration | test:api
 */
const base = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/tests/setup/env.ts'],
  clearMocks: true,
};

const withDb = {
  ...base,
  setupFilesAfterEnv: ['<rootDir>/tests/setup/db.ts'],
};

module.exports = {
  projects: [
    { ...base, displayName: 'unit', testMatch: ['<rootDir>/tests/unit/**/*.test.ts'] },
    {
      ...withDb,
      displayName: 'integration',
      testMatch: ['<rootDir>/tests/integration/**/*.test.ts'],
    },
    { ...withDb, displayName: 'api', testMatch: ['<rootDir>/tests/api/**/*.test.ts'] },
  ],
  collectCoverageFrom: ['src/**/*.ts', '!src/server.ts', '!src/config/swagger.ts'],
  coverageDirectory: 'coverage',
};
