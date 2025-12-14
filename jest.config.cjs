module.exports = {
  testEnvironment: 'node',
  coveragePathIgnorePatterns: [
    '<rootDir>/server.js',
    '<rootDir>/websocket-feed.js',
    '<rootDir>/kraken-websocket.js'
  ],
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 30,
      functions: 40,
      lines: 80
    }
  }
};