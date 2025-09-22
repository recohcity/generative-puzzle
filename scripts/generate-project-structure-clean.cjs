#!/usr/bin/env node

/**
 * 简洁版项目结构文档生成器
 * 专注于快速索引功能，提供清晰的项目结构展示
 */

const fs = require('fs').promises;
const path = require('path');

// 配置
const CONFIG = {
  // 忽略的目录和文件
  ignore: [
    'node_modules',
    '.git',
    '.next',
    'dist',
    'build',
    '.DS_Store',
    '*.log',
    '*.tsbuildinfo'
  ],
  
  // 架构分层定义
  architecture: {
    presentation: {
      name: '表现层 (Presentation Layer)',
      description: 'React组件和UI界面',
      paths: ['components/', 'app/'],
      color: '🎨'
    },
    business: {
      name: '业务层 (Business Layer)', 
      description: '业务逻辑和状态管理',
      paths: ['hooks/', 'contexts/', 'providers/'],
      color: '⚡'
    },
    data: {
      name: '数据层 (Data Layer)',
      description: '数据处理和工具函数',
      paths: ['utils/', 'lib/', 'core/'],
      color: '🔧'
    },
    config: {
      name: '配置层 (Config Layer)',
      description: '配置文件和常量定义',
      paths: ['src/config/', 'constants/', 'types/'],
      color: '⚙️'
    }
  },
  
  // 功能模块定义
  modules: {
    gameCore: {
      name: '🎮 核心游戏功能',
      description: '游戏主要逻辑和界面',
      files: [
        'components/GameInterface.tsx',
        'components/PuzzleCanvas.tsx', 
        'contexts/GameContext.tsx',
        'utils/puzzle/',
        'hooks/usePuzzleInteractions.ts'
      ]
    },
    deviceAdaptation: {
      name: '📱 设备适配系统',
      description: '跨设备响应式适配',
      files: [
        'core/DeviceManager.ts',
        'core/CanvasManager.ts',
        'utils/adaptation/',
        'constants/canvasAdaptation.ts',
        'providers/hooks/useDevice.ts'
      ]
    },
    renderingSystem: {
      name: '🎨 渲染系统',
      description: 'Canvas渲染和视觉效果',
      files: [
        'utils/rendering/',
        'utils/shape/',
        'components/animate-ui/',
        'public/texture-tile.png'
      ]
    },
    testingFramework: {
      name: '🧪 测试体系',
      description: '自动化测试和质量保证',
      files: [
        'e2e/',
        'tests/',
        'scripts/archive-test-results.js',
        'playwright.config.ts'
      ]
    }
  },
  
  // 技术栈定义
  techStack: {
    framework: { name: 'Next.js 15', files: ['app/', 'next.config.mjs'] },
    language: { name: 'TypeScript', files: ['tsconfig.json', '**/*.ts', '**/*.tsx'] },
    styling: { name: 'Tailwind CSS', files: ['tailwind.config.ts', 'app/globals.css'] },
    stateManagement: { name: 'React Context', files: ['contexts/', 'providers/'] },
    testing: { name: 'Playwright + Jest', files: ['e2e/', 'tests/', 'jest.config.js'] },
    ui: { name: 'Shadcn UI', files: ['components/ui/', 'components.json'] }
  },
  
  // 关键文件标记
  keyFiles: [
    { path: 'app/page.tsx', importance: '🔥', role: '应用入口' },
    { path: 'contexts/GameContext.tsx', importance: '🔥', role: '全局状态' },
    { path: 'components/GameInterface.tsx', importance: '🔥', role: '核心界面' },
    { path: 'core/DeviceManager.ts', importance: '⭐', role: '设备管理' },
    { path: 'utils/adaptation/UnifiedAdaptationEngine.ts', importance: '⭐', role: '适配引擎' }
  ],
  
  // 文件和目录描述
  descriptions: {
    // 根目录文件
    'package.json': '项目依赖和脚本配置',
    'package-lock.json': '依赖锁定文件',
    'README.md': '项目说明文档',
    'CHANGELOG.md': '版本历史与变更记录',
    'tsconfig.json': 'TypeScript 编译配置',
    'next.config.mjs': 'Next.js 框架配置',
    'tailwind.config.ts': 'Tailwind CSS 配置',
    'postcss.config.mjs': 'PostCSS 配置',
    'jest.config.js': 'Jest 测试配置',
    'playwright.config.ts': 'Playwright E2E 测试配置',
    'components.json': 'Shadcn UI 组件配置',
    '.gitignore': 'Git 忽略文件配置',
    
    // 目录
    'src/': '源代码目录',
    'app/': 'Next.js 应用目录',
    'components/': 'React 组件库',
    'constants/': '全局常量定义',
    'contexts/': '全局状态管理',
    'hooks/': '自定义 React 钩子',
    'lib/': '通用工具库',
    'types/': 'TypeScript 类型定义',
    'utils/': '核心算法与工具',
    'core/': '核心服务目录',
    'providers/': '统一架构提供者目录',
    'docs/': '项目文档',
    'e2e/': '端到端测试脚本',
    'scripts/': '自动化脚本',
    'tests/': '测试文件',
    'public/': '静态资源',
    'temp/': '临时开发文件',
    
    // 核心文件
    'app/page.tsx': 'Next.js 应用主页',
    'app/layout.tsx': '全局布局',
    'app/globals.css': '全局 CSS 样式',
    'components/GameInterface.tsx': '核心游戏界面',
    'components/PuzzleCanvas.tsx': '主画布组件',
    'contexts/GameContext.tsx': '核心状态管理中心',
    'public/bgm.mp3': '游戏音效文件',
    'public/texture-tile.png': '拼图材质纹理'
  },
  
  output: {
    path: 'docs/project_structure.md'
  },
  
  maxDepth: 6
};

