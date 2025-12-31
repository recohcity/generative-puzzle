# 构建与开发配置

> 修订日期：2025-12-31 (v1.3.71 移动端进化)

本文档详细说明项目构建和开发环境的配置参数，包括Next.js配置、TypeScript配置、样式配置、测试配置等核心配置。

---

## 1. Next.js 框架配置

### next.config.mjs
- **作用**：Next.js 框架构建配置
- **主要配置**：
  - 静态资源处理
  - 图片优化配置
  - 构建输出设置
  - 环境变量配置
- **默认值**：标准Next.js配置
- **影响点**：应用构建、性能优化、部署
- **配置/代码位置**：`next.config.mjs`

### staticAssetOptimization
- **作用**：静态资源优化配置
- **优化策略**：
  - 图片自动优化和压缩
  - 静态文件缓存策略
  - 资源预加载配置
- **配置参数**：
  - 图片格式：WebP优先，JPEG/PNG降级
  - 缓存时间：静态资源1年，动态资源1小时
  - 压缩级别：高压缩比
- **默认值**：启用所有优化
- **影响点**：加载性能、用户体验
- **配置/代码位置**：`next.config.mjs`（图片和静态资源配置）

### buildOptimization
- **作用**：构建优化配置
- **优化选项**：
  - 代码分割和懒加载
  - Tree shaking优化
  - Bundle分析和优化
- **构建目标**：
  - Bundle大小：< 2MB
  - 首屏加载：< 3s
  - 构建时间：< 2min
- **默认值**：启用构建优化
- **影响点**：构建性能、运行时性能
- **配置/代码位置**：`next.config.mjs`（构建优化选项）

---

## 2. TypeScript 配置

### tsconfig.json
- **作用**：TypeScript 编译配置
- **主要配置**：
  - 编译选项设置
  - 路径映射配置
  - 严格模式设置
  - 模块解析配置
- **默认值**：严格TypeScript配置
- **影响点**：类型检查、编译性能、代码质量
- **配置/代码位置**：`tsconfig.json`

### strictModeConfiguration
- **作用**：TypeScript严格模式配置
- **严格选项**：
  - `strict: true`：启用所有严格检查
  - `noImplicitAny: true`：禁止隐式any类型
  - `strictNullChecks: true`：严格空值检查
  - `noImplicitReturns: true`：检查函数返回值
- **默认值**：启用所有严格检查
- **影响点**：代码质量、类型安全
- **配置/代码位置**：`tsconfig.json`（compilerOptions）

### pathMapping
- **作用**：路径映射配置
- **映射规则**：
  - `@/*`：映射到项目根目录
  - `@/components/*`：映射到components目录
  - `@/utils/*`：映射到utils目录
  - `@/types/*`：映射到types目录
- **默认值**：标准路径映射
- **影响点**：导入路径简化、代码组织
- **配置/代码位置**：`tsconfig.json`（paths配置）

### typeDefinitions
- **作用**：类型定义配置
- **类型文件**：
  - `types/global.d.ts`：全局类型声明
  - `types/puzzleTypes.ts`：业务类型定义
  - `types/common.ts`：通用类型定义
  - `next-env.d.ts`：Next.js环境类型
- **默认值**：完整类型定义
- **影响点**：类型提示、编译检查
- **配置/代码位置**：`types/`目录

---

## 3. 样式配置

### tailwind.config.ts
- **作用**：Tailwind CSS 配置
- **主要配置**：
  - 主题色彩定义
  - 响应式断点设置
  - 自定义样式扩展
  - 插件配置
- **默认值**：项目定制主题
- **影响点**：UI样式、主题一致性
- **配置/代码位置**：`tailwind.config.ts`

