#!/usr/bin/env node

/**
 * GitHub Pages 构建脚本
 * 在构建前临时移除API文件，构建后恢复
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const API_DIR = path.join(process.cwd(), 'app/api');
const BACKUP_DIR = path.join(process.cwd(), '.api-backup');

console.log('🚀 开始 GitHub Pages 构建...');

// 备份API文件
if (fs.existsSync(API_DIR)) {
  console.log('📦 备份API文件...');
  if (fs.existsSync(BACKUP_DIR)) {
    fs.rmSync(BACKUP_DIR, { recursive: true, force: true });
  }
  fs.cpSync(API_DIR, BACKUP_DIR, { recursive: true });
  fs.rmSync(API_DIR, { recursive: true, force: true });
  console.log('✅ API文件已备份并移除');
}

try {
  // 执行静态构建
  console.log('🔨 执行静态构建...');
  execSync('NODE_ENV=production BUILD_STATIC=true next build', { 
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production', BUILD_STATIC: 'true' }
  });
  console.log('✅ 构建完成');
} catch (error) {
  console.error('❌ 构建失败:', error.message);
  process.exit(1);
} finally {
  // 恢复API文件
  if (fs.existsSync(BACKUP_DIR)) {
    console.log('🔄 恢复API文件...');
    fs.cpSync(BACKUP_DIR, API_DIR, { recursive: true });
    fs.rmSync(BACKUP_DIR, { recursive: true, force: true });
    console.log('✅ API文件已恢复');
  }
}

console.log('🎉 GitHub Pages 构建完成！');