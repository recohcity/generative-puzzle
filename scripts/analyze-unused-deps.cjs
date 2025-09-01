#!/usr/bin/env node

/**
 * 分析未使用的依赖项
 * 扫描项目中实际使用的依赖，与package.json中声明的依赖进行对比
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 颜色输出
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 读取package.json
function getPackageJson() {
  try {
    const packagePath = path.join(process.cwd(), 'package.json');
    return JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  } catch (error) {
    log(`❌ 无法读取package.json: ${error.message}`, 'red');
    process.exit(1);
  }
}

// 扫描项目文件中的import语句
function scanImports() {
  const usedDeps = new Set();
  
  // 扫描的文件扩展名
  const extensions = ['.ts', '.tsx', '.js', '.jsx', '.mjs'];
  
  // 需要扫描的目录
  const scanDirs = ['app', 'components', 'contexts', 'hooks', 'utils', 'types', 'src'];
  
  function scanDirectory(dir) {
    if (!fs.existsSync(dir)) return;
    
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        // 跳过node_modules等目录
        if (!['node_modules', '.next', '.git', 'dist', 'build'].includes(file)) {
          scanDirectory(filePath);
        }
      } else if (extensions.some(ext => file.endsWith(ext))) {
        scanFile(filePath, usedDeps);
      }
    }
  }
  
  function scanFile(filePath, usedDeps) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // 匹配import语句
      const importRegex = /(?:import|require)\s*\(?[^'"]*['"]([^'"]+)['"]/g;
      let match;
      
      while ((match = importRegex.exec(content)) !== null) {
        const importPath = match[1];
        
        // 只关心npm包，不关心相对路径
        if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
          // 提取包名（处理scoped packages）
          const packageName = importPath.startsWith('@') 
            ? importPath.split('/').slice(0, 2).join('/')
            : importPath.split('/')[0];
          
          usedDeps.add(packageName);
        }
      }
    } catch (error) {
      log(`⚠️  无法读取文件 ${filePath}: ${error.message}`, 'yellow');
    }
  }
  
  // 扫描所有目录
  scanDirs.forEach(scanDirectory);
  
  return usedDeps;
}

// 分析依赖类型和误报原因
function categorizeDependencies(allDeps, usedDeps) {
  const categories = {
    // 框架核心依赖（Next.js/React生态）
    framework: ['react', 'react-dom', 'next'],
    
    // 构建工具
    buildTools: ['typescript', 'eslint', 'postcss', 'tailwindcss', 'autoprefixer', 'webpack-bundle-analyzer'],
    
    // 测试工具
    testing: ['jest', 'playwright', '@playwright/test', '@testing-library/jest-dom', '@testing-library/react', '@testing-library/user-event', 'jest-environment-jsdom', 'jsdom', 'ts-jest', 'identity-obj-proxy'],
    
    // TypeScript类型定义
    types: Object.keys(allDeps).filter(dep => dep.startsWith('@types/')),
    
    // ESLint相关
    linting: ['eslint-config-next', '@typescript-eslint/eslint-plugin', '@typescript-eslint/parser'],
    
    // CSS工具
    cssUtils: ['clsx', 'tailwind-merge', 'tailwindcss-animate', 'class-variance-authority'],
    
    // 开发工具
    devTools: ['tsx', 'fs-extra'],
    
    // Radix UI组件
    radixUI: Object.keys(allDeps).filter(dep => dep.startsWith('@radix-ui/')),
    
    // 可能真正未使用的
    potentiallyUnused: []
  };
  
  // 分类所有依赖
  const categorized = {};
  const uncategorized = [];
  
  Object.keys(allDeps).forEach(dep => {
    let found = false;
    for (const [category, deps] of Object.entries(categories)) {
      if (deps.includes(dep)) {
        if (!categorized[category]) categorized[category] = [];
        categorized[category].push({
          name: dep,
          used: usedDeps.has(dep),
          reason: getUnusedReason(dep, category)
        });
        found = true;
        break;
      }
    }
    if (!found) {
      uncategorized.push({
        name: dep,
        used: usedDeps.has(dep),
        reason: usedDeps.has(dep) ? null : 'Unknown - needs manual review'
      });
    }
  });
  
  return { categorized, uncategorized };
}

// 解释为什么某个依赖看起来"未使用"
function getUnusedReason(dep, category) {
  const reasons = {
    framework: 'Next.js框架自动使用，无需显式import',
    buildTools: '构建工具，在配置文件中使用',
    testing: '测试框架，在测试配置中使用',
    types: 'TypeScript类型定义，编译时使用',
    linting: 'ESLint配置，在.eslintrc中使用',
    cssUtils: 'CSS工具，可能在Tailwind配置中使用',
    devTools: '开发工具，在脚本中使用',
    radixUI: 'UI组件，通过Shadcn UI间接使用'
  };
  
  return reasons[category] || '需要手动检查';
}

// 分析Radix UI依赖使用情况
function analyzeRadixUsage(usedDeps, allDeps) {
  const radixDeps = Object.keys(allDeps).filter(dep => dep.startsWith('@radix-ui/'));
  const usedRadixDeps = [...usedDeps].filter(dep => dep.startsWith('@radix-ui/'));
  const unusedRadixDeps = radixDeps.filter(dep => !usedRadixDeps.includes(dep));
  
  return {
    total: radixDeps.length,
    used: usedRadixDeps.length,
    unused: unusedRadixDeps.length,
    unusedList: unusedRadixDeps
  };
}

/**
 * 生成依赖分析报告文档
 */