### themeConfiguration
- **作用**：主题配置
- **主题设置**：
  - 主色调：amber-400 (#fbbf24)
  - 背景色：渐变背景
  - 文字色：高对比度
  - 边框色：柔和边框
- **暗色模式**：支持系统主题切换
- **默认值**：明亮主题
- **影响点**：视觉一致性、用户体验
- **配置/代码位置**：`tailwind.config.ts`（theme配置）

### responsiveBreakpoints
- **作用**：响应式断点配置
- **断点设置**：
  - `sm: 640px`：小屏设备
  -*📝 文档维护: 本文档反映v1.3.71的实际架构状态*  
*🔄 最后更新: 2025年12月31日*
  - `xl: 1280px`：超大屏幕
  - `2xl: 1536px`：超宽屏幕
- **默认值**：标准Tailwind断点
- **影响点**：响应式布局、设备适配
- **配置/代码位置**：`tailwind.config.ts`（screens配置）

### postcss.config.mjs
- **作用**：PostCSS 配置
- **插件配置**：
  - Tailwind CSS处理
  - Autoprefixer自动前缀
  - CSS优化和压缩
- **默认值**：标准PostCSS配置
- **影响点**：CSS处理、浏览器兼容性
- **配置/代码位置**：`postcss.config.mjs`

---

## 4. 组件库配置

### components.json
- **作用**：Shadcn UI 组件配置
- **配置内容**：
  - 组件样式主题
  - 组件导入路径
  - 自定义组件配置
- **组件特性**：
  - 无描边按钮风格
  - 统一24px图标尺寸
  - 一致的交互反馈
- **默认值**：项目定制配置
- **影响点**：UI组件一致性、开发效率
- **配置/代码位置**：`components.json`

### uiComponentStandards
- **作用**：UI组件标准配置
- **设计标准**：
  - 按钮图标：24px统一尺寸
  - 颜色方案：amber主色调
  - 间距规范：Tailwind spacing
  - 动画效果：统一缓动函数
- **默认值**：严格设计标准
- **影响点**：UI一致性、用户体验
- **配置/代码位置**：`components/ui/`目录

### componentOptimization
- **作用**：组件性能优化配置
- **优化策略**：
  - 组件懒加载
  - 样式按需加载
  - 组件代码分割
- **默认值**：启用组件优化
- **影响点**：加载性能、Bundle大小
- **配置/代码位置**：组件导入配置

---

## 5. 测试配置

### jest.config.js
- **作用**：Jest 单元测试配置
- **主要配置**：
  - 测试环境设置
  - 模块映射配置
  - 覆盖率报告设置
  - 测试文件匹配规则
- **默认值**：标准Jest配置
- **影响点**：单元测试执行、覆盖率统计
- **配置/代码位置**：`jest.config.js`

### testEnvironment
- **作用**：测试环境配置
- **环境设置**：
  - 测试环境：jsdom（浏览器模拟）
  - 全局变量：测试专用全局变量
  - 模拟配置：API和外部依赖模拟
- **默认值**：浏览器模拟环境
- **影响点**：测试执行环境、测试准确性
- **配置/代码位置**：`jest.config.js`（testEnvironment配置）

### coverageConfiguration
- **作用**：代码覆盖率配置
- **覆盖率目标**：
  - 语句覆盖率：> 80%
  - 分支覆盖率：> 75%
  - 函数覆盖率：> 85%
  - 行覆盖率：> 80%
- **排除文件**：测试文件、配置文件、类型定义
- **默认值**：启用覆盖率统计
- **影响点**：代码质量评估、测试完整性
- **配置/代码位置**：`jest.config.js`（coverage配置）

### playwright.config.ts
- **作用**：Playwright E2E 测试配置
- **主要配置**：
  - 浏览器配置（Chrome、Firefox、Safari）
  - 测试超时设置
  - 报告生成配置
  - 并发执行配置
- **默认值**：多浏览器并行测试
- **影响点**：E2E测试执行、测试报告
- **配置/代码位置**：`playwright.config.ts`

---

## 6. 开发工具配置

### package.json
- **作用**：项目依赖和脚本配置
- **主要脚本**：
  - `dev`：开发服务器启动
  - `build`：生产构建
  - `test`：单元测试执行
  - `e2e`：E2E测试执行
- **依赖管理**：
  - 生产依赖：运行时必需依赖
  - 开发依赖：开发和构建工具
  - 版本锁定：确保环境一致性
- **默认值**：完整依赖配置
- **影响点**：项目构建、依赖管理
- **配置/代码位置**：`package.json`

### developmentScripts
- **作用**：开发脚本配置
- **脚本功能**：
  - `dev`：启动开发服务器，热重载
  - `build`：生产环境构建
  - `start`：生产服务器启动
  - `lint`：代码检查和格式化
  - `lint`：代码检查和格式化
  - `test`：运行所有测试
  - `docs:check`：文档完整性与API检查
- **默认值**：标准开发脚本
- **影响点**：开发效率、构建流程
- **配置/代码位置**：`package.json`（scripts配置）

### dependencyManagement
- **作用**：依赖管理配置
- **管理策略**：
  - 版本锁定：使用package-lock.json
  - 安全更新：定期更新依赖
  - 依赖审计：检查安全漏洞
- **依赖分类**：
  - 核心依赖：React、Next.js、TypeScript
  - UI依赖：Tailwind、Shadcn UI
  - 工具依赖：Jest、Playwright、ESLint
- **默认值**：稳定版本依赖
- **影响点**：项目稳定性、安全性
- **配置/代码位置**：`package.json`、`package-lock.json`

---

## 7. 环境配置

### environmentVariables
- **作用**：环境变量配置
- **变量类型**：
  - `NODE_ENV`：环境标识（development/production）
  - `NEXT_PUBLIC_*`：客户端环境变量
  - 私有变量：服务端专用变量
- **配置文件**：
  - `.env.local`：本地开发环境
  - `.env.production`：生产环境
  - `.env.example`：环境变量示例
- **默认值**：开发环境配置
- **影响点**：环境区分、功能开关
- **配置/代码位置**：环境变量文件

### developmentEnvironment
- **作用**：开发环境配置
- **开发特性**：
  - 热重载：代码变更自动刷新
  - 源码映射：便于调试
  - 详细错误：完整错误堆栈
  - 性能监控：开发性能分析
- **默认值**：启用所有开发特性
- **影响点**：开发体验、调试效率
- **配置/代码位置**：`next.config.mjs`（开发配置）

### productionEnvironment
- **作用**：生产环境配置
- **生产特性**：
  - 代码压缩：最小化Bundle
  - 错误处理：用户友好错误页面
  - 性能优化：缓存和优化策略
  - 安全配置：安全头和HTTPS
- **默认值**：生产优化配置
- **影响点**：生产性能、用户体验
- **配置/代码位置**：`next.config.mjs`（生产配置）

---

## 8. 代码质量配置

### eslintConfiguration
- **作用**：ESLint 代码检查配置
- **检查规则**：
  - TypeScript规则：类型检查
  - React规则：组件最佳实践
  - Next.js规则：框架特定规则
  - 自定义规则：项目特定规范
- **默认值**：严格代码规范
- **影响点**：代码质量、团队协作
- **配置/代码位置**：`.eslintrc.json`

### prettierConfiguration
- **作用**：Prettier 代码格式化配置
- **格式规则**：
  - 缩进：2空格
  - 引号：单引号
  - 分号：必需
  - 行宽：80字符
- **默认值**：标准格式化规则
- **影响点**：代码风格一致性
- **配置/代码位置**：`.prettierrc`

### codeQualityGates
- **作用**：代码质量门禁配置
- **质量标准**：
  - ESLint检查：无错误
  - TypeScript编译：无错误
  - 测试覆盖率：> 80%
  - 构建成功：无警告
- **默认值**：严格质量标准
- **影响点**：代码质量保证
- **配置/代码位置**：CI/CD配置

---

## 9. 构建优化配置

### bundleOptimization
- **作用**：Bundle优化配置
- **优化策略**：
  - 代码分割：按路由和组件分割
  - Tree shaking：移除未使用代码
  - 压缩优化：代码和资源压缩
  - 缓存策略：长期缓存配置
- **优化目标**：
  - 首屏Bundle：< 500KB
  - 总Bundle：< 2MB
  - 加载时间：< 3s
- **默认值**：启用所有优化
- **影响点**：加载性能、用户体验
- **配置/代码位置**：`next.config.mjs`（优化配置）

### assetOptimization
- **作用**：资源优化配置
- **优化内容**：
  - 图片优化：WebP转换、压缩
  - 字体优化：字体子集、预加载
  - CSS优化：压缩、去重
  - JS优化：压缩、混淆
- **默认值**：启用资源优化
- **影响点**：资源大小、加载速度
- **配置/代码位置**：构建优化配置

### performanceMonitoring
- **作用**：构建性能监控配置
- **监控指标**：
  - 构建时间：总时间和各阶段时间
  - Bundle大小：各模块大小分析
  - 依赖分析：依赖关系和大小
- **默认值**：启用性能监控
- **影响点**：构建性能优化
- **配置/代码位置**：构建分析工具

---

### v1.3.71 (2025/12/31)
- ✅ iPhone 17系列支持
- ✅ 视觉渲染架构优化 (Remove Shadows/Blur)
- ✅ 移动端横屏极限空间算法

### v1.3.39 (当前版本)
- ✅ SimpleAdapter统一适配

## 10. 部署配置

### deploymentConfiguration
- **作用**：部署配置
- **部署策略**：
  - 静态导出：生成静态文件
  - 服务端渲染：SSR配置
  - 增量静态再生：ISR配置
- **部署目标**：
  - Vercel：推荐部署平台
  - Netlify：静态部署选项
  - 自托管：Docker容器部署
- **默认值**：Vercel部署配置
- **影响点**：部署方式、性能表现
- **配置/代码位置**：`next.config.mjs`（部署配置）

### cicdConfiguration
- **作用**：CI/CD配置
- **流水线阶段**：
  - 代码检查：ESLint、TypeScript
  - 测试执行：单元测试、E2E测试
  - 构建验证：构建成功验证
  - 部署发布：自动部署
- **默认值**：完整CI/CD流程
- **影响点**：开发流程、部署自动化
- **配置/代码位置**：`.github/workflows/`

---

## 11. 配置示例

### 基础构建配置示例
```javascript
// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  },
  experimental: {
    optimizeCss: true,
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  }
};

export default nextConfig;
```

### TypeScript配置示例
```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### 测试配置示例
```javascript
// jest.config.js
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  collectCoverageFrom: [
    'components/**/*.{js,jsx,ts,tsx}',
    'utils/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 85,
      lines: 80,
      statements: 80,
    },
  },
};

module.exports = createJestConfig(customJestConfig);
```

---

## 12. 故障排除

### 常见问题
1. **构建失败**：检查TypeScript错误和依赖问题
2. **样式不生效**：验证Tailwind配置和PostCSS设置
3. **测试失败**：检查Jest配置和测试环境设置
4. **部署问题**：确认Next.js配置和环境变量

### 调试方法
- 检查构建日志和错误信息
- 验证配置文件语法和路径
- 测试不同环境的配置
- 使用构建分析工具

---

> 📖 **相关文档**
> - [性能测试与报告配置](./16-performance-test.md)
> - [UI 组件配置](./17-ui-components.md)
> - [核心架构配置](./01-core-architecture.md)