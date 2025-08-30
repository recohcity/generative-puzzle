/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    // 确保 @/utils/rendering/colorUtils 能够被正确解析
    '^@/(.*)$': '<rootDir>/$1',
    // Mock CSS files
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  transform: {
    // 使用 ts-jest 处理 .ts 和 .tsx 文件，新配置格式
    '^.+\.(ts|tsx)$': ['ts-jest', {
      useESM: false,
      tsconfig: {
        sourceMap: false,
        inlineSourceMap: false,
        isolatedModules: true,
        jsx: 'react-jsx'
      }
    }],
  },
  // 覆盖率收集配置
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
    '!utils/**/ScatterPuzzle.ts',
    // 排除数据工具（用于管理删除历史游戏成绩，不需要测试）
    '!utils/data-tools/**'
  ],
  // 覆盖率忽略路径（统一配置）
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/__tests__/',
    '\\.d\\.ts$',
    'types\\.ts$',
  ],
  coverageReporters: ['text', 'json-summary'],
  // 使用V8覆盖率引擎
  coverageProvider: 'v8',
  // 强制串行执行以确保覆盖率稳定性
  maxWorkers: 1,
  // 禁用缓存以避免覆盖率计算不一致
  cache: false,
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
  // 移除自定义的覆盖率处理器以避免干扰
  // Jest应该搜索测试文件的目录
  testMatch: [
    '<rootDir>/utils/__tests__/**/*.test.ts',
    '<rootDir>/utils/rendering/__tests__/**/*.test.ts',
    '<rootDir>/utils/geometry/__tests__/**/*.test.ts',
    '<rootDir>/utils/puzzle/__tests__/**/*.test.ts',
    '<rootDir>/utils/shape/__tests__/**/*.test.ts',
    '<rootDir>/utils/adaptation/__tests__/**/*.test.ts',
    '<rootDir>/utils/mobile/__tests__/**/*.test.ts',
    '<rootDir>/utils/leaderboard/__tests__/**/*.test.ts',
    '<rootDir>/utils/angleDisplay/__tests__/**/*.test.ts',
    '<rootDir>/utils/data/__tests__/**/*.test.ts',
    '<rootDir>/utils/score/__tests__/**/*.test.ts',
    '<rootDir>/utils/difficulty/__tests__/**/*.test.ts',
    '<rootDir>/components/**/__tests__/**/*.test.tsx',
    '<rootDir>/contexts/__tests__/**/*.test.tsx',
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