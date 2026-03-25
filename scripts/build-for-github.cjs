#!/usr/bin/env node

/**
 * GitHub Pages 构建脚本
 * 在构建前临时移除内部路由，构建后恢复
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const API_DIR = path.join(process.cwd(), 'app/api');
const TEST_DIR = path.join(process.cwd(), 'app/test');
const BACKUP_ROOT_DIR = path.join(process.cwd(), '.build-route-backups');
const API_BACKUP_DIR = path.join(BACKUP_ROOT_DIR, 'api');
const TEST_BACKUP_DIR = path.join(BACKUP_ROOT_DIR, 'test');
const OUT_DIR = path.join(process.cwd(), 'out');
const OUT_TEST_DIR = path.join(OUT_DIR, 'test');
const OUT_PERF_DATA_FILE = path.join(OUT_DIR, 'performance-data.json');

console.log('🚀 开始 GitHub Pages 构建...');

function backupAndRemoveRoute(routeDir, backupDir, label) {
  if (!fs.existsSync(routeDir)) {
    return;
  }

  console.log(`📦 备份并移除 ${label}...`);
  if (!fs.existsSync(BACKUP_ROOT_DIR)) {
    fs.mkdirSync(BACKUP_ROOT_DIR, { recursive: true });
  }

  if (fs.existsSync(backupDir)) {
    fs.rmSync(backupDir, { recursive: true, force: true });
  }

  fs.cpSync(routeDir, backupDir, { recursive: true });
  fs.rmSync(routeDir, { recursive: true, force: true });
  console.log(`✅ ${label} 已备份并移除`);
}

function restoreRoute(routeDir, backupDir, label) {
  if (!fs.existsSync(backupDir)) {
    return;
  }

  console.log(`🔄 恢复 ${label}...`);
  fs.cpSync(backupDir, routeDir, { recursive: true });
  fs.rmSync(backupDir, { recursive: true, force: true });
  console.log(`✅ ${label} 已恢复`);
}

backupAndRemoveRoute(API_DIR, API_BACKUP_DIR, 'app/api');
backupAndRemoveRoute(TEST_DIR, TEST_BACKUP_DIR, 'app/test');

try {
  // 执行静态构建
  console.log('🔨 执行静态构建...');
  execSync('NODE_ENV=production BUILD_STATIC=true next build', {
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production', BUILD_STATIC: 'true' }
  });

  // 构建后兜底清理，避免内部测试路由和性能数据进入公开产物
  if (fs.existsSync(OUT_TEST_DIR)) {
    fs.rmSync(OUT_TEST_DIR, { recursive: true, force: true });
    console.log('🧹 已从 out/ 移除 /test 产物');
  }

  if (fs.existsSync(OUT_PERF_DATA_FILE)) {
    fs.rmSync(OUT_PERF_DATA_FILE, { force: true });
    console.log('🧹 已从 out/ 移除 performance-data.json');
  }

  console.log('✅ 构建完成');
} catch (error) {
  console.error('❌ 构建失败:', error.message);
  process.exitCode = 1;
} finally {
  // 恢复内部路由
  restoreRoute(API_DIR, API_BACKUP_DIR, 'app/api');
  restoreRoute(TEST_DIR, TEST_BACKUP_DIR, 'app/test');

  if (fs.existsSync(BACKUP_ROOT_DIR)) {
    fs.rmSync(BACKUP_ROOT_DIR, { recursive: true, force: true });
  }
}

if (process.exitCode && process.exitCode !== 0) {
  process.exit(process.exitCode);
}

console.log('🎉 GitHub Pages 构建完成！');
