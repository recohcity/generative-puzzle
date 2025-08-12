/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    // 确保 @/utils/rendering/colorUtils 能够被正确解析
    '^@/(.*)$': '<rootDir>/$1',
  },
  transform: {
    // 使用 ts-jest 处理 .ts 和 .tsx 文件，新配置格式
    '^.+\.(ts|tsx)$': ['ts-jest', {
      useESM: false,
      tsconfig: {
        sourceMap: false,
        inlineSourceMap: false,
        isolatedModules: true,
      }
    }],
  },
  // 自定义覆盖率预处理
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/__tests__/',
    '\\.d\\.ts$',
    // 排除纯接口定义文件
    'types\\.ts$',
    // 排除特定的代码模式
  ],
  // 禁用源映射支持
  collectCoverageFrom: [
    'utils/**/*.{ts,tsx}',
    '!utils/**/*.d.ts',
    '!utils/**/__tests__/**',
    '!utils/**/node_modules/**',
    // 排除纯类型定义文件
    '!utils/**/cutGeneratorTypes.ts',
    '!utils/**/*Types.ts',
    '!utils/**/*.types.ts',
    // 排除备份文件和历史文件
    '!utils/**/*-backup.ts',
    '!utils/**/*-original-backup.ts',
    '!utils/**/*.backup.ts',
    // 排除复杂UI交互文件（依赖DOM环境，难以单元测试）
    '!utils/**/ScatterPuzzle.ts'
  ],
  coverageReporters: ['text', 'json-summary'],
  // 更精确的覆盖率配置
  coverageProvider: 'v8', // 使用V8覆盖率引擎，更准确
  // collectCoverageOnlyFrom 已废弃，使用 collectCoverageFrom 替代
  // 排除特定的代码模式
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/__tests__/',
    '\\.d\\.ts$',
    // 排除纯接口定义文件
    'types\\.ts$',
  ],
  // 自定义覆盖率忽略模式
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 75,
      lines: 75,
      statements: 75
    },
    // 全局覆盖率阈值
  },
  // 使用自定义的覆盖率处理器
  setupFilesAfterEnv: ['<rootDir>/coverage-setup.js'],
  // Jest应该搜索测试文件的目录
  testMatch: [
    '<rootDir>/utils/__tests__/**/*.test.ts',
    '<rootDir>/utils/rendering/__tests__/**/*.test.ts',
    '<rootDir>/utils/geometry/__tests__/**/*.test.ts',
    '<rootDir>/utils/puzzle/__tests__/**/*.test.ts',
    '<rootDir>/utils/shape/__tests__/**/*.test.ts',
    '<rootDir>/utils/adaptation/__tests__/**/*.test.ts',
    '<rootDir>/utils/mobile/__tests__/**/*.test.ts',
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