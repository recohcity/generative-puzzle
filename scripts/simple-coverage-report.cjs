#!/usr/bin/env node

/**
 * 简洁的覆盖率报告生成器
 * 生成清晰易读的覆盖率报告
 */

const fs = require('fs');
const path = require('path');

// 颜色代码
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bright: '\x1b[1m'
};

// 覆盖率等级判断
function getCoverageLevel(percentage) {
  if (percentage >= 95) return { level: 'A+', color: colors.green };
  if (percentage >= 90) return { level: 'A', color: colors.green };
  if (percentage >= 85) return { level: 'B+', color: colors.yellow };
  if (percentage >= 80) return { level: 'B', color: colors.yellow };
  if (percentage >= 75) return { level: 'C+', color: colors.yellow };
  return { level: 'C', color: colors.red };
}

// 格式化百分比
function formatPercentage(value, showColor = true) {
  const percentage = parseFloat(value);
  const { level, color } = getCoverageLevel(percentage);
  if (showColor) {
    return `${color}${percentage.toFixed(1)}%${colors.reset} ${color}(${level})${colors.reset}`;
  }
  return `${percentage.toFixed(1)}% (${level})`;
}

// 生成简洁报告
function generateSimpleReport() {
  try {
    const summaryPath = path.join(process.cwd(), 'coverage', 'coverage-summary.json');
    
    if (!fs.existsSync(summaryPath)) {
      console.error(`${colors.red}错误: 找不到覆盖率数据文件${colors.reset}`);
      console.log(`${colors.yellow}请先运行: npm run test:unit -- --coverage${colors.reset}`);
      return;
    }
    
    const data = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
    const now = new Date().toLocaleString('zh-CN');
    
    console.log('');
    console.log(`${colors.cyan}${colors.bright}📊 测试覆盖率报告${colors.reset}`);
    console.log(`${colors.blue}生成时间: ${now}${colors.reset}`);
    console.log('');
    
    // 总体覆盖率
    if (data.total) {
      const total = data.total;
      console.log(`${colors.bright}🎯 总体覆盖率${colors.reset}`);
      console.log(`   语句: ${formatPercentage(total.statements.pct)} (${total.statements.covered}/${total.statements.total})`);
      console.log(`   分支: ${formatPercentage(total.branches.pct)} (${total.branches.covered}/${total.branches.total})`);
      console.log(`   函数: ${formatPercentage(total.functions.pct)} (${total.functions.covered}/${total.functions.total})`);
      console.log(`   行数: ${formatPercentage(total.lines.pct)} (${total.lines.covered}/${total.lines.total})`);
      console.log('');
    }
    
    // 文件覆盖率详情
    const files = Object.keys(data).filter(key => key !== 'total');
    if (files.length > 0) {
      console.log(`${colors.bright}📁 文件覆盖率详情${colors.reset}`);
      console.log('');
      
      // 按覆盖率排序
      const sortedFiles = files.sort((a, b) => {
        const aAvg = (data[a].statements.pct + data[a].branches.pct + data[a].functions.pct + data[a].lines.pct) / 4;
        const bAvg = (data[b].statements.pct + data[b].branches.pct + data[b].functions.pct + data[b].lines.pct) / 4;
        return bAvg - aAvg;
      });
      
      // 分类显示
      const perfect = sortedFiles.filter(f => data[f].statements.pct === 100 && data[f].branches.pct === 100 && data[f].functions.pct === 100 && data[f].lines.pct === 100);
      const excellent = sortedFiles.filter(f => !perfect.includes(f) && data[f].statements.pct >= 95);
      const good = sortedFiles.filter(f => !perfect.includes(f) && !excellent.includes(f) && data[f].statements.pct >= 85);
      const needsWork = sortedFiles.filter(f => !perfect.includes(f) && !excellent.includes(f) && !good.includes(f));
      
      if (perfect.length > 0) {
        console.log(`${colors.green}💯 完美覆盖 (${perfect.length}个文件)${colors.reset}`);
        perfect.forEach(file => {
          const relativePath = file.replace(process.cwd() + '/', '');
          console.log(`   ✅ ${relativePath}`);
        });
        console.log('');
      }
      
      if (excellent.length > 0) {
        console.log(`${colors.green}🏆 优秀覆盖 (${excellent.length}个文件)${colors.reset}`);
        excellent.forEach(file => {
          const relativePath = file.replace(process.cwd() + '/', '');
          const fileData = data[file];
          console.log(`   📈 ${relativePath}`);
          console.log(`      语句: ${formatPercentage(fileData.statements.pct)} | 分支: ${formatPercentage(fileData.branches.pct)} | 函数: ${formatPercentage(fileData.functions.pct)}`);
        });
        console.log('');
      }
      
      if (good.length > 0) {
        console.log(`${colors.yellow}👍 良好覆盖 (${good.length}个文件)${colors.reset}`);
        good.forEach(file => {
          const relativePath = file.replace(process.cwd() + '/', '');
          const fileData = data[file];
          console.log(`   📊 ${relativePath}`);
          console.log(`      语句: ${formatPercentage(fileData.statements.pct)} | 分支: ${formatPercentage(fileData.branches.pct)} | 函数: ${formatPercentage(fileData.functions.pct)}`);
        });
        console.log('');
      }
      
      if (needsWork.length > 0) {
        console.log(`${colors.red}⚠️  需要改进 (${needsWork.length}个文件)${colors.reset}`);
        needsWork.forEach(file => {
          const relativePath = file.replace(process.cwd() + '/', '');
          const fileData = data[file];
          console.log(`   🔧 ${relativePath}`);
          console.log(`      语句: ${formatPercentage(fileData.statements.pct)} | 分支: ${formatPercentage(fileData.branches.pct)} | 函数: ${formatPercentage(fileData.functions.pct)}`);
        });
        console.log('');
      }
    }
    
    // 生成Markdown报告
    generateMarkdownReport(data, now);
    
    console.log(`${colors.green}✅ 报告已生成: coverage/coverage-simple-report.md${colors.reset}`);
    
  } catch (error) {
    console.error(`${colors.red}生成报告时出错:${colors.reset}`, error.message);
  }
}

