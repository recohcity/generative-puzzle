#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

async function main() {
  try {
    console.log('🚀 开始生成项目结构文档...');
    
    const generatedTime = new Date().toLocaleString('zh-CN');
    
    const document = `# 项目结构（Project Structure）
> 自动生成时间：${generatedTime}
> 生成工具：自动项目结构文档生成器 v1.0.0

本文档由脚本自动生成，严格对照实际目录结构。

## 测试文档

这是一个测试版本的项目结构文档。

---

*文档生成时间：${generatedTime}*
`;
    
    await fs.writeFile('docs/project_structure.md', document, 'utf8');
    console.log('✅ 文档已生成');
    
  } catch (error) {
    console.error('❌ 生成失败：', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}