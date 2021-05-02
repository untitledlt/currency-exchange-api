module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    verbose: true,
    modulePathIgnorePatterns: ['dist'],
    collectCoverage: true,
    coverageReporters: ['json', 'html'],
};
