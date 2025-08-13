let userConfig = undefined
try {
  userConfig = await import('./v0-user-next.config')
} catch (e) {
  // ignore error
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
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
