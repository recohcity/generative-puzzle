#!/usr/bin/env node

/**
 * API变更扫描工具
 * 扫描项目中的API变更，辅助手动维护API文档
 */

const fs = require('fs').promises;
const path = require('path');
const glob = require('glob');

// 配置
const CONFIG = {
  // 扫描路径
  scanPaths: [
    'src/config/**/*.ts',
    'core/**/*.ts',
    'providers/**/*.ts',
    'hooks/**/*.ts',
    'utils/**/*.ts',
    'app/api/**/*.ts'
  ],

  // 忽略模式
  ignore: [
    '**/*.test.*',
    '**/*.spec.*',
    '**/temp/**',
    '**/*.d.ts'
  ],

  // API分类
  categories: {
    '配置管理API': {
      paths: ['src/config/'],
      keywords: ['CONFIG', 'THRESHOLDS', 'SETTINGS']
    },
    '核心管理器API': {
      paths: ['core/'],
      keywords: ['Manager', 'Service']
    },
    'React Hooks API': {
      paths: ['hooks/', 'providers/hooks/'],
      keywords: ['use', 'Hook']
    },
    '工具函数API': {
      paths: ['utils/'],
      keywords: ['function', 'calculate', 'adapt', 'generate']
    },
    'Next.js API路由': {
      paths: ['app/api/'],
      keywords: ['GET', 'POST', 'route']
    }
  },

  // 当前API文档路径
  apiDocPath: 'docs/API_DOCUMENTATION.md'
};

class APIScanner {
  constructor() {
    this.currentAPIs = new Map();
    this.documentedAPIs = new Set();
  }

  async scan() {
    console.log('🔍 开始扫描API变更...');

    // 1. 扫描当前代码中的API
    await this.scanCodeAPIs();
    console.log(`✅ 发现 ${this.currentAPIs.size} 个API`);

    // 2. 解析现有文档中的API
    await this.parseDocumentedAPIs();
    console.log(`📚 文档中已记录 ${this.documentedAPIs.size} 个API`);

    // 3. 对比分析
    const analysis = this.analyzeChanges();

    // 4. 生成报告
    this.generateReport(analysis);

    return analysis;
  }

  async scanCodeAPIs() {
    const files = [];

    // 收集所有文件
    for (const pattern of CONFIG.scanPaths) {
      const matchedFiles = glob.sync(pattern, {
        ignore: CONFIG.ignore
      });
      files.push(...matchedFiles);
    }

    // 扫描每个文件
    for (const filePath of files) {
      try {
        const content = await fs.readFile(filePath, 'utf8');
        const apis = this.extractAPIsFromFile(content, filePath);

        for (const api of apis) {
          this.currentAPIs.set(api.name, api);
        }
      } catch (error) {
        console.warn(`⚠️ 读取文件失败: ${filePath}`, error.message);
      }
    }
  }

  extractAPIsFromFile(content, filePath) {
    const apis = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // 匹配导出的函数
      const functionMatch = line.match(/^export\s+(function|const|let)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/);
      if (functionMatch) {
        apis.push({
          name: functionMatch[2],
          type: 'function',
          filePath,
          lineNumber: i + 1,
          signature: this.extractSignature(lines, i),
          category: this.determineCategory(filePath)
        });
      }

      // 匹配导出的类
      const classMatch = line.match(/^export\s+class\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/);
      if (classMatch) {
        apis.push({
          name: classMatch[1],
          type: 'class',
          filePath,
          lineNumber: i + 1,
          signature: line,
          category: this.determineCategory(filePath)
        });
      }

      // 匹配导出的接口
      const interfaceMatch = line.match(/^export\s+interface\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/);
      if (interfaceMatch) {
        apis.push({
          name: interfaceMatch[1],
          type: 'interface',
          filePath,
          lineNumber: i + 1,
          signature: line,
          category: this.determineCategory(filePath)
        });
      }

      // 匹配导出的类型
      const typeMatch = line.match(/^export\s+type\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/);
      if (typeMatch) {
        apis.push({
          name: typeMatch[1],
          type: 'type',
          filePath,
          lineNumber: i + 1,
          signature: line,
          category: this.determineCategory(filePath)
        });
      }

      // 匹配导出的常量
      const constMatch = line.match(/^export\s+const\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/);
      if (constMatch) {
        apis.push({
          name: constMatch[1],
          type: 'constant',
          filePath,
          lineNumber: i + 1,
          signature: line,
          category: this.determineCategory(filePath)
        });
      }
    }