// 生成Markdown报告
function generateMarkdownReport(data, timestamp) {
  let markdown = [];
  
  markdown.push('# 📊 测试覆盖率报告');
  markdown.push('');
  markdown.push(`**生成时间**: ${timestamp}`);
  markdown.push('');
  
  // 总体覆盖率
  if (data.total) {
    const total = data.total;
    markdown.push('## 🎯 总体覆盖率');
    markdown.push('');
    markdown.push('| 指标 | 覆盖率 | 已覆盖/总数 | 等级 |');
    markdown.push('|------|--------|-------------|------|');
    markdown.push(`| 语句覆盖率 | ${total.statements.pct.toFixed(1)}% | ${total.statements.covered}/${total.statements.total} | ${getCoverageLevel(total.statements.pct).level} |`);
    markdown.push(`| 分支覆盖率 | ${total.branches.pct.toFixed(1)}% | ${total.branches.covered}/${total.branches.total} | ${getCoverageLevel(total.branches.pct).level} |`);
    markdown.push(`| 函数覆盖率 | ${total.functions.pct.toFixed(1)}% | ${total.functions.covered}/${total.functions.total} | ${getCoverageLevel(total.functions.pct).level} |`);
    markdown.push(`| 行覆盖率 | ${total.lines.pct.toFixed(1)}% | ${total.lines.covered}/${total.lines.total} | ${getCoverageLevel(total.lines.pct).level} |`);
    markdown.push('');
  }
  
  // 文件分类
  const files = Object.keys(data).filter(key => key !== 'total');
  if (files.length > 0) {
    const sortedFiles = files.sort((a, b) => {
      const aAvg = (data[a].statements.pct + data[a].branches.pct + data[a].functions.pct + data[a].lines.pct) / 4;
      const bAvg = (data[b].statements.pct + data[b].branches.pct + data[b].functions.pct + data[b].lines.pct) / 4;
      return bAvg - aAvg;
    });
    
    const perfect = sortedFiles.filter(f => data[f].statements.pct === 100 && data[f].branches.pct === 100 && data[f].functions.pct === 100 && data[f].lines.pct === 100);
    const excellent = sortedFiles.filter(f => !perfect.includes(f) && data[f].statements.pct >= 95);
    const good = sortedFiles.filter(f => !perfect.includes(f) && !excellent.includes(f) && data[f].statements.pct >= 85);
    const needsWork = sortedFiles.filter(f => !perfect.includes(f) && !excellent.includes(f) && !good.includes(f));
    
    if (perfect.length > 0) {
      markdown.push(`## 💯 完美覆盖 (${perfect.length}个文件)`);
      markdown.push('');
      perfect.forEach(file => {
        const relativePath = file.replace(process.cwd() + '/', '');
        markdown.push(`- ✅ \`${relativePath}\``);
      });
      markdown.push('');
    }
    
    if (excellent.length > 0) {
      markdown.push(`## 🏆 优秀覆盖 (${excellent.length}个文件)`);
      markdown.push('');
      markdown.push('| 文件 | 语句 | 分支 | 函数 | 行 |');
      markdown.push('|------|------|------|------|-----|');
      excellent.forEach(file => {
        const relativePath = file.replace(process.cwd() + '/', '');
        const fileData = data[file];
        markdown.push(`| \`${relativePath}\` | ${fileData.statements.pct.toFixed(1)}% | ${fileData.branches.pct.toFixed(1)}% | ${fileData.functions.pct.toFixed(1)}% | ${fileData.lines.pct.toFixed(1)}% |`);
      });
      markdown.push('');
    }
    
    if (good.length > 0) {
      markdown.push(`## 👍 良好覆盖 (${good.length}个文件)`);
      markdown.push('');
      markdown.push('| 文件 | 语句 | 分支 | 函数 | 行 |');
      markdown.push('|------|------|------|------|-----|');
      good.forEach(file => {
        const relativePath = file.replace(process.cwd() + '/', '');
        const fileData = data[file];
        markdown.push(`| \`${relativePath}\` | ${fileData.statements.pct.toFixed(1)}% | ${fileData.branches.pct.toFixed(1)}% | ${fileData.functions.pct.toFixed(1)}% | ${fileData.lines.pct.toFixed(1)}% |`);
      });
      markdown.push('');
    }
    
    if (needsWork.length > 0) {
      markdown.push(`## ⚠️ 需要改进 (${needsWork.length}个文件)`);
      markdown.push('');
      markdown.push('| 文件 | 语句 | 分支 | 函数 | 行 |');
      markdown.push('|------|------|------|------|-----|');
      needsWork.forEach(file => {
        const relativePath = file.replace(process.cwd() + '/', '');
        const fileData = data[file];
        markdown.push(`| \`${relativePath}\` | ${fileData.statements.pct.toFixed(1)}% | ${fileData.branches.pct.toFixed(1)}% | ${fileData.functions.pct.toFixed(1)}% | ${fileData.lines.pct.toFixed(1)}% |`);
      });
      markdown.push('');
    }
  }
  
  const markdownPath = path.join(process.cwd(), 'coverage', 'coverage-simple-report.md');
  fs.writeFileSync(markdownPath, markdown.join('\n'), 'utf8');
}

// 如果直接运行此脚本
if (require.main === module) {
  generateSimpleReport();
}

module.exports = { generateSimpleReport };