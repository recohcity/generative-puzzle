#!/usr/bin/env node

/**
 * API分类工具
 * 将扫描到的API按优先级分类，指导文档化策略
 */

const fs = require('fs').promises;

// API优先级分类规则
const API_CLASSIFICATION = {
  // 优先级1: 公开API (必须文档化)
  PUBLIC: {
    priority: 1,
    description: '对外暴露的核心功能API',
    patterns: [
      // 配置管理 - 公开配置
      /^(UNIFIED_CONFIG|DEVICE_THRESHOLDS|MOBILE_ADAPTATION|DESKTOP_ADAPTATION)$/,
      // 核心管理器 - 主要服务
      /^(DeviceManager|CanvasManager|EventManager)$/,
      // React Hooks - 公开Hook
      /^(useDevice|useCanvas|useAdaptation|usePuzzleInteractions)$/,
      // 工具函数 - 核心算法
      /^(isPointInPolygon|rotatePoint|calculateAngle|adaptPuzzlePiecesToShape)$/,
      // API路由
      /route\.ts$/
    ],
    keywords: ['public', 'main', 'core', 'primary']
  },

  // 优先级2: 团队API (建议文档化)
  TEAM: {
    priority: 2,
    description: '团队内部共享的工具和服务',
    patterns: [
      // 配置管理 - 详细配置
      /^(PERFORMANCE_THRESHOLDS|ERROR_HANDLING|LOGGING_CONFIG)$/,
      // 服务类
      /Service$/,
      // 专用Hook
      /^use[A-Z][a-zA-Z]*$/,
      // 工具类
      /^[A-Z][a-zA-Z]*Utils?$/,
      // 适配引擎
      /Engine$/,
      /Manager$/
    ],
    keywords: ['service', 'util', 'helper', 'adapter']
  },

  // 优先级3: 内部API (选择性文档化)
  INTERNAL: {
    priority: 3,
    description: '模块内部实现细节',
    patterns: [
      // 内部常量
      /^[A-Z_]+$/,
      // 内部接口
      /^[A-Z][a-zA-Z]*Config$/,
      /^[A-Z][a-zA-Z]*Options$/,
      // 工具函数
      /^[a-z][a-zA-Z]*$/,
      // Logger实例
      /Logger$/
    ],
    keywords: ['internal', 'private', 'helper', 'config']
  }
};

class APIClassifier {
  constructor() {
    this.apis = new Map();
    this.classified = {
      PUBLIC: [],
      TEAM: [],
      INTERNAL: []
    };
  }

