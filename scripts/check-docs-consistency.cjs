#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const DOCS_DIR = path.join(ROOT, 'docs');

const CLAIM_PATTERN = /(✅完成|✅通过|通过（Pass）|验收结论：\*\*通过\*\*|全部标记完成)/;
const EVIDENCE_PATTERN = /`[^`]+\.(ts|tsx|js|cjs|mjs|yml|yaml|md)`|\b[a-zA-Z0-9_\-/]+\.(ts|tsx|js|cjs|mjs|yml|yaml|md):\d+/;

function getMarkdownFiles(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'archive') continue;
      getMarkdownFiles(full, acc);
      continue;
    }
    if (entry.name.endsWith('.md')) acc.push(full);
  }
  return acc;
}

function main() {
  if (!fs.existsSync(DOCS_DIR)) {
    console.log('ℹ️ 未发现 docs 目录，跳过文档一致性检查');
    process.exit(0);
  }

  const files = getMarkdownFiles(DOCS_DIR);
  const violations = [];

  for (const file of files) {
    const rel = path.relative(ROOT, file);
    const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!CLAIM_PATTERN.test(line)) continue;

      // 在声明附近（前后 20 行）寻找代码证据引用
      const start = Math.max(0, i - 5);
      const end = Math.min(lines.length, i + 21);
      const context = lines.slice(start, end).join('\n');

      if (!EVIDENCE_PATTERN.test(context)) {
        violations.push({
          file: rel,
          line: i + 1,
          claim: line.trim().slice(0, 160),
        });
      }
    }
  }

  if (violations.length > 0) {
    console.error('❌ 文档一致性检查未通过（存在无代码证据的完成性声明）:\n');
    violations.slice(0, 80).forEach((v) => {
      console.error(`- ${v.file}:${v.line} ${v.claim}`);
    });
    if (violations.length > 80) {
      console.error(`... 还有 ${violations.length - 80} 处`);
    }
    process.exit(1);
  }

  console.log('✅ 文档一致性检查通过（完成性声明均存在附近代码证据）');
}

main();
