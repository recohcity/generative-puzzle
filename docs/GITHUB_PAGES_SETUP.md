# GitHub Pages 部署指南

## 🚀 快速部署步骤

### 1. 推送代码到GitHub
```bash
git add .
git commit -m "配置GitHub Pages部署"
git push origin main
```

### 2. 启用GitHub Pages
1. 进入你的GitHub仓库
2. 点击 **Settings** 标签
3. 在左侧菜单中找到 **Pages**
4. 在 **Source** 部分选择 **GitHub Actions**

### 3. 自动部署
- 推送到 `main` 分支会自动触发部署
- 部署完成后，你的网站将在 `https://[你的用户名].github.io/generative-puzzle-game` 可用

## 📁 项目配置说明

### Next.js 配置 (next.config.mjs)
```javascript
// 为GitHub Pages配置的关键设置
output: 'export',                    // 启用静态导出
trailingSlash: true,                 // 添加尾部斜杠
basePath: '/generative-puzzle', // 仓库名作为基础路径
assetPrefix: '/generative-puzzle/', // 资源前缀
```

### GitHub Actions 工作流 (.github/workflows/deploy.yml)
- 自动构建和部署
- 使用Node.js 18
- 支持Next.js静态导出

### 静态数据处理
- API路由 `/api/performance-trend` 已替换为静态文件 `/public/performance-data.json`
- 测试页面现在使用静态数据而不是服务端API

## 🔧 本地测试静态导出

```bash
# 构建静态版本
npm run build

# 预览构建结果（可选）
npx serve out
```

## 📝 注意事项

1. **仓库名称**: 当前配置为 `generative-puzzle`，如果仓库名不同请修改 `next.config.mjs` 中的路径
2. **分支**: 默认从 `main` 分支部署，如果你使用其他分支，请修改工作流文件
3. **性能数据**: 由于使用静态导出，性能测试页面将显示空数据，除非手动更新 `public/performance-data.json`
4. **API功能**: 所有服务端API功能在静态导出中不可用

## 🎯 访问你的网站

部署成功后，访问：
```
https://[你的GitHub用户名].github.io/generative-puzzle
```

## 🔄 更新部署

每次推送到 `main` 分支都会自动重新部署。部署状态可以在仓库的 **Actions** 标签中查看。