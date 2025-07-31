#!/usr/bin/env node

/**
 * 真实项目质量检查器
 * 对本地项目进行实际的质量检查，包括TypeScript、ESLint、测试覆盖率等
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class ProjectQualityChecker {
  constructor() {
    this.results = {
      typescript: { passed: false, score: 0, errors: [], warnings: [] },
      eslint: { passed: false, score: 0, errors: [], warnings: [] },
      tests: { passed: false, score: 0, coverage: 0 },
      overall: { score: 0, passed: false }
    };
  }

  /**
   * 运行完整的质量检查
   */
  async runFullCheck() {
    console.log('🔍 开始项目质量检查...\n');
    
    try {
      // 1. TypeScript 检查
      await this.checkTypeScript();
      
      // 2. ESLint 检查
      await this.checkESLint();
      
      // 3. 测试和覆盖率检查
      await this.checkTests();
      
      // 4. 计算总体评分
      this.calculateOverallScore();
      
      // 5. 生成报告
      this.generateReport();
      
      return this.results;
      
    } catch (error) {
      console.error('❌ 质量检查失败:', error.message);
      throw error;
    }
  }

  /**
   * TypeScript 编译检查
   */
  async checkTypeScript() {
    console.log('📝 检查 TypeScript 编译...');
    
    try {
      const output = execSync('npx tsc --noEmit --pretty false', { 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      this.results.typescript.passed = true;
      this.results.typescript.score = 100;
      console.log('✅ TypeScript 编译通过');
      
    } catch (error) {
      const output = error.stdout || error.stderr || '';
      const lines = output.split('\n').filter(line => line.trim());
      
      const errors = lines.filter(line => line.includes('error TS'));
      const warnings = lines.filter(line => line.includes('warning TS'));
      
      this.results.typescript.errors = errors;
      this.results.typescript.warnings = warnings;
      this.results.typescript.passed = errors.length === 0;
      
      // 计算分数：每个错误扣10分，每个警告扣2分
      const errorPenalty = errors.length * 10;
      const warningPenalty = warnings.length * 2;
      this.results.typescript.score = Math.max(0, 100 - errorPenalty - warningPenalty);
      
      console.log(`${errors.length > 0 ? '❌' : '⚠️'} TypeScript: ${errors.length} 错误, ${warnings.length} 警告`);
    }
  }

  /**
   * ESLint 检查
   */
  async checkESLint() {
    console.log('🔧 检查 ESLint 规则...');
    
    try {
      const output = execSync('npm run lint', { 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      this.results.eslint.passed = true;
      this.results.eslint.score = 100;
      console.log('✅ ESLint 检查通过');
      
    } catch (error) {
      const output = error.stdout || error.stderr || '';
      const lines = output.split('\n').filter(line => line.trim());
      
      const errors = lines.filter(line => line.includes('Error:'));
      const warnings = lines.filter(line => line.includes('Warning:'));
      
      this.results.eslint.errors = errors;
      this.results.eslint.warnings = warnings;
      this.results.eslint.passed = errors.length === 0;
      
      // 计算分数：每个错误扣5分，每个警告扣1分
      const errorPenalty = errors.length * 5;
      const warningPenalty = warnings.length * 1;
      this.results.eslint.score = Math.max(0, 100 - errorPenalty - warningPenalty);
      
      console.log(`${errors.length > 0 ? '❌' : '⚠️'} ESLint: ${errors.length} 错误, ${warnings.length} 警告`);
    }
  }

  /**
   * 测试和覆盖率检查
   */
  async checkTests() {
    console.log('🧪 运行测试和覆盖率检查...');
    
    try {
      // 运行测试并生成覆盖率报告
      const output = execSync('npm run test:unit -- --coverage --coverageReporters=json-summary --passWithNoTests', { 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      // 读取覆盖率报告
      const coveragePath = path.join(process.cwd(), 'coverage', 'coverage-summary.json');
      let coverage = 0;
      
      if (fs.existsSync(coveragePath)) {
        const coverageData = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
        coverage = coverageData.total.lines.pct || 0;
      }
      
      this.results.tests.passed = true;
      this.results.tests.coverage = coverage;
      this.results.tests.score = Math.min(100, coverage + 20); // 覆盖率 + 20分基础分
      
      console.log(`✅ 测试通过，覆盖率: ${coverage.toFixed(1)}%`);
      
    } catch (error) {
      this.results.tests.passed = false;
      this.results.tests.score = 0;
      console.log('❌ 测试失败');
    }
  }

  /**
   * 计算总体评分
   */
  calculateOverallScore() {
    const weights = {
      typescript: 0.4,  // TypeScript 权重 40%
      eslint: 0.3,      // ESLint 权重 30%
      tests: 0.3        // 测试 权重 30%
    };
    
    this.results.overall.score = Math.round(
      this.results.typescript.score * weights.typescript +
      this.results.eslint.score * weights.eslint +
      this.results.tests.score * weights.tests
    );
    
    this.results.overall.passed = 
      this.results.typescript.passed &&
      this.results.eslint.passed &&
      this.results.tests.passed;
  }

  /**
   * 生成质量报告
   */
  generateReport() {
    console.log('\n📊 质量检查报告');
    console.log('==================');
    
    console.log(`\n🎯 总体评分: ${this.results.overall.score}/100 ${this.getScoreEmoji(this.results.overall.score)}`);
    console.log(`📋 总体状态: ${this.results.overall.passed ? '✅ 通过' : '❌ 未通过'}`);
    
    console.log('\n📝 详细结果:');
    console.log(`  TypeScript: ${this.results.typescript.score}/100 ${this.results.typescript.passed ? '✅' : '❌'}`);
    console.log(`  ESLint:     ${this.results.eslint.score}/100 ${this.results.eslint.passed ? '✅' : '❌'}`);
    console.log(`  测试覆盖率: ${this.results.tests.score}/100 ${this.results.tests.passed ? '✅' : '❌'} (${this.results.tests.coverage.toFixed(1)}%)`);
    
    // 显示具体问题
    if (this.results.typescript.errors.length > 0) {
      console.log('\n🔴 TypeScript 错误:');
      this.results.typescript.errors.slice(0, 5).forEach(error => {
        console.log(`  - ${error}`);
      });
      if (this.results.typescript.errors.length > 5) {
        console.log(`  ... 还有 ${this.results.typescript.errors.length - 5} 个错误`);
      }
    }
    
    if (this.results.eslint.errors.length > 0) {
      console.log('\n🟠 ESLint 错误:');
      this.results.eslint.errors.slice(0, 5).forEach(error => {
        console.log(`  - ${error}`);
      });
      if (this.results.eslint.errors.length > 5) {
        console.log(`  ... 还有 ${this.results.eslint.errors.length - 5} 个错误`);
      }
    }
    
    // 生成JSON报告
    this.saveJsonReport();
    
    console.log('\n💡 建议:');
    this.generateSuggestions();
  }

  /**
   * 生成改进建议
   */
  generateSuggestions() {
    const suggestions = [];
    
    if (this.results.typescript.score < 80) {
      suggestions.push('修复 TypeScript 编译错误以提高代码质量');
    }
    
    if (this.results.eslint.score < 80) {
      suggestions.push('解决 ESLint 警告以改善代码风格');
    }
    
    if (this.results.tests.coverage < 70) {
      suggestions.push('增加测试覆盖率，目标至少70%');
    }
    
    if (this.results.overall.score < 70) {
      suggestions.push('整体质量需要改进，建议优先修复错误');
    }
    
    if (suggestions.length === 0) {
      suggestions.push('代码质量良好，继续保持！');
    }
    
    suggestions.forEach(suggestion => {
      console.log(`  • ${suggestion}`);
    });
  }

  /**
   * 保存JSON报告
   */
  saveJsonReport() {
    const reportDir = path.join(process.cwd(), 'quality-reports');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    const reportPath = path.join(reportDir, `quality-report-${new Date().toISOString().split('T')[0]}.json`);
    const report = {
      ...this.results,
      timestamp: new Date().toISOString(),
      project: require(path.join(process.cwd(), 'package.json')).name
    };
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 详细报告已保存: ${reportPath}`);
  }

  /**
   * 获取分数对应的表情符号
   */
  getScoreEmoji(score) {
    if (score >= 90) return '🎉';
    if (score >= 80) return '👍';
    if (score >= 70) return '👌';
    if (score >= 60) return '⚠️';
    return '🚨';
  }

  /**
   * 检查是否通过质量门禁
   */
  passesQualityGate(threshold = 70) {
    return this.results.overall.score >= threshold;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  const checker = new ProjectQualityChecker();
  
  checker.runFullCheck()
    .then(results => {
      const passed = checker.passesQualityGate();
      console.log(`\n🚪 质量门禁: ${passed ? '✅ 通过' : '❌ 未通过'}`);
      
      // 根据质量门禁结果设置退出码
      process.exit(passed ? 0 : 1);
    })
    .catch(error => {
      console.error('质量检查失败:', error);
      process.exit(1);
    });
}

module.exports = ProjectQualityChecker;