// 读取 .gitignore 文件
async function loadGitignorePatterns() {
  try {
    const gitignoreContent = await fs.readFile('.gitignore', 'utf8');
    return gitignoreContent
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'))
      .map(pattern => pattern.endsWith('/') ? pattern.slice(0, -1) : pattern);
  } catch (error) {
    return [];
  }
}

// 检查是否应该忽略
function shouldIgnore(filePath, ignorePatterns, gitignorePatterns = []) {
  const fileName = path.basename(filePath);
  const relativePath = path.relative('.', filePath);
  
  // 检查基础忽略规则
  const matchesBasic = ignorePatterns.some(pattern => {
    if (pattern.includes('*')) {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return regex.test(fileName) || regex.test(relativePath);
    }
    return fileName === pattern || relativePath === pattern || relativePath.startsWith(pattern + '/');
  });
  
  if (matchesBasic) return true;
  
  // 检查 gitignore 规则
  return gitignorePatterns.some(pattern => {
    if (pattern.startsWith('/')) {
      const cleanPattern = pattern.slice(1);
      if (cleanPattern.includes('*')) {
        const regex = new RegExp('^' + cleanPattern.replace(/\*/g, '.*'));
        return regex.test(relativePath);
      }
      return relativePath === cleanPattern || relativePath.startsWith(cleanPattern + '/');
    }
    
    if (pattern.includes('*')) {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return regex.test(fileName) || regex.test(relativePath);
    }
    
    return fileName === pattern || relativePath === pattern || 
           relativePath.startsWith(pattern + '/') || relativePath.includes('/' + pattern + '/');
  });
}

