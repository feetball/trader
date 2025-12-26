module.exports = {
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/tests/jest.setup.js'],
  coveragePathIgnorePatterns: [],
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 30,
      functions: 40,
      lines: 80
    }
  }
};