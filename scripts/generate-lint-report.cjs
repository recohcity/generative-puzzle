#!/usr/bin/env node

/**
 * ESLint和TypeScript检查报告生成脚本
 * 生成详细的代码质量检查报告
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
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * 运行TypeScript编译检查
 */
function runTypeScriptCheck() {
  log('📝 运行TypeScript编译检查...', 'cyan');

  try {
    execSync('npx tsc --noEmit --pretty false', {
      encoding: 'utf8',
      stdio: 'pipe'
    });

    return {
      passed: true,
      score: 100,
      errors: [],
      warnings: [],
      output: 'TypeScript编译检查通过，无错误和警告。'
    };

  } catch (error) {
    const output = error.stdout || error.stderr || '';
    const lines = output.split('\n').filter(line => line.trim());

    const errors = lines.filter(line => line.includes('error TS'));
    const warnings = lines.filter(line => line.includes('warning TS'));

    // 计算分数：每个错误扣10分，每个警告扣2分
    const errorPenalty = errors.length * 10;
    const warningPenalty = warnings.length * 2;
    const score = Math.max(0, 100 - errorPenalty - warningPenalty);

    return {
      passed: errors.length === 0,
      score: score,
      errors: errors,
      warnings: warnings,
      output: output
    };
  }
}

/**
 * 运行ESLint检查
 */
function runESLintCheck() {
  log('🔧 运行ESLint代码检查...', 'cyan');

  try {
    // 尝试运行ESLint并获取JSON格式输出
    const eslintOutput = execSync('npx eslint . --format json', {
      encoding: 'utf8',
      stdio: 'pipe'
    });

    const eslintResults = JSON.parse(eslintOutput);

    // 统计错误和警告
    let totalErrors = 0;
    let totalWarnings = 0;
    const fileResults = [];

    eslintResults.forEach(result => {
      if (result.errorCount > 0 || result.warningCount > 0) {
        fileResults.push({
          filePath: result.filePath.replace(process.cwd(), '.'),
          errorCount: result.errorCount,
          warningCount: result.warningCount,
          messages: result.messages
        });
      }
      totalErrors += result.errorCount;
      totalWarnings += result.warningCount;
    });

    // 计算分数：每个错误扣5分，每个警告扣1分
    const errorPenalty = totalErrors * 5;
    const warningPenalty = totalWarnings * 1;
    const score = Math.max(0, 100 - errorPenalty - warningPenalty);

    return {
      passed: totalErrors === 0,
      score: score,
      totalErrors: totalErrors,
      totalWarnings: totalWarnings,
      fileResults: fileResults,
      output: totalErrors === 0 && totalWarnings === 0 ? 'ESLint检查通过，无错误和警告。' : null
    };

  } catch (error) {
    // 如果JSON格式失败，尝试普通格式
    try {
      execSync('npm run lint', {
        encoding: 'utf8',
        stdio: 'pipe'
      });

      return {
        passed: true,
        score: 100,
        totalErrors: 0,
        totalWarnings: 0,
        fileResults: [],
        output: 'ESLint检查通过，无错误和警告。'
      };

    } catch (lintError) {
      const output = lintError.stdout || lintError.stderr || '';
      const lines = output.split('\n').filter(line => line.trim());

      // 简单解析错误和警告数量
      const errorLines = lines.filter(line => line.includes('error') || line.includes('✖'));
      const warningLines = lines.filter(line => line.includes('warning') || line.includes('⚠'));

      const totalErrors = errorLines.length;
      const totalWarnings = warningLines.length;

      const errorPenalty = totalErrors * 5;
      const warningPenalty = totalWarnings * 1;
      const score = Math.max(0, 100 - errorPenalty - warningPenalty);

      return {
        passed: totalErrors === 0,
        score: score,
        totalErrors: totalErrors,
        totalWarnings: totalWarnings,
        fileResults: [],
        output: output
      };
    }
  }
}

/**
 * 生成代码质量检查报告
 */
function generateLintReport(tsResult, eslintResult) {
  const currentDate = new Date().toISOString().split('T')[0];
  const currentTime = new Date().toLocaleTimeString('zh-CN');

  // 获取项目版本
  let version = 'unknown';
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    version = packageJson.version;
  } catch (error) {
    // 忽略错误
  }

  // 计算总体评分
  const overallScore = Math.round((tsResult.score + eslintResult.score) / 2);

  // 生成等级
  function getGrade(score) {
    if (score >= 98) return 'A+';
    if (score >= 95) return 'A';
    if (score >= 90) return 'B+';
    if (score >= 85) return 'B';
    if (score >= 80) return 'C+';
    return 'C';
  }

  const reportContent = `# 📋 代码质量检查报告

**生成时间**: ${currentDate} ${currentTime}  
**项目版本**: v${version}

## 📊 检查结果概览

| 检查项目 | 得分 | 等级 | 状态 | 错误数 | 警告数 |
|---------|------|------|------|--------|--------|
| **TypeScript编译** | ${tsResult.score}/100 | ${getGrade(tsResult.score)} | ${tsResult.passed ? '✅ 通过' : '❌ 失败'} | ${tsResult.errors.length} | ${tsResult.warnings.length} |
| **ESLint代码规范** | ${eslintResult.score}/100 | ${getGrade(eslintResult.score)} | ${eslintResult.passed ? '✅ 通过' : '❌ 失败'} | ${eslintResult.totalErrors || 0} | ${eslintResult.totalWarnings || 0} |
| **整体评分** | ${overallScore}/100 | ${getGrade(overallScore)} | ${tsResult.passed && eslintResult.passed ? '✅ 通过' : '❌ 需要修复'} | ${tsResult.errors.length + (eslintResult.totalErrors || 0)} | ${tsResult.warnings.length + (eslintResult.totalWarnings || 0)} |

## 🔍 详细检查结果

### 📝 TypeScript编译检查

**检查命令**: \`npx tsc --noEmit\`  
**检查结果**: ${tsResult.passed ? '✅ 编译通过' : '❌ 编译失败'}  
**得分**: ${tsResult.score}/100 (${getGrade(tsResult.score)}级别)

${tsResult.errors.length > 0 ? `
#### ❌ 编译错误 (${tsResult.errors.length}个)

