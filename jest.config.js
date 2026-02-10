/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  clearMocks: true,
  watchman: false,
  roots: ["<rootDir>/tests"],
  moduleFileExtensions: ["ts", "js", "json"],
  collectCoverageFrom: [
    "src/services/crypto/**/*.ts",
    "src/services/normalizers/**/*.ts"
  ]
};
