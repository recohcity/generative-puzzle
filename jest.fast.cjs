// 快速单测配置：并行、开启缓存、Node/jsdom 分项目、关闭额外 SourceMap
/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  cache: true,
  maxWorkers: '80%',
  // 使用 projects 将不同环境的测试拆分，减少不必要的 jsdom 成本
  projects: [
    {
      displayName: 'node-utils-fast',
      preset: 'ts-jest',
      testEnvironment: 'node',
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
      },
transform: {
        '^.+\\.(ts|tsx)$': ['@swc/jest', {
          sourceMaps: false,
          jsc: {
            parser: { syntax: 'typescript', tsx: true },
            target: 'es2022',
            transform: { react: { runtime: 'automatic' } }
          }
        }],
      },
      testMatch: [
        '<rootDir>/utils/__tests__/**/*.test.ts',
        '<rootDir>/utils/geometry/**/__tests__/**/*.test.ts',
        '<rootDir>/utils/puzzle/**/__tests__/**/*.test.ts',
        '<rootDir>/utils/shape/**/__tests__/**/*.test.ts',
        '<rootDir>/utils/leaderboard/**/__tests__/**/*.test.ts',
        '<rootDir>/utils/difficulty/**/__tests__/**/*.test.ts',
        '<rootDir>/src/quality-system/**/__tests__/**/*.test.ts',
      ],
      testPathIgnorePatterns: [
        '/node_modules/',
        '/utils/puzzle/__tests__/cutGenerators-performance.test.ts',
        // 明确排除会在 jsdom 项目中运行的目录
        '/utils/rendering/__tests__/',
        '/utils/score/__tests__/',
        '/utils/data/__tests__/',
        '/utils/angleDisplay/__tests__/'
      ],
    },
    {
      displayName: 'jsdom-components-fast',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
      },
transform: {
        '^.+\\.(ts|tsx)$': ['@swc/jest', {
          sourceMaps: false,
          jsc: {
            parser: { syntax: 'typescript', tsx: true },
            target: 'es2022',
            transform: { react: { runtime: 'automatic' } }
          }
        }],
      },
      testMatch: [
        '<rootDir>/utils/rendering/**/__tests__/**/*.test.ts',
        '<rootDir>/utils/score/**/__tests__/**/*.test.ts',
        '<rootDir>/utils/data/**/__tests__/**/*.test.ts',
        '<rootDir>/utils/angleDisplay/**/__tests__/**/*.test.ts',
        '<rootDir>/components/**/__tests__/**/*.test.tsx',
        '<rootDir>/contexts/**/__tests__/**/*.test.tsx',
        '<rootDir>/src/quality-system/components/**/__tests__/**/*.test.tsx',
      ],
    },
  ],
};

