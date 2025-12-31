# 🚀 GitHub Pages 部署管理指南

## 📋 概述

本文档提供完整的GitHub Pages部署配置、管理和故障排除指南，涵盖标准部署和自定义域名配置两种场景。

## 🎯 部署架构

### 智能构建系统
项目采用条件静态导出架构，支持开发和生产双模式：

```javascript
// next.config.mjs - 智能配置
...(process.env.NODE_ENV === 'production' && process.env.BUILD_STATIC === 'true' && {
  output: 'export',
  trailingSlash: true,
}),
```

**双模式支持**：
- **开发模式**: `npm run build` + `npm run start` - 完整Next.js功能
- **部署模式**: `npm run build:github` - 静态导出，适配GitHub Pages

## 🚀 快速部署步骤

### 1. 代码推送
```bash
git add .
git commit -m "部署到GitHub Pages"
git push origin main
```

### 2. 启用GitHub Pages
1. 进入GitHub仓库 → **Settings** → **Pages**
2. **Source** 选择 **GitHub Actions**
3. 自动触发部署工作流

### 3. 验证部署
- 查看 **Actions** 标签页的部署状态
- 部署成功后访问生成的URL

## 🌐 部署场景配置

### 场景1：标准GitHub Pages部署

**访问地址**: `https://[用户名].github.io/[仓库名]`

**配置要求**:
```javascript
// next.config.mjs (如需路径前缀)
basePath: '/generative-puzzle',
assetPrefix: '/generative-puzzle/',
output: 'export',
trailingSlash: true,
```

### 场景2：自定义域名部署 ⭐

**访问地址**: `https://your-domain.com`

**配置要求**:
```javascript
// next.config.mjs (无需路径前缀)
// basePath: '/generative-puzzle',     // 注释掉
// assetPrefix: '/generative-puzzle/', // 注释掉
output: 'export',
trailingSlash: true,
```

## 🔧 自定义域名配置

### DNS设置
```
类型: CNAME
名称: @ (或www)
值: [用户名].github.io
```

### GitHub Pages设置
1. **Settings** → **Pages** → **Custom domain**
2. 输入你的域名（如：`citylivepark.com`）
3. 启用 **Enforce HTTPS**
4. 等待DNS验证完成

### 配置验证清单
- [ ] DNS记录正确配置
- [ ] GitHub Pages自定义域名设置完成
- [ ] CNAME文件自动生成在仓库根目录
- [ ] HTTPS证书自动配置
- [ ] 网站资源正常加载（无404错误）

## ⚙️ 构建配置详解

### GitHub Actions工作流
```yaml
# .github/workflows/deploy.yml
- name: Build project
  run: npm run build:github  # 使用专用构建脚本
```

### 构建脚本
```json
// package.json
{
  "scripts": {
    "build": "next build",                    // 开发构建
    "build:github": "node scripts/build-for-github.cjs", // 智能部署构建
    "start": "next start"                     // 开发服务器
  }
}
```

### 🔧 智能API处理机制

项目采用智能构建脚本 `scripts/build-for-github.cjs` 解决API路由与静态导出的冲突：

**工作原理**：
1. **构建前**: 自动备份 `app/api/` 目录到 `.api-backup/`
2. **构建时**: 临时移除API文件，执行静态导出
3. **构建后**: 自动恢复API文件，保持本地开发完整性

**优势**：
- ✅ **本地开发不受影响**: API功能完全正常
- ✅ **GitHub Pages构建成功**: 自动处理API冲突
- ✅ **自动化处理**: 无需手动干预
- ✅ **可逆操作**: 构建后自动恢复所有文件

```javascript
// scripts/build-for-github.cjs 核心逻辑
// 1. 备份API文件
fs.cpSync(API_DIR, BACKUP_DIR, { recursive: true });
fs.rmSync(API_DIR, { recursive: true, force: true });

// 2. 执行静态构建
execSync('NODE_ENV=production BUILD_STATIC=true next build');

// 3. 恢复API文件
fs.cpSync(BACKUP_DIR, API_DIR, { recursive: true });
```

### 静态数据处理
- **测试页面**: 使用 `/performance-data.json` 静态文件
- **性能数据**: 通过 `playwright-test-logs/` 目录归档
- **API处理**: 智能构建脚本自动处理API路由冲突
- **数据源**: 本地开发使用API，生产环境使用静态JSON