function generateDependencyReport(analysisData) {
  const { 
    packageJson, 
    dependencies, 
    usedDeps, 
    unusedDeps, 
    categorized, 
    uncategorized, 
    radixAnalysis,
    realUnusedCount,
    realUsageRate
  } = analysisData;
  
  const currentDate = new Date().toISOString().split('T')[0];
  const totalDeps = Object.keys(dependencies).length;
  
  const reportContent = `# 📦 项目依赖分析报告

**生成时间**: ${currentDate}  
**项目版本**: ${packageJson.version}  
**分析工具**: analyze-unused-deps.cjs

## 📊 依赖使用情况总览

| 指标 | 数值 | 等级 | 状态 |
|------|------|------|------|
| **总依赖数量** | ${totalDeps}个 | - | 📦 统计 |
| **检测使用依赖** | ${usedDeps.size}个 | - | ✅ 扫描 |
| **真实使用率** | ${realUsageRate}% | ${realUsageRate > 95 ? 'A+' : realUsageRate > 85 ? 'A' : 'B+'} | ${realUsageRate > 95 ? '🏆 优秀' : realUsageRate > 85 ? '✅ 良好' : '⚠️ 待优化'} |
| **可能冗余** | ${realUnusedCount}个 | ${realUnusedCount === 0 ? 'A+' : realUnusedCount <= 3 ? 'A' : 'B+'} | ${realUnusedCount === 0 ? '🎉 完美' : realUnusedCount <= 3 ? '✅ 优秀' : '⚠️ 需优化'} |

## 🎨 Radix UI 组件分析

| 指标 | 数值 | 状态 |
|------|------|------|
| **总组件数** | ${radixAnalysis.total}个 | 📊 统计 |
| **使用组件** | ${radixAnalysis.used}个 | ✅ 活跃 |
| **未使用组件** | ${radixAnalysis.unused}个 | ${radixAnalysis.unused === 0 ? '🎉 完美' : '⚠️ 冗余'} |
| **使用率** | ${((radixAnalysis.used / radixAnalysis.total) * 100).toFixed(1)}% | ${radixAnalysis.unused === 0 ? '🏆 100%' : '📈 优化中'} |

${radixAnalysis.unusedList.length > 0 ? `
### ❌ 未使用的 Radix UI 组件

${radixAnalysis.unusedList.map(dep => `- \`${dep}\``).join('\n')}

**清理命令**:
\`\`\`bash
npm uninstall ${radixAnalysis.unusedList.join(' ')}
\`\`\`

**预计节省**: ~${radixAnalysis.unusedList.length * 50}KB
` : `
### ✅ Radix UI 组件使用完美

所有 ${radixAnalysis.total} 个 Radix UI 组件都在项目中被使用，没有冗余依赖。
`}

## 🔍 依赖分类分析

### 📋 分类统计

| 分类 | 总数 | 使用中 | 未使用 | 状态 |
|------|------|--------|--------|------|
| 🚀 框架核心 | ${categorized.framework?.length || 0} | ${categorized.framework?.filter(d => d.used).length || 0} | ${categorized.framework?.filter(d => !d.used).length || 0} | ${categorized.framework?.filter(d => !d.used).length === 0 ? '✅' : '⚠️'} |
| 🔧 构建工具 | ${categorized.buildTools?.length || 0} | ${categorized.buildTools?.filter(d => d.used).length || 0} | ${categorized.buildTools?.filter(d => !d.used).length || 0} | ${categorized.buildTools?.filter(d => !d.used).length === 0 ? '✅' : '⚠️'} |
| 🧪 测试工具 | ${categorized.testing?.length || 0} | ${categorized.testing?.filter(d => d.used).length || 0} | ${categorized.testing?.filter(d => !d.used).length || 0} | ${categorized.testing?.filter(d => !d.used).length === 0 ? '✅' : '⚠️'} |
| 📝 类型定义 | ${categorized.types?.length || 0} | ${categorized.types?.filter(d => d.used).length || 0} | ${categorized.types?.filter(d => !d.used).length || 0} | ${categorized.types?.filter(d => !d.used).length === 0 ? '✅' : '⚠️'} |
| 🔍 代码检查 | ${categorized.linting?.length || 0} | ${categorized.linting?.filter(d => d.used).length || 0} | ${categorized.linting?.filter(d => !d.used).length || 0} | ${categorized.linting?.filter(d => !d.used).length === 0 ? '✅' : '⚠️'} |
| 🎨 CSS工具 | ${categorized.cssUtils?.length || 0} | ${categorized.cssUtils?.filter(d => d.used).length || 0} | ${categorized.cssUtils?.filter(d => !d.used).length || 0} | ${categorized.cssUtils?.filter(d => !d.used).length === 0 ? '✅' : '⚠️'} |
| ⚙️ 开发工具 | ${categorized.devTools?.length || 0} | ${categorized.devTools?.filter(d => d.used).length || 0} | ${categorized.devTools?.filter(d => !d.used).length || 0} | ${categorized.devTools?.filter(d => !d.used).length === 0 ? '✅' : '⚠️'} |
| 🎭 UI组件 | ${categorized.radixUI?.length || 0} | ${categorized.radixUI?.filter(d => d.used).length || 0} | ${categorized.radixUI?.filter(d => !d.used).length || 0} | ${categorized.radixUI?.filter(d => !d.used).length === 0 ? '✅' : '⚠️'} |

### 🔍 详细分析

${Object.entries(categorized).map(([category, deps]) => {
  const categoryNames = {
    framework: '🚀 框架核心依赖',
    buildTools: '🔧 构建工具依赖', 
    testing: '🧪 测试工具依赖',
    types: '📝 TypeScript类型定义',
    linting: '🔍 代码检查工具',
    cssUtils: '🎨 CSS工具依赖',
    devTools: '⚙️ 开发工具依赖',
    radixUI: '🎭 Radix UI组件'
  };
  
  const unusedInCategory = deps.filter(d => !d.used);
  if (unusedInCategory.length === 0) {
    return `#### ${categoryNames[category] || category}
✅ **状态**: 所有依赖都在使用中
📊 **统计**: ${deps.length}个依赖，100%使用率`;
  }
  
  return `#### ${categoryNames[category] || category}
${unusedInCategory.length > 0 ? `⚠️ **状态**: ${unusedInCategory.length}个依赖未直接检测到使用` : '✅ **状态**: 所有依赖都在使用中'}
📊 **统计**: ${deps.length}个依赖，${((deps.filter(d => d.used).length / deps.length) * 100).toFixed(1)}%使用率

${unusedInCategory.length > 0 ? `**未使用依赖**:
${unusedInCategory.map(dep => `- \`${dep.name}\` - ${dep.reason}`).join('\n')}` : ''}`;
}).join('\n\n')}

${uncategorized.filter(d => !d.used).length > 0 ? `
#### ❓ 未分类依赖

⚠️ **状态**: ${uncategorized.filter(d => !d.used).length}个依赖需要手动检查

**需要检查的依赖**:
${uncategorized.filter(d => !d.used).map(dep => `- \`${dep.name}\` - ${dep.reason}`).join('\n')}
` : ''}

## 💡 优化建议

### 🎯 当前状态评估

${realUnusedCount === 0 ? `
🏆 **优秀！** 项目依赖管理达到A+级别！

- ✅ 所有依赖都是必需的，没有真正的冗余
- ✅ 依赖使用率达到 ${realUsageRate}%
- ✅ 项目依赖结构清晰合理
` : realUnusedCount <= 3 ? `
✅ **良好！** 项目依赖管理优秀

- ✅ 依赖使用率达到 ${realUsageRate}%
- ⚠️ 仅有 ${realUnusedCount} 个可能的冗余依赖
- 💡 建议进行少量优化
` : `
⚠️ **待优化** 项目依赖需要清理

