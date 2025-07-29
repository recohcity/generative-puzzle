/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    // 确保 @/utils/rendering/colorUtils 能够被正确解析
    '^@/(.*)$': '<rootDir>/$1',
  },
  transform: {
    // 使用 ts-jest 处理 .ts 和 .tsx 文件
    '^.+\.(ts|tsx)$': 'ts-jest',
  },
  // Jest应该搜索测试文件的目录
  testMatch: [
    '<rootDir>/utils/rendering/__tests__/**/*.test.ts',
    '<rootDir>/utils/geometry/__tests__/**/*.test.ts',
    '<rootDir>/src/quality-system/__tests__/**/*.test.ts',
    '<rootDir>/src/quality-system/logging/__tests__/**/*.test.ts',
    '<rootDir>/src/quality-system/error-handling/__tests__/basic-error-handling.test.ts',
    '<rootDir>/src/quality-system/components/ErrorBoundary/__tests__/**/*.test.tsx',
    '<rootDir>/src/quality-system/task-management/__tests__/**/*.test.ts',
    '<rootDir>/src/quality-system/database/__tests__/**/*.test.ts',
    '<rootDir>/src/quality-system/validation/__tests__/**/*.test.ts',
    '<rootDir>/src/quality-system/quality-detection/__tests__/**/*.test.ts'
  ],
}; 