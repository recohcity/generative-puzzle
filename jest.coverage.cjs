// 覆盖专用配置：并行、缓存开启、精准 SourceMap、Node/jsdom 分项目
/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  cache: true,
  maxWorkers: '80%',
  collectCoverage: true,
  coverageProvider: 'v8',
  coverageReporters: ['text', 'json-summary'],
  collectCoverageFrom: [
    'utils/**/*.{ts,tsx}',
    '!utils/**/*.d.ts',
    '!utils/**/__tests__/**',
    '!utils/**/node_modules/**',
    // 排除开发期数据工具（非产品代码，不纳入覆盖率）
    '!utils/data-tools/**',
    // 散开效果文件不统计覆盖
    '!utils/**/ScatterPuzzle.ts',
    // 类型定义文件不统计覆盖
    '!utils/**/cutGeneratorTypes.ts',
  ],
  // 额外的覆盖忽略路径，双保险
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/utils/data-tools/',
    '/utils/**/ScatterPuzzle.ts',
    '/utils/**/cutGeneratorTypes.ts',
  ],
  projects: [
    {
      displayName: 'node-utils-cov',
      preset: 'ts-jest',
      testEnvironment: 'node',
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
      },
      transform: {
        '^.+\\.(ts|tsx)$': ['@swc/jest', {
          sourceMaps: true,
          inputSourceMap: true,
          jsc: {
            parser: { syntax: 'typescript', tsx: true },
            target: 'es2022',
            transform: { react: { runtime: 'automatic' } }
          }
        }],
      },
      // 仅包含不依赖 DOM 的 Node 环境测试，避免与 jsdom 项目重复
      testMatch: [
        '<rootDir>/utils/__tests__/**/*.test.ts',
        '<rootDir>/utils/geometry/**/__tests__/**/*.test.ts',
        '<rootDir>/utils/puzzle/**/__tests__/**/*.test.ts',
        '<rootDir>/utils/shape/**/__tests__/**/*.test.ts',
        '<rootDir>/utils/leaderboard/**/__tests__/**/*.test.ts',
        '<rootDir>/utils/difficulty/**/__tests__/**/*.test.ts',
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
      displayName: 'jsdom-components-cov',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
      },
      transform: {
        '^.+\\.(ts|tsx)$': ['@swc/jest', {
          sourceMaps: true,
          inputSourceMap: true,
          jsc: {
            parser: { syntax: 'typescript', tsx: true },
            target: 'es2022',
            transform: { react: { runtime: 'automatic' } }
          }
        }],
      },
      // 仅包含依赖 DOM/浏览器环境的测试
      testMatch: [
        '<rootDir>/utils/rendering/**/__tests__/**/*.test.ts',
        '<rootDir>/utils/score/**/__tests__/**/*.test.ts',
        '<rootDir>/utils/data/**/__tests__/**/*.test.ts',
        '<rootDir>/utils/angleDisplay/**/__tests__/**/*.test.ts',
        '<rootDir>/components/**/__tests__/**/*.test.tsx',
        '<rootDir>/contexts/**/__tests__/**/*.test.tsx'
      ],
    },
  ],
};

