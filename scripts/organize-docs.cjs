#!/usr/bin/env node

/**
 * 文档组织工具
 * 自动整理和维护项目文档结构
 */

const fs = require('fs').promises;
const path = require('path');

// 文档组织配置
const DOC_ORGANIZATION = {
  // 根目录必须保留的文档
  rootRequired: [
    'README.md',
    'CONTRIBUTING.md', 
    'CHANGELOG.md',
    'LICENSE'
  ],
  
  // docs目录结构
  docsStructure: {
    'reports/': {
      description: '各类分析报告',
      patterns: ['*report*.md', '*analysis*.md']
    },
    'development/': {
      description: '开发过程记录',
      patterns: ['*fix*.md', '*adaptation*.md', '*test*.md', '*summary*.md']
    },
    'debugging/': {
      description: '调试相关文档',
      patterns: ['debug-*.ts', 'debug-*.md', '*debug*.md']
    },
    'configuration/': {
      description: '配置相关文档',
      patterns: ['*config*.md', '*setup*.md']
    },
    'guides/': {
      description: '使用指南',
      patterns: ['*guide*.md', '*usage*.md', '*tutorial*.md']
    }
  }
};

class DocumentOrganizer {
  constructor() {
    this.moved = [];
    this.errors = [];
  }
  
  async organize() {
    console.log('📚 开始整理文档结构...');
    
    try {
      // 1. 创建docs目录结构
      await this.createDocsStructure();
      
      // 2. 扫描根目录文档
      await this.scanRootDocuments();
      
      // 3. 移动文档到合适位置
      await this.moveDocuments();
      
      // 4. 更新文档链接
      await this.updateDocumentLinks();
      
      // 5. 生成报告
      this.generateReport();
      
    } catch (error) {
      console.error('❌ 文档整理失败:', error.message);
      process.exit(1);
    }
  }
  
  async createDocsStructure() {
    console.log('📁 创建docs目录结构...');
    
    for (const [dirName, config] of Object.entries(DOC_ORGANIZATION.docsStructure)) {
      const dirPath = path.join('docs', dirName);
      
      try {
        await fs.mkdir(dirPath, { recursive: true });
        console.log(`✅ 创建目录: ${dirPath}`);
      } catch (error) {
        if (error.code !== 'EEXIST') {
          this.errors.push(`创建目录失败: ${dirPath} - ${error.message}`);
        }
      }
    }
  }
  
  async scanRootDocuments() {
    console.log('🔍 扫描根目录文档...');
    
    const files = await fs.readdir('.');
    this.rootDocuments = files.filter(file => 
      file.endsWith('.md') || file.endsWith('.ts')
    );
    
    console.log(`📄 发现 ${this.rootDocuments.length} 个文档文件`);
  }
  
  async moveDocuments() {
    console.log('📦 移动文档到合适位置...');
    
    for (const file of this.rootDocuments) {
      // 跳过必须保留在根目录的文件
      if (DOC_ORGANIZATION.rootRequired.includes(file)) {
        continue;
      }
      
      // 查找合适的目标目录
      const targetDir = this.findTargetDirectory(file);
      
      if (targetDir) {
        try {
          const sourcePath = file;
          const targetPath = path.join('docs', targetDir, file);
          
          // 检查源文件是否存在
          try {
            await fs.access(sourcePath);
          } catch {
            continue; // 文件不存在，跳过
          }
          
          await fs.rename(sourcePath, targetPath);
          this.moved.push({
            from: sourcePath,
            to: targetPath,
            category: targetDir
          });
          
          console.log(`📁 ${sourcePath} → ${targetPath}`);
        } catch (error) {
          this.errors.push(`移动文件失败: ${file} - ${error.message}`);
        }
      }
    }
  }
  
  findTargetDirectory(filename) {
    for (const [dirName, config] of Object.entries(DOC_ORGANIZATION.docsStructure)) {
      for (const pattern of config.patterns) {
        // 简单的模式匹配
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        if (regex.test(filename)) {
          return dirName;
        }
      }
    }
    return null;
  }
  
  async updateDocumentLinks() {
    console.log('🔗 更新文档链接...');
    
    // 更新README.md中的链接
    await this.updateReadmeLinks();
    
    // 更新CONTRIBUTING.md中的链接
    await this.updateContributingLinks();
  }
  
  async updateReadmeLinks() {
    try {
      const readmePath = 'README.md';
      let content = await fs.readFile(readmePath, 'utf8');
      
      // 更新常见的文档链接
      const linkUpdates = [
        {
          old: './docs/API_SCAN_USAGE.md',
          new: './docs/README.md'
        },
        {
          old: './docs/CONTRIBUTING.md',
          new: './CONTRIBUTING.md'
        }
      ];
      
      for (const update of linkUpdates) {
        content = content.replace(new RegExp(update.old, 'g'), update.new);
      }
      
      await fs.writeFile(readmePath, content, 'utf8');
      console.log('✅ 更新README.md链接');
    } catch (error) {
      this.errors.push(`更新README.md链接失败: ${error.message}`);
    }
  }
  
  async updateContributingLinks() {
    try {
      const contributingPath = 'CONTRIBUTING.md';
      let content = await fs.readFile(contributingPath, 'utf8');
      
      // 更新文档中心链接
      content = content.replace(
        /\[FAQ\]\(\.\/docs\/FAQ\.md\)/g,
        '[文档中心](./docs/README.md)'
      );
      
      await fs.writeFile(contributingPath, content, 'utf8');
      console.log('✅ 更新CONTRIBUTING.md链接');
    } catch (error) {
      this.errors.push(`更新CONTRIBUTING.md链接失败: ${error.message}`);
    }
  }
  
  generateReport() {
    console.log('\n📊 文档整理报告');
    console.log('='.repeat(50));
    
    console.log(`\n✅ 成功移动 ${this.moved.length} 个文件:`);
    for (const move of this.moved) {
      console.log(`   📁 ${move.from} → ${move.to}`);
    }
    
    if (this.errors.length > 0) {
      console.log(`\n❌ 遇到 ${this.errors.length} 个错误:`);
      for (const error of this.errors) {
        console.log(`   ⚠️ ${error}`);
      }
    }
    
    console.log(`\n📚 根目录保留的文档:`);
    for (const file of DOC_ORGANIZATION.rootRequired) {
      console.log(`   📄 ${file}`);
    }
    
    console.log(`\n💡 建议操作:`);
    console.log(`   1. 检查移动后的文档链接是否正确`);
    console.log(`   2. 更新docs/README.md中的目录结构`);
    console.log(`   3. 运行 npm run generate-structure 更新项目结构`);
    console.log(`   4. 提交文档整理的变更`);
  }
}

async function main() {
  try {
    const organizer = new DocumentOrganizer();
    await organizer.organize();
  } catch (error) {
    console.error('❌ 文档整理失败:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { DocumentOrganizer };