  async loadAPIs() {
    // 从扫描报告中加载API列表
    const reportPath = 'docs/reports/api-scan-report.md';
    const content = await fs.readFile(reportPath, 'utf8');

    // 解析API信息
    const apiMatches = content.match(/#### ([a-zA-Z_$][a-zA-Z0-9_$]*)/g);
    if (apiMatches) {
      for (const match of apiMatches) {
        const apiName = match.replace('#### ', '');
        this.apis.set(apiName, { name: apiName });
      }
    }

    console.log(`📊 加载了 ${this.apis.size} 个API`);
  }

  classifyAPIs() {
    for (const [name, api] of this.apis) {
      let classified = false;

      // 按优先级顺序分类
      for (const [category, config] of Object.entries(API_CLASSIFICATION)) {
        if (this.matchesCategory(name, config)) {
          this.classified[category].push({ ...api, category });
          classified = true;
          break;
        }
      }

      // 默认分类为内部API
      if (!classified) {
        this.classified.INTERNAL.push({ ...api, category: 'INTERNAL' });
      }
    }
  }

  matchesCategory(apiName, config) {
    // 检查模式匹配
    for (const pattern of config.patterns) {
      if (pattern.test(apiName)) {
        return true;
      }
    }

    // 检查关键词匹配
    const lowerName = apiName.toLowerCase();
    for (const keyword of config.keywords) {
      if (lowerName.includes(keyword)) {
        return true;
      }
    }

    return false;
  }

  generateReport() {
    console.log('\n📋 API分类报告');
    console.log('='.repeat(60));

    for (const [category, apis] of Object.entries(this.classified)) {
      const config = API_CLASSIFICATION[category];
      const percentage = ((apis.length / this.apis.size) * 100).toFixed(1);

      console.log(`\n🎯 ${category} (优先级${config.priority}) - ${apis.length}个 (${percentage}%)`);
      console.log(`   ${config.description}`);

      if (apis.length > 0) {
        console.log('   API列表:');
        for (const api of apis.slice(0, 10)) { // 只显示前10个
          console.log(`     · ${api.name}`);
        }
        if (apis.length > 10) {
          console.log(`     ... 还有 ${apis.length - 10} 个API`);
        }
      }
    }

    this.generateRecommendations();
  }

  generateRecommendations() {
    const publicCount = this.classified.PUBLIC.length;
    const teamCount = this.classified.TEAM.length;
    const internalCount = this.classified.INTERNAL.length;

    console.log('\n💡 文档化建议');
    console.log('='.repeat(60));

    console.log(`\n📈 推荐文档化策略:`);
    console.log(`   1. 立即文档化: ${publicCount}个公开API (必须)`);
    console.log(`   2. 逐步文档化: ${teamCount}个团队API (建议)`);
    console.log(`   3. 选择性文档化: ${internalCount}个内部API (可选)`);

    const targetCoverage = ((publicCount + teamCount) / this.apis.size * 100).toFixed(1);
    console.log(`\n🎯 目标文档覆盖率: ${targetCoverage}% (行业标准)`);

    console.log(`\n🚀 实施计划:`);
    console.log(`   阶段1: 文档化${publicCount}个公开API → 覆盖率${(publicCount / this.apis.size * 100).toFixed(1)}%`);
    console.log(`   阶段2: 文档化${teamCount}个团队API → 覆盖率${targetCoverage}%`);
    console.log(`   阶段3: 根据需要文档化内部API`);
  }

  async saveClassificationReport() {
    const reportPath = 'docs/reports/api-classification-report.md';
    let report = `# API分类报告\n\n`;
    report += `> 生成时间: ${new Date().toLocaleString('zh-CN')}\n`;
    report += `> 分类工具: API分类器 v1.0\n\n`;

    report += `## 📊 分类统计\n\n`;
    report += `| 分类 | 数量 | 占比 | 优先级 | 建议 |\n`;
    report += `|------|------|------|--------|------|\n`;

    for (const [category, apis] of Object.entries(this.classified)) {
      const config = API_CLASSIFICATION[category];
      const percentage = ((apis.length / this.apis.size) * 100).toFixed(1);
      const action = category === 'PUBLIC' ? '必须文档化' :
        category === 'TEAM' ? '建议文档化' : '选择性文档化';

      report += `| ${category} | ${apis.length} | ${percentage}% | ${config.priority} | ${action} |\n`;
    }

    report += `\n## 📋 详细分类\n\n`;

    for (const [category, apis] of Object.entries(this.classified)) {
      const config = API_CLASSIFICATION[category];
      report += `### ${category} (优先级${config.priority})\n\n`;
      report += `**描述**: ${config.description}\n\n`;

      if (apis.length > 0) {
        report += `**API列表** (${apis.length}个):\n\n`;
        for (const api of apis) {
          report += `- \`${api.name}\`\n`;
        }
        report += `\n`;
      }
    }

    await fs.writeFile(reportPath, report, 'utf8');
    console.log(`\n📄 详细分类报告已保存到: ${reportPath}`);
  }
}

async function main() {
  try {
    const classifier = new APIClassifier();
    await classifier.loadAPIs();
    classifier.classifyAPIs();
    classifier.generateReport();
    await classifier.saveClassificationReport();
  } catch (error) {
    console.error('❌ 分类失败:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { APIClassifier };