### 🔄 API与静态导出兼容方案

**问题**: Next.js静态导出不支持API路由，导致GitHub Pages构建失败

**解决方案**: 双模式数据获取
```typescript
// 测试页面数据获取逻辑
useEffect(() => {
  async function fetchData() {
    try {
      // 优先尝试静态文件（生产环境）
      const res = await fetch('/performance-data.json');
      if (!res.ok) throw new Error('Static file not found');
      const data = await res.json();
      setTrendData(data);
    } catch (e) {
      // 降级到API路由（开发环境）
      console.log('Fallback to API route');
      // API逻辑...
    }
  }
  fetchData();
}, []);
```

**文件结构**:
```
├── app/api/performance-trend/    # 开发环境API（构建时临时移除）
├── public/performance-data.json  # 生产环境静态数据
└── scripts/build-for-github.cjs  # 智能构建脚本
```

## 🔍 故障排除

### 常见问题及解决方案

#### 1. 页面加载卡在1%
**原因**: 自定义域名配置了路径前缀
**解决**: 注释掉 `basePath` 和 `assetPrefix` 配置

#### 2. 资源404错误
**原因**: 路径配置不匹配
**解决**: 检查域名类型，调整路径前缀配置

#### 3. 构建失败 - API路由冲突
**原因**: API路由与静态导出冲突
**解决**: 
- ✅ **自动处理**: 使用 `npm run build:github` 智能构建脚本
- ✅ **手动处理**: 临时注释 `.gitignore` 中的 `# app/api/` 行
- ⚠️ **注意**: 手动处理会影响本地API功能

**智能构建脚本优势**:
```bash
# 推荐方式 - 自动处理API冲突
npm run build:github

# 验证构建产物
ls -la out/  # 应该包含完整的静态文件
```

#### 4. DNS传播延迟
**原因**: DNS记录更新需要时间
**解决**: 等待几分钟到几小时，清除浏览器缓存

### 调试步骤
1. **检查构建日志**: Actions → 最新工作流 → 查看详细日志
2. **验证DNS**: 使用DNS查询工具检查记录
3. **测试资源**: 开发者工具 → Network → 检查404错误
4. **清除缓存**: 强制刷新浏览器缓存

## 📊 部署监控

### 构建状态检查
- **成功标志**: ✅ Status: Success
- **构建时间**: 通常1-2分钟
- **产物大小**: 约2-3MB静态文件

### 性能监控
- **首次加载**: ≤104kB (主页)
- **测试页面**: ≤214kB
- **静态资源**: 自动CDN加速

## 🛠️ 维护操作

### 日常更新
```bash
# 代码更新
git add .
git commit -m "更新内容"
git push origin main
# 自动触发重新部署
```

### 域名变更
1. 更新DNS记录
2. GitHub Pages设置新域名
3. 等待验证完成
4. 测试新域名访问

### 配置调整
1. 修改 `next.config.mjs`
2. 测试本地构建: `npm run build:github`
3. 验证API处理: 检查 `out/` 目录不包含API文件
4. 推送代码触发部署

### API功能维护
```bash
# 开发环境 - 完整功能
npm run dev          # API路由正常工作
npm run test:e2e     # 测试页面可视化报告正常

# 生产构建 - 静态导出
npm run build:github # 自动处理API冲突
ls -la out/          # 验证静态文件完整性

# 本地验证 - 模拟生产环境
npx serve out        # 测试静态文件服务
```

## 📝 最佳实践

### 开发流程
1. **本地开发**: `npm run dev`
2. **本地测试**: `npm run build` + `npm run start`
3. **部署测试**: `npm run build:github` 验证静态导出
4. **推送部署**: `git push origin main`

### 性能优化
- ✅ 静态导出减少服务器负载
- ✅ CDN自动加速全球访问
- ✅ 压缩资源减少传输大小
- ✅ 缓存策略优化加载速度

### 安全考虑
- ✅ 强制HTTPS加密传输
- ✅ 静态文件无服务端漏洞
- ✅ GitHub基础设施安全保障

## 🎯 成功案例

**当前部署状态**:
- 🌐 **域名**: https://www.citylivepark.com/
- ⚡ **构建时间**: 1分12秒
- 📦 **产物大小**: 2.96MB
- ✅ **部署状态**: 成功运行
- 🔧 **API处理**: 智能构建脚本自动处理