\`\`\`
${tsResult.errors.join('\n')}
\`\`\`
` : ''}

${tsResult.warnings.length > 0 ? `
#### ⚠️ 编译警告 (${tsResult.warnings.length}个)

\`\`\`
${tsResult.warnings.join('\n')}
\`\`\`
` : ''}

${tsResult.passed ? '✅ **TypeScript编译检查通过，代码类型安全！**' : ''}

### 🔧 ESLint代码规范检查

**检查命令**: \`npm run lint\`  
**检查结果**: ${eslintResult.passed ? '✅ 规范检查通过' : '❌ 发现规范问题'}  
**得分**: ${eslintResult.score}/100 (${getGrade(eslintResult.score)}级别)

${eslintResult.fileResults && eslintResult.fileResults.length > 0 ? `
#### 📁 问题文件详情

${eslintResult.fileResults.map(file => `
**文件**: \`${file.filePath}\`  
**错误**: ${file.errorCount}个 | **警告**: ${file.warningCount}个

${file.messages.map(msg => `- **${msg.severity === 2 ? '❌ 错误' : '⚠️ 警告'}**: ${msg.message} (${msg.ruleId || 'unknown'})  
  位置: 第${msg.line}行第${msg.column}列`).join('\n')}
`).join('\n')}
` : ''}

${eslintResult.passed ? '✅ **ESLint代码规范检查通过，代码风格统一！**' : ''}

## 🎯 修复建议

${!tsResult.passed ? `
### TypeScript错误修复
1. 检查类型定义和导入语句
2. 确保所有变量都有正确的类型注解
3. 修复类型不匹配的问题
4. 运行 \`npx tsc --noEmit\` 查看详细错误信息
` : ''}

${!eslintResult.passed ? `
### ESLint规范修复
1. 运行 \`npm run lint -- --fix\` 自动修复部分问题
2. 手动修复无法自动修复的规范问题
3. 考虑更新ESLint配置以适应项目需求
4. 确保代码符合团队编码规范
` : ''}

${tsResult.passed && eslintResult.passed ? `
## 🏆 恭喜！代码质量检查全部通过

您的代码已达到以下标准：
- ✅ TypeScript类型安全
- ✅ ESLint代码规范
- ✅ 整体质量评分: ${overallScore}/100 (${getGrade(overallScore)}级别)

继续保持这个优秀的代码质量！
` : ''}

## 📈 质量提升建议

1. **持续集成**: 将代码质量检查集成到CI/CD流程中
2. **预提交钩子**: 使用husky等工具在提交前自动运行检查
3. **编辑器集成**: 配置IDE/编辑器实时显示ESLint和TypeScript错误
4. **团队规范**: 建立团队代码规范文档和最佳实践

---

*报告生成时间: ${currentDate} ${currentTime}*  
*下次检查建议: 每次代码提交前运行*`;

  return reportContent;
}

/**
 * 主函数
 */
function main() {
  try {
    log('📋 开始生成代码质量检查报告...', 'bold');

    // 运行TypeScript检查
    const tsResult = runTypeScriptCheck();
    log(`TypeScript检查完成: ${tsResult.passed ? '✅ 通过' : '❌ 失败'} (${tsResult.score}分)`,
      tsResult.passed ? 'green' : 'red');

    // 运行ESLint检查
    const eslintResult = runESLintCheck();
    log(`ESLint检查完成: ${eslintResult.passed ? '✅ 通过' : '❌ 失败'} (${eslintResult.score}分)`,
      eslintResult.passed ? 'green' : 'red');

    // 生成报告
    const reportContent = generateLintReport(tsResult, eslintResult);

    // 确保docs目录存在
    const docsDir = path.join(process.cwd(), 'docs');
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }

    // 确保quality-reports目录存在（用于JSON数据）
    const reportsDir = path.join(process.cwd(), 'quality-reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    // 写入Markdown报告文件到docs目录
    const reportPath = path.join(docsDir, 'reports', 'code-quality-report.md');
    fs.writeFileSync(reportPath, reportContent, 'utf8');

    // 同时生成JSON格式的数据到quality-reports目录
    const jsonData = {
      timestamp: new Date().toISOString(),
      typescript: tsResult,
      eslint: eslintResult,
      overall: {
        score: Math.round((tsResult.score + eslintResult.score) / 2),
        passed: tsResult.passed && eslintResult.passed
      }
    };

    const jsonPath = path.join(reportsDir, 'lint-report.json');
    fs.writeFileSync(jsonPath, JSON.stringify(jsonData, null, 2), 'utf8');

    log('\n✅ 代码质量检查报告生成完成！', 'green');
    log(`📄 Markdown报告: ${reportPath}`, 'blue');
    log(`📊 JSON数据: ${jsonPath}`, 'blue');
    log('💡 报告已保存到docs目录，便于统一文档管理', 'cyan');

    // 显示总体结果
    const overallScore = Math.round((tsResult.score + eslintResult.score) / 2);
    log(`\n🏆 整体评分: ${overallScore}/100`, overallScore >= 95 ? 'green' : overallScore >= 80 ? 'yellow' : 'red');

    return jsonData;

  } catch (error) {
    log(`❌ 生成报告失败: ${error.message}`, 'red');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { runTypeScriptCheck, runESLintCheck, generateLintReport, main };