// 扫描目录
async function scanDirectory(dirPath, config, currentDepth = 0, gitignorePatterns = []) {
  if (currentDepth >= config.maxDepth) return [];
  
  try {
    const items = await fs.readdir(dirPath, { withFileTypes: true });
    const nodes = [];
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item.name);
      
      if (shouldIgnore(fullPath, config.ignore, gitignorePatterns)) continue;
      if (item.name.startsWith('.') && item.name !== '.gitignore') continue;
      
      const node = {
        name: item.name,
        path: fullPath,
        type: item.isDirectory() ? 'directory' : 'file'
      };
      
      if (item.isDirectory()) {
        node.children = await scanDirectory(fullPath, config, currentDepth + 1, gitignorePatterns);
      } else {
        try {
          const stats = await fs.stat(fullPath);
          node.size = stats.size;
          node.modified = stats.mtime;
        } catch (err) {
          // 忽略无法访问的文件
        }
      }
      
      nodes.push(node);
    }
    
    return nodes.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  } catch (err) {
    return [];
  }
}

// 计算统计信息
function calculateStats(nodes) {
  let totalFiles = 0;
  let totalDirectories = 0;
  let totalSize = 0;
  
  function traverse(nodes) {
    for (const node of nodes) {
      if (node.type === 'directory') {
        totalDirectories++;
        if (node.children) traverse(node.children);
      } else {
        totalFiles++;
        if (node.size) totalSize += node.size;
      }
    }
  }
  
  traverse(nodes);
  
  return {
    totalFiles,
    totalDirectories,
    totalSize: formatBytes(totalSize)
  };
}

// 格式化字节数
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 生成目录列表
function generateDirectoryList(nodes, level = 0) {
  let result = '';
  const indent = '  '.repeat(level);
  
  for (const node of nodes) {
    if (node.type === 'directory') {
      result += `${indent}- ${node.name}/\n`;
      if (node.children && node.children.length > 0) {
        result += generateDirectoryList(node.children, level + 1);
      }
    }
  }
  
  return result;
}

// 生成架构概览
function generateArchitectureOverview() {
  let result = '';
  
  for (const [key, layer] of Object.entries(CONFIG.architecture)) {
    result += `### ${layer.name}\n`;
    result += `${layer.description}\n`;
    result += `**主要目录**: ${layer.paths.map(p => `\`${p}\``).join(', ')}\n\n`;
  }
  
  return result;
}

// 生成功能模块
function generateFunctionalModules() {
  let result = '';
  
  for (const [key, module] of Object.entries(CONFIG.modules)) {
    // 移除模块名称中的emoji，只保留文字
    const moduleName = module.name.replace(/^[🎮📱🎨🧪]\s*/, '').replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim();
    result += `### ${moduleName}\n`;
    result += `${module.description}\n\n`;
    result += `**关键文件**:\n`;
    
    for (const file of module.files) {
      const desc = CONFIG.descriptions[file] || '';
      const descText = desc ? ` - ${desc}` : '';
      result += `- \`${file}\`${descText}\n`;
    }
    result += '\n';
  }
  
  return result;
}

// 生成技术栈说明
function generateTechStack() {
  let result = '| 分类 | 技术 | 主要文件 |\n';
  result += '|------|------|----------|\n';
  
  for (const [key, tech] of Object.entries(CONFIG.techStack)) {
    const files = Array.isArray(tech.files) ? tech.files.slice(0, 3).map(f => `\`${f}\``).join(', ') : `\`${tech.files}\``;
    result += `| ${key} | ${tech.name} | ${files} |\n`;
  }
  
  return result;
}

// 生成开发指引
function generateDevelopmentGuide() {
  return `### 关键文件 (开发必知)
${CONFIG.keyFiles.map(file => `- ${file.importance} **\`${file.path}\`** - ${file.role}`).join('\n')}

