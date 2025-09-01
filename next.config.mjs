let userConfig = undefined
try {
  userConfig = await import('./v0-user-next.config')
} catch (e) {
  // ignore error
}

// 读取package.json获取版本号
import { readFileSync } from 'fs'
import { join } from 'path'

const packageJson = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf8'))

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ✅ 遵循监督指令：启用构建时质量检查
  eslint: {
    ignoreDuringBuilds: false,  // 构建时执行ESLint检查
  },
  typescript: {
    ignoreBuildErrors: false,   // 构建时执行TypeScript检查
  },
  // 添加环境变量
  env: {
    APP_VERSION: packageJson.version,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    webpackBuildWorker: true,
    parallelServerBuildTraces: true,
    parallelServerCompiles: true,
  },
  reactStrictMode: false,
  // 条件静态导出 - 开发环境支持npm run start，生产环境支持GitHub Pages
  ...(process.env.NODE_ENV === 'production' && process.env.BUILD_STATIC === 'true' && {
    output: 'export',
    trailingSlash: true,
  }),
  // 使用自定义域名时不需要basePath和assetPrefix
  // basePath: process.env.NODE_ENV === 'production' ? '/generative-puzzle' : '',
  // assetPrefix: process.env.NODE_ENV === 'production' ? '/generative-puzzle/' : '',
}

mergeConfig(nextConfig, userConfig)

// 移除 force-dynamic，因为静态导出不支持
// export const dynamic = "force-dynamic";

function mergeConfig(nextConfig, userConfig) {
  if (!userConfig) {
    return
  }

  for (const key in userConfig) {
    if (
      typeof nextConfig[key] === 'object' &&
      !Array.isArray(nextConfig[key])
    ) {
      nextConfig[key] = {
        ...nextConfig[key],
        ...userConfig[key],
      }
    } else {
      nextConfig[key] = userConfig[key]
    }
  }
}

export default nextConfig
