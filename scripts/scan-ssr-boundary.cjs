#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const ALLOWED_EXT = new Set(['.ts', '.tsx', '.js', '.cjs', '.mjs']);
const IGNORE_DIRS = new Set(['node_modules', '.next', 'out', 'coverage', 'playwright-report', 'test-results', 'quality-reports', '.git']);

const TOKENS = [
  { id: 'window.', test: (line) => line.includes('window.') },
  { id: 'navigator.', test: (line) => line.includes('navigator.') },
  { id: 'ResizeObserver', test: (line) => /\b(new\s+)?ResizeObserver\b/.test(line) },
  { id: 'IntersectionObserver', test: (line) => /\b(new\s+)?IntersectionObserver\b/.test(line) },
  { id: 'PerformanceObserver', test: (line) => /\b(new\s+)?PerformanceObserver\b/.test(line) },
];
const ALLOW_IF_CONTAINS = [
  'typeof window',
  'typeof navigator',
  'typeof ResizeObserver',
  'typeof IntersectionObserver',
  'typeof PerformanceObserver',
  'process.browser',
];

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!IGNORE_DIRS.has(entry.name)) walk(full, acc);
      continue;
    }
    if (ALLOWED_EXT.has(path.extname(entry.name))) acc.push(full);
  }
  return acc;
}

function isLikelyTopLevel(lines, index) {
  // 轻量启发：扫描到当前行前的大括号深度，深度 0 视为顶层
  let depth = 0;
  for (let i = 0; i <= index; i++) {
    const line = lines[i].replace(/\/\*.*?\*\//g, '');
    for (const ch of line) {
      if (ch === '{') depth += 1;
      if (ch === '}') depth = Math.max(0, depth - 1);
    }
  }
  return depth === 0;
}

function isGuarded(line) {
  return ALLOW_IF_CONTAINS.some((token) => line.includes(token));
}

function main() {
  const files = walk(ROOT);
  const violations = [];

  for (const file of files) {
    const rel = path.relative(ROOT, file);
    if (rel.startsWith('scripts/')) continue;
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split(/\r?\n/);

    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('*')) return;

      const matchedToken = TOKENS.find((t) => t.test(trimmed));
      if (!matchedToken) return;

      if (!isLikelyTopLevel(lines, idx)) return;
      if (isGuarded(trimmed)) return;

      violations.push({
        file: rel,
        line: idx + 1,
        token: matchedToken.id,
        snippet: trimmed.slice(0, 180),
      });
    });
  }

  if (violations.length > 0) {
    console.error('❌ SSR 边界扫描未通过（发现疑似顶层浏览器对象访问）:\n');
    violations.slice(0, 80).forEach((v) => {
      console.error(`- ${v.file}:${v.line} [${v.token}] ${v.snippet}`);
    });
    if (violations.length > 80) {
      console.error(`... 还有 ${violations.length - 80} 处`);
    }
    process.exit(1);
  }

  console.log('✅ SSR 边界扫描通过（未发现未受保护顶层浏览器对象访问）');
}

main();