### 开发流程 (5步法)
\`\`\`
1. 组件开发 → components/     2. 业务逻辑 → hooks/, utils/
3. 状态管理 → contexts/       4. 类型定义 → types/
5. 测试编写 → tests/, e2e/
\`\`\`

### 命名规范
| 类型 | 规范 | 示例 |
|------|------|------|
| React组件 | PascalCase | \`GameInterface.tsx\` |
| Hook函数 | use前缀 | \`useDevice.ts\` |
| 工具函数 | camelCase | \`puzzleUtils.ts\` |
| 常量定义 | UPPER_CASE | \`CANVAS_SIZE\` |
| 目录名称 | kebab-case | \`animate-ui/\` |

### 开发命令
\`\`\`bash
npm run dev                    # 启动开发服务器
npm run build                  # 构建生产版本
npm run test                   # 运行单元测试
npm run test:e2e              # 运行E2E测试
npm run generate-structure     # 更新项目结构文档
npm run lint                   # 代码检查
\`\`\`

### 常见开发任务快速定位

| 开发任务 | 主要文件位置 | 说明 |
|----------|-------------|------|
| 修改游戏逻辑 | \`components/GameInterface.tsx\`, \`contexts/GameContext.tsx\` | 核心游戏功能 |
| 调整UI样式 | \`components/\`, \`app/globals.css\`, \`tailwind.config.ts\` | 界面和样式 |
| 设备适配问题 | \`core/DeviceManager.ts\`, \`utils/adaptation/\` | 跨设备兼容 |
| 添加工具函数 | \`utils/\`, \`lib/utils.ts\` | 通用工具 |
| 编写测试 | \`tests/\`, \`e2e/\` | 测试相关 |
| 修改配置 | \`src/config/\`, \`constants/\` | 配置管理 |
| 状态管理 | \`contexts/\`, \`providers/\`, \`hooks/\` | 应用状态 |
| 性能优化 | \`utils/performance/\`, \`core/\` | 性能相关 |

### 代码搜索提示

**搜索关键词建议**：
- \`GameInterface\` - 游戏主界面相关
- \`DeviceManager\` - 设备检测相关  
- \`useCanvas\` - 画布管理相关
- \`adaptation\` - 适配系统相关
- \`PuzzleCanvas\` - 画布组件相关
- \`GameContext\` - 全局状态相关`;
}

// 生成详细文件列表
function generateDetailedStructure(nodes, level = 0) {
  let result = '';
  const indent = '  '.repeat(level);
  
  for (const node of nodes) {
    const relativePath = path.relative('.', node.path);
    const description = CONFIG.descriptions[relativePath] || CONFIG.descriptions[node.name] || '';
    
    // 检查是否是关键文件
    const keyFile = CONFIG.keyFiles.find(kf => kf.path === relativePath);
    const importance = keyFile ? `${keyFile.importance} ` : '';
    
    const descText = description ? ` - ${description}` : '';
    
    if (node.type === 'directory') {
      result += `${indent}📁 **${node.name}/**${descText}\n`;
      if (node.children && node.children.length > 0) {
        result += generateDetailedStructure(node.children, level + 1);
      }
    } else {
      result += `${indent}📄 ${importance}\`${node.name}\`${descText}\n`;
    }
  }
  
  return result;
}

