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
    "build": "next build",                                    // 开发构建
    "build:github": "NODE_ENV=production BUILD_STATIC=true next build", // 部署构建
    "start": "next start"                                     // 开发服务器
  }
}
```

### 静态数据处理
- **测试页面**: 使用 `/performance-data.json` 静态文件
- **性能数据**: 通过 `playwright-test-logs/` 目录归档
- **API替代**: 所有动态API改为静态文件

## 🔍 故障排除

### 常见问题及解决方案

#### 1. 页面加载卡在1%
**原因**: 自定义域名配置了路径前缀
**解决**: 注释掉 `basePath` 和 `assetPrefix` 配置

#### 2. 资源404错误
**原因**: 路径配置不匹配
**解决**: 检查域名类型，调整路径前缀配置

#### 3. 构建失败
**原因**: API路由与静态导出冲突
**解决**: 确保使用 `build:github` 脚本，移除动态API

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
3. 推送代码触发部署

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

**技术指标**:
- 首页加载: 104kB
- 测试页面: 214kB  
- 构建成功率: 100%
- 用户体验: 无语言闪烁，加载流畅

---

## 📚 相关文档

- [项目配置文档](../configuration/README.md)
- [测试系统文档](../testing/playwright-automation.md)
- [性能优化指南](../configuration/performance.md)

---

**维护说明**: 本文档整合了GitHub Pages标准部署和自定义域名配置的完整流程，定期更新以反映最新的部署实践。