**技术指标**:
- 首页加载: 104kB
- 测试页面: 214kB (包含可视化报告)
- 构建成功率: 100%
- 用户体验: 无语言闪烁，加载流畅
- API兼容性: 开发环境100%功能，生产环境静态替代

**API处理成效**:
- ✅ **本地开发**: `/test` 页面可视化报告完全正常
- ✅ **GitHub Pages**: 构建成功，无API冲突
- ✅ **数据完整性**: 性能数据正常显示和分析
- ✅ **维护便利**: 无需手动干预，自动化处理

---

## � AP文I处理详细说明

### 问题背景
Next.js的API路由（`app/api/`）在静态导出模式下不被支持，导致GitHub Pages构建失败。传统解决方案要么完全移除API功能，要么影响本地开发体验。

### 智能解决方案
我们采用智能构建脚本 `scripts/build-for-github.cjs`，实现了**零影响的API处理机制**：

#### 核心特性
1. **自动备份恢复**: 构建前备份API文件，构建后自动恢复
2. **环境隔离**: 开发环境保持完整功能，生产环境使用静态替代
3. **透明处理**: 开发者无需关心API冲突，专注业务开发
4. **数据一致性**: 确保开发和生产环境数据格式一致

#### 实现细节
```javascript
// scripts/build-for-github.cjs
const API_DIR = path.join(process.cwd(), 'app/api');
const BACKUP_DIR = path.join(process.cwd(), '.api-backup');

// 1. 备份API文件
if (fs.existsSync(API_DIR)) {
  fs.cpSync(API_DIR, BACKUP_DIR, { recursive: true });
  fs.rmSync(API_DIR, { recursive: true, force: true });
}

// 2. 执行静态构建
execSync('NODE_ENV=production BUILD_STATIC=true next build');

// 3. 恢复API文件
if (fs.existsSync(BACKUP_DIR)) {
  fs.cpSync(BACKUP_DIR, API_DIR, { recursive: true });
  fs.rmSync(BACKUP_DIR, { recursive: true, force: true });
}
```

#### 数据流转机制
```
开发环境:
用户访问 /test → API路由 → 动态数据 → 可视化报告

生产环境:
用户访问 /test → 静态JSON → 相同数据 → 相同报告
```

### 使用指南

#### 开发阶段
```bash
npm run dev          # API功能完全正常
npm run test:e2e     # 生成性能数据到API
```

#### 部署阶段
```bash
npm run build:github # 自动处理API，生成静态文件
git push origin main  # 触发GitHub Pages部署
```

#### 验证检查
```bash
# 本地验证构建结果
npm run build:github
ls -la out/           # 确认无API文件
ls -la app/api/       # 确认API文件已恢复

# 验证功能完整性
npm run dev
curl http://localhost:3000/api/performance-trend  # API正常
```

### 故障排除

#### 构建脚本失败
```bash
# 检查脚本权限
chmod +x scripts/build-for-github.cjs

# 手动执行验证
node scripts/build-for-github.cjs
```

#### API文件未恢复
```bash
# 检查备份目录
ls -la .api-backup/

# 手动恢复
cp -r .api-backup/ app/api/
rm -rf .api-backup/
```

#### 数据不一致
```bash
# 更新静态数据文件
npm run test:e2e     # 生成最新测试数据
# 手动同步到 public/performance-data.json
```

### 最佳实践

1. **定期同步**: 运行E2E测试后，确保静态数据文件是最新的
2. **构建验证**: 每次重要更新后，本地运行 `npm run build:github` 验证
3. **功能测试**: 部署后验证测试页面的可视化报告功能
4. **监控日志**: 关注GitHub Actions构建日志，确保API处理正常

---

## 📚 相关文档

- **[配置手册](./configuration/)**: 性能、内存及适配的具体数值阈值配置。
- [测试系统文档](../testing/playwright-automation.md)
- [性能优化指南](../configuration/performance.md)
- [API处理脚本](../scripts/build-for-github.cjs)

---

**维护说明**: 本文档整合了GitHub Pages标准部署、自定义域名配置和API处理的完整流程，定期更新以反映最新的部署实践。智能API处理机制确保了开发体验和部署成功的完美平衡。