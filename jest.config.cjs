module.exports = {
  testEnvironment: 'node',
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