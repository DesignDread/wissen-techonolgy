export default {
  testEnvironment: 'node',
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {},
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/index.js',
  ],
  coveragePathIgnorePatterns: [
    'node_modules',
  ],
  testMatch: ['**/__tests__/**/*.test.js'],
  detectOpenHandles: true,
  forceExit: true,
  testTimeout: 30000,
};