// 主函数
async function main() {
  try {
    console.log('🚀 开始生成项目结构文档...');
    
    // 加载 gitignore 规则
    const gitignorePatterns = await loadGitignorePatterns();
    console.log(`✅ 已加载 ${gitignorePatterns.length} 条 .gitignore 规则`);
    
    // 扫描目录
    const fileTree = await scanDirectory('.', CONFIG, 0, gitignorePatterns);
    console.log('✅ 目录扫描完成');
    
    // 计算统计信息
    const stats = calculateStats(fileTree);
    
    // 生成内容
    const generatedTime = new Date().toLocaleString('zh-CN');
    const directoryList = generateDirectoryList(fileTree);
    const detailedStructure = generateDetailedStructure(fileTree);
    
    const document = `# 项目结构（Project Structure）

> 自动生成时间：${generatedTime}  
> 生成工具：项目结构文档生成器 v3.1.0 - 开发导航版

**开发者导航工具** - 快速理解项目架构，精准定位代码位置，提升开发效率。

## 快速导航
[项目概览](#项目概览) | [架构概览](#架构概览) | [功能模块](#功能模块) | [技术栈](#技术栈) | [开发指引](#开发指引) | [目录索引](#目录索引)

---

## 项目概览

| 统计项 | 数量 | 说明 |
|--------|------|------|
| 总目录数 | ${stats.totalDirectories} | 项目目录结构层次 |
| 总文件数 | ${stats.totalFiles} | 代码文件和资源文件总数 |
| 项目容量 | ${stats.totalSize} | 不包含node_modules的项目大小 |

---

## 架构概览

${generateArchitectureOverview()}

---

## 功能模块

${generateFunctionalModules()}

---

## 技术栈

${generateTechStack()}

---

## 开发指引

${generateDevelopmentGuide()}

### 🎯 常见开发任务快速定位

| 开发任务 | 主要文件位置 | 说明 |
|----------|-------------|------|
| 🎮 修改游戏逻辑 | \`components/GameInterface.tsx\`, \`contexts/GameContext.tsx\` | 核心游戏功能 |
| 🎨 调整UI样式 | \`components/\`, \`app/globals.css\`, \`tailwind.config.ts\` | 界面和样式 |
| 📱 设备适配问题 | \`core/DeviceManager.ts\`, \`utils/adaptation/\` | 跨设备兼容 |
| 🔧 添加工具函数 | \`utils/\`, \`lib/utils.ts\` | 通用工具 |
| 🧪 编写测试 | \`tests/\`, \`e2e/\` | 测试相关 |
| ⚙️ 修改配置 | \`src/config/\`, \`constants/\` | 配置管理 |
| 🎯 状态管理 | \`contexts/\`, \`providers/\`, \`hooks/\` | 应用状态 |
| 📊 性能优化 | \`utils/performance/\`, \`core/\` | 性能相关 |

### 🔍 代码搜索提示

**搜索关键词建议**：
- \`GameInterface\` - 游戏主界面相关
- \`DeviceManager\` - 设备检测相关  
- \`useCanvas\` - 画布管理相关
- \`adaptation\` - 适配系统相关
- \`PuzzleCanvas\` - 画布组件相关
- \`GameContext\` - 全局状态相关

---

## 目录索引

<details>
<summary>点击展开完整目录树 (快速浏览项目结构)</summary>

\`\`\`
${directoryList.trim()}
\`\`\`

</details>

---

## 详细文件结构

<details>
<summary>点击展开详细文件列表 (包含文件描述)</summary>

${detailedStructure}

</details>

---

## 开发相关文档

| 文档类型 | 链接 | 用途 |
|----------|------|------|
| 📖 项目说明 | [README.md](/README.md) | 项目介绍和快速开始 |
| 📝 更新日志 | [CHANGELOG.md](/CHANGELOG.md) | 版本历史和变更记录 |
| 🔌 API文档 | [API_DOCUMENTATION.md](/docs/API_DOCUMENTATION.md) | 接口规范和使用指南 |
| ⚙️ 配置指南 | [configuration/](/docs/configuration/README.md) | 环境配置和部署指南 |

---

## 使用说明

### 图标含义
- 📁 目录 | 📄 文件 | 🔥 核心文件 | ⭐ 重要文件
- 🎨 表现层 | ⚡ 业务层 | 🔧 数据层 | ⚙️ 配置层

### 文档更新
\`\`\`bash
npm run generate-structure  # 一键更新项目结构文档
\`\`\`

### 自定义配置
编辑 \`scripts/generate-project-structure-clean.js\` 可配置：
- 架构分层定义
- 功能模块划分  
- 技术栈信息
- 关键文件标记

---

*📅 生成时间：${generatedTime} | 🔧 版本：v3.1.0 | 🎯 开发导航工具*
`;
    
    // 写入文件
    await fs.writeFile(CONFIG.output.path, document, 'utf8');
    
    console.log(`✅ 文档已生成：${CONFIG.output.path}`);
    console.log('\\n📊 生成统计：');
    console.log(`   文件总数：${stats.totalFiles}`);
    console.log(`   目录总数：${stats.totalDirectories}`);
    console.log(`   项目大小：${stats.totalSize}`);
    
  } catch (error) {
    console.error('❌ 生成失败：', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main, CONFIG };