- 📊 依赖使用率 ${realUsageRate}%
- ⚠️ 发现 ${realUnusedCount} 个可能未使用的依赖
- 🔧 建议进行依赖清理优化
`}

### 📋 清理步骤

${realUnusedCount > 0 ? `
1. **手动检查**: 搜索项目中是否有配置文件使用这些依赖
2. **脚本检查**: 检查package.json的scripts是否使用
3. **测试验证**: 在测试环境中验证清理后的功能
4. **安全移除**: 确认后可以安全移除冗余依赖
` : `
✅ 当前无需进行依赖清理，项目依赖管理已达到最优状态。
`}

### ⚠️ 注意事项

- 📊 此分析基于静态代码扫描，可能存在误报
- 🔧 某些依赖可能被间接使用或在配置文件中使用  
- 🧪 清理前请确认依赖确实未被使用
- ✅ 建议在测试环境中验证清理后的功能

## 📈 历史对比

*注：首次生成报告，暂无历史对比数据*

---

**报告生成**: ${new Date().toLocaleString('zh-CN')}  
**下次建议检查**: ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('zh-CN')}  
**工具版本**: analyze-unused-deps.cjs v1.0`;

  return reportContent;
}

// 主函数
function main() {
  log('🔍 开始分析项目依赖使用情况...', 'cyan');
  
  const packageJson = getPackageJson();
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  log(`📦 总依赖数量: ${Object.keys(dependencies).length}`, 'blue');
  
  const usedDeps = scanImports();
  log(`✅ 检测到使用的依赖: ${usedDeps.size}`, 'green');
  
  // 找出未使用的依赖
  const unusedDeps = Object.keys(dependencies).filter(dep => !usedDeps.has(dep));
  
  // 分析依赖分类
  const { categorized, uncategorized } = categorizeDependencies(dependencies, usedDeps);
  
  // 分析Radix UI使用情况
  const radixAnalysis = analyzeRadixUsage(usedDeps, dependencies);
  
  log('\n📊 智能依赖分析结果:', 'bold');
  log('=' .repeat(60), 'cyan');
  
  // Radix UI 分析
  log(`\n🎨 Radix UI 组件分析:`, 'magenta');
  log(`   总数: ${radixAnalysis.total}`, 'blue');
  log(`   使用: ${radixAnalysis.used}`, 'green');
  log(`   未使用: ${radixAnalysis.unused}`, radixAnalysis.unused > 0 ? 'yellow' : 'green');
  
  if (radixAnalysis.unusedList.length > 0) {
    log(`\n❌ 未使用的 Radix UI 组件:`, 'yellow');
    radixAnalysis.unusedList.forEach(dep => {
      log(`   - ${dep}`, 'yellow');
    });
  } else {
    log(`   ✅ 所有Radix UI组件都在使用中！`, 'green');
  }
  
  // 按类别分析"未使用"依赖
  log(`\n🔍 "未使用"依赖分类分析:`, 'cyan');
  
  const categoryNames = {
    framework: '🚀 框架核心',
    buildTools: '🔧 构建工具', 
    testing: '🧪 测试工具',
    types: '📝 类型定义',
    linting: '🔍 代码检查',
    cssUtils: '🎨 CSS工具',
    devTools: '⚙️  开发工具',
    radixUI: '🎭 UI组件'
  };
  
  let realUnusedCount = 0;
  
  Object.entries(categorized).forEach(([category, deps]) => {
    const unusedInCategory = deps.filter(d => !d.used);
    if (unusedInCategory.length > 0) {
      log(`\n${categoryNames[category] || category} (${unusedInCategory.length}个):`, 'blue');
      unusedInCategory.forEach(dep => {
        if (category === 'framework' || category === 'buildTools' || category === 'testing' || category === 'types' || category === 'linting') {
          log(`   ✅ ${dep.name} - ${dep.reason}`, 'green');
        } else {
          log(`   ⚠️  ${dep.name} - ${dep.reason}`, 'yellow');
          realUnusedCount++;
        }
      });
    }
  });
  
  // 未分类的依赖
  const unusedUncategorized = uncategorized.filter(d => !d.used);
  if (unusedUncategorized.length > 0) {
    log(`\n❓ 未分类依赖 (${unusedUncategorized.length}个):`, 'yellow');
    unusedUncategorized.forEach(dep => {
      log(`   🔍 ${dep.name} - ${dep.reason}`, 'yellow');
      realUnusedCount++;
    });
  }
  
  // 生成智能清理建议
  log('\n💡 智能清理建议:', 'cyan');
  
  if (realUnusedCount === 0) {
    log('\n🎉 优秀！没有发现真正未使用的依赖！', 'green');
    log('   所有"未使用"的依赖都是必需的工具链组件', 'green');
  } else {
    log(`\n⚠️  发现 ${realUnusedCount} 个可能真正未使用的依赖`, 'yellow');
    
    // 只显示真正可能未使用的依赖
    const reallyUnused = [];
    
    // 收集可能真正未使用的依赖
    Object.entries(categorized).forEach(([category, deps]) => {
      if (!['framework', 'buildTools', 'testing', 'types', 'linting'].includes(category)) {
        deps.filter(d => !d.used).forEach(dep => reallyUnused.push(dep.name));
      }
    });
    
    unusedUncategorized.forEach(dep => reallyUnused.push(dep.name));
    
    if (reallyUnused.length > 0) {
      log('\n🔍 需要手动检查的依赖:', 'yellow');
      reallyUnused.forEach(dep => {
        log(`   - ${dep}`, 'yellow');
      });
      
      log('\n📋 检查步骤:', 'cyan');
      log('   1. 搜索项目中是否有配置文件使用这些依赖', 'blue');
      log('   2. 检查package.json的scripts是否使用', 'blue');
      log('   3. 确认后可以安全移除', 'blue');
    }
  }
  
  if (radixAnalysis.unusedList.length > 0) {
    log('\n🎨 Radix UI 组件清理命令:', 'magenta');
    const radixUninstallCmd = `npm uninstall ${radixAnalysis.unusedList.join(' ')}`;
    log(`   ${radixUninstallCmd}`, 'yellow');
    
    // 计算可节省的空间（估算）
    const estimatedSavings = radixAnalysis.unusedList.length * 50; // 每个包约50KB
    log(`   预计节省: ~${estimatedSavings}KB`, 'green');
  }
  
  // 重新计算真实使用率
  const totalDeps = Object.keys(dependencies).length;
  const necessaryDeps = totalDeps - realUnusedCount;
  const realUsageRate = ((necessaryDeps) / totalDeps * 100).toFixed(1);
  
  log('\n📈 真实依赖使用率统计:', 'bold');
  log(`   实际使用率: ${realUsageRate}%`, realUsageRate > 95 ? 'green' : realUsageRate > 85 ? 'yellow' : 'red');
  log(`   必需依赖: ${necessaryDeps}/${totalDeps}`, 'green');
  log(`   可能冗余: ${realUnusedCount}`, realUnusedCount === 0 ? 'green' : 'yellow');
  
  if (realUnusedCount === 0) {
    log('\n🏆 项目依赖管理达到A+级别！', 'green');
    log('   所有依赖都是必需的，没有冗余', 'green');
  } else if (realUnusedCount <= 3) {
    log('\n✅ 项目依赖管理优秀，只有极少量可能的冗余', 'green');
  } else {
    log('\n⚠️  建议检查并清理可能未使用的依赖', 'yellow');
  }
  
  log('\n📝 注意事项:', 'cyan');
  log('   - 此分析基于静态代码扫描，可能存在误报', 'yellow');
  log('   - 某些依赖可能被间接使用或在配置文件中使用', 'yellow');
  log('   - 清理前请确认依赖确实未被使用', 'yellow');
  log('   - 建议在测试环境中验证清理后的功能', 'yellow');
  
  // 生成依赖分析报告
  try {
    log('\n📝 生成依赖分析报告...', 'cyan');
    
    const analysisData = {
      packageJson,
      dependencies,
      usedDeps,
      unusedDeps,
      categorized,
      uncategorized,
      radixAnalysis,
      realUnusedCount,
      realUsageRate
    };
    
    const reportContent = generateDependencyReport(analysisData);
    const reportPath = path.join(process.cwd(), 'docs', 'dependency-analysis-report.md');
    
    fs.writeFileSync(reportPath, reportContent, 'utf8');
    
    log(`✅ 依赖分析报告已生成: ${reportPath}`, 'green');
    log('💡 报告包含详细的依赖使用情况和优化建议', 'cyan');
    
  } catch (error) {
    log(`❌ 生成报告失败: ${error.message}`, 'red');
  }
}

if (require.main === module) {
  main();
}

module.exports = { 
  scanImports, 
  analyzeRadixUsage, 
  categorizeDependencies,
  generateDependencyReport,
  getPackageJson
};