    return apis;
  }

  extractSignature(lines, startIndex) {
    let signature = lines[startIndex].trim();

    // 如果行末没有分号或大括号，继续读取下一行
    if (!signature.endsWith(';') && !signature.endsWith('{') && !signature.includes('=>')) {
      for (let i = startIndex + 1; i < Math.min(startIndex + 5, lines.length); i++) {
        const nextLine = lines[i].trim();
        signature += ' ' + nextLine;
        if (nextLine.endsWith(';') || nextLine.endsWith('{') || nextLine.includes('=>')) {
          break;
        }
      }
    }

    return signature;
  }

  determineCategory(filePath) {
    for (const [categoryName, config] of Object.entries(CONFIG.categories)) {
      for (const pathPattern of config.paths) {
        if (filePath.includes(pathPattern)) {
          return categoryName;
        }
      }
    }
    return '其他API';
  }

  async parseDocumentedAPIs() {
    try {
      const docContent = await fs.readFile(CONFIG.apiDocPath, 'utf8');
      const lines = docContent.split('\n');

      for (const line of lines) {
        // 匹配文档中的API标题 (### APIName)
        const apiMatch = line.match(/^###\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/);
        if (apiMatch) {
          this.documentedAPIs.add(apiMatch[1]);
        }

        // 匹配代码块中的API名称
        const codeMatch = line.match(/`([a-zA-Z_$][a-zA-Z0-9_$]*)`/g);
        if (codeMatch) {
          for (const match of codeMatch) {
            const apiName = match.slice(1, -1); // 去掉反引号
            if (this.currentAPIs.has(apiName)) {
              this.documentedAPIs.add(apiName);
            }
          }
        }
      }
    } catch (error) {
      console.warn('⚠️ 读取API文档失败:', error.message);
    }
  }

  analyzeChanges() {
    const newAPIs = [];
    const missingAPIs = [];
    const categorizedAPIs = {};

    // 分析新增API
    for (const [name, api] of this.currentAPIs) {
      if (!this.documentedAPIs.has(name)) {
        newAPIs.push(api);
      }

      // 按分类组织
      if (!categorizedAPIs[api.category]) {
        categorizedAPIs[api.category] = [];
      }
      categorizedAPIs[api.category].push(api);
    }

    // 分析可能缺失的API（在文档中但代码中找不到）
    for (const docAPI of this.documentedAPIs) {
      if (!this.currentAPIs.has(docAPI)) {
        missingAPIs.push(docAPI);
      }
    }

    return {
      total: this.currentAPIs.size,
      documented: this.documentedAPIs.size,
      newAPIs,
      missingAPIs,
      categorizedAPIs,
      coverage: ((this.documentedAPIs.size / this.currentAPIs.size) * 100).toFixed(1)
    };
  }

  generateReport(analysis) {
    console.log('\n📊 API扫描报告');
    console.log('='.repeat(50));

    console.log(`\n📈 总体统计:`);
    console.log(`   API总数: ${analysis.total}`);
    console.log(`   已文档化: ${analysis.documented}`);
    console.log(`   文档覆盖率: ${analysis.coverage}%`);

    if (analysis.newAPIs.length > 0) {
      console.log(`\n🆕 新增API (${analysis.newAPIs.length}个):`);
      for (const api of analysis.newAPIs) {
        console.log(`   ✨ ${api.name} (${api.type}) - ${api.category}`);
        console.log(`      📁 ${api.filePath}:${api.lineNumber}`);
        console.log(`      📝 ${api.signature}`);
      }
    }

    if (analysis.missingAPIs.length > 0) {
      console.log(`\n❓ 可能已删除的API (${analysis.missingAPIs.length}个):`);
      for (const api of analysis.missingAPIs) {
        console.log(`   🗑️ ${api}`);
      }
    }

    console.log(`\n📂 按分类统计:`);
    for (const [category, apis] of Object.entries(analysis.categorizedAPIs)) {
      console.log(`   ${category}: ${apis.length}个API`);
    }

    if (analysis.newAPIs.length > 0) {
      console.log(`\n💡 建议操作:`);
      console.log(`   1. 检查新增API是否需要添加到文档`);
      console.log(`   2. 为新API编写描述和使用示例`);
      console.log(`   3. 更新快捷导航和分类索引`);
      console.log(`   4. 运行 npm run generate-structure 更新项目结构`);
    }

    // 生成详细报告文件
    this.saveDetailedReport(analysis);
  }

  async saveDetailedReport(analysis) {
    const reportPath = 'docs/reports/api-scan-report.md';
    const timestamp = new Date().toLocaleString('zh-CN');

    let report = `# API扫描报告\n\n`;
    report += `> 生成时间: ${timestamp}\n`;
    report += `> 扫描工具: API变更扫描器 v1.0\n\n`;

    report += `## 📊 统计概览\n\n`;
    report += `| 项目 | 数量 | 说明 |\n`;
    report += `|------|------|------|\n`;
    report += `| API总数 | ${analysis.total} | 项目中所有导出的API |\n`;
    report += `| 已文档化 | ${analysis.documented} | 在API文档中已记录的API |\n`;
    report += `| 文档覆盖率 | ${analysis.coverage}% | 文档化程度 |\n`;
    report += `| 新增API | ${analysis.newAPIs.length} | 需要添加到文档的API |\n`;
    report += `| 可能删除 | ${analysis.missingAPIs.length} | 文档中存在但代码中找不到 |\n\n`;

    if (analysis.newAPIs.length > 0) {
      report += `## 🆕 新增API详情\n\n`;

      const groupedNew = {};
      for (const api of analysis.newAPIs) {
        if (!groupedNew[api.category]) {
          groupedNew[api.category] = [];
        }
        groupedNew[api.category].push(api);
      }

      for (const [category, apis] of Object.entries(groupedNew)) {
        report += `### ${category}\n\n`;
        for (const api of apis) {
          report += `#### ${api.name}\n\n`;
          report += `- **类型**: ${api.type}\n`;
          report += `- **文件**: \`${api.filePath}:${api.lineNumber}\`\n`;
          report += `- **签名**: \`${api.signature}\`\n\n`;
          report += `**建议文档结构**:\n`;
          report += `\`\`\`markdown\n`;
          report += `### ${api.name}\n\n`;
          report += `[添加API描述]\n\n`;
          report += `\`\`\`typescript\n`;
          report += `${api.signature}\n`;
          report += `\`\`\`\n\n`;
          report += `#### 使用示例\n\n`;
          report += `\`\`\`typescript\n`;
          report += `// [添加使用示例]\n`;
          report += `\`\`\`\n`;
          report += `\`\`\`\n\n`;
        }
      }
    }

    report += `## 📂 分类统计\n\n`;
    for (const [category, apis] of Object.entries(analysis.categorizedAPIs)) {
      report += `### ${category} (${apis.length}个)\n\n`;
      for (const api of apis) {
        const status = this.documentedAPIs.has(api.name) ? '✅' : '❌';
        report += `- ${status} \`${api.name}\` (${api.type})\n`;
      }
      report += `\n`;
    }

    await fs.writeFile(reportPath, report, 'utf8');
    console.log(`\n📄 详细报告已保存到: ${reportPath}`);
  }
}

// 主函数
async function main() {
  try {
    const scanner = new APIScanner();
    await scanner.scan();
  } catch (error) {
    console.error('❌ 扫描失败:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { APIScanner };