#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const ALLOWED_EXT = new Set(['.ts', '.tsx', '.js', '.cjs', '.mjs']);
const IGNORE_DIRS = new Set(['node_modules', '.next', 'out', 'coverage', 'playwright-report', 'test-results', 'quality-reports', '.git']);

const FORBIDDEN_PATTERNS = [
  '__E2E__',
  '__gameStateForTests__',
  'testAPI',
  'selectPieceForTest',
  'markPieceAsCompletedForTest',
  'rotatePieceForTest',
  'resetPiecePositionForTest',
  'GameDataManager',
  'generateTestData',
  'clearGameData',
];

const ALLOWED_GUARDS = [
  'process.env.NODE_ENV !== "production"',
  "process.env.NODE_ENV !== 'production'",
  'process.env.NEXT_PUBLIC_E2E === "true"',
  "process.env.NEXT_PUBLIC_E2E === 'true'",
  'process.env.NEXT_PUBLIC_DEBUG_TOOLS === "true"',
  "process.env.NEXT_PUBLIC_DEBUG_TOOLS === 'true'",
];

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!IGNORE_DIRS.has(entry.name)) walk(full, acc);
      continue;
    }
    if (ALLOWED_EXT.has(path.extname(entry.name))) {
      acc.push(full);
    }
  }
  return acc;
}

function hasAllowedGuard(lines, lineIndex) {
  const start = Math.max(0, lineIndex - 25);
  const context = lines.slice(start, lineIndex + 1).join('\n');
  return ALLOWED_GUARDS.some((g) => context.includes(g));
}

function main() {
  const files = walk(ROOT);
  const violations = [];

  for (const file of files) {
    const rel = path.relative(ROOT, file);

    // Allow E2E tests to mention testing globals.
    if (rel.startsWith('e2e/')) continue;
    if (rel.startsWith('scripts/')) continue;

    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split(/\r?\n/);

    lines.forEach((line, idx) => {
      if (!line.includes('window')) return;

      for (const token of FORBIDDEN_PATTERNS) {
        if (!line.includes(token)) continue;

        if (line.includes('delete (window as any)')) continue;

        if (!hasAllowedGuard(lines, idx)) {
          violations.push({
            file: rel,
            line: idx + 1,
            token,
            snippet: line.trim().slice(0, 180),
          });
        }
      }
    });
  }

  if (violations.length > 0) {
    console.error('❌ 生产暴露面扫描未通过（发现未受控测试/调试全局注入）:\n');
    violations.slice(0, 50).forEach((v) => {
      console.error(`- ${v.file}:${v.line} [${v.token}] ${v.snippet}`);
    });
    if (violations.length > 50) {
      console.error(`... 还有 ${violations.length - 50} 处`);
    }
    process.exit(1);
  }

  console.log('✅ 生产暴露面扫描通过（未发现未受控全局注入）');
}

main();
