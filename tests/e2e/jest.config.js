const tsPreset = require('ts-jest/jest-preset')
const puppeteerPreset = require('jest-puppeteer/jest-preset')

module.exports = {
  ...tsPreset,
  ...puppeteerPreset,
  // testMatch: ['./tests/e2e/specs/*.ts'],
  // roots: ['<rootDir>/tests/e2e/'],
  globals: {
    URL: 'http://localhost:3000',
  },
}
