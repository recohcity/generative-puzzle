#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const targetFile = path.join(process.cwd(), 'contexts', 'GameContext.tsx');

function extractReducerBody(source) {
  const startToken = 'function gameReducer(';
  const start = source.indexOf(startToken);
  if (start === -1) return null;

  const bodyStart = source.indexOf('{', start);
  if (bodyStart === -1) return null;

  let depth = 0;
  for (let i = bodyStart; i < source.length; i++) {
    const ch = source[i];
    if (ch === '{') depth++;
    if (ch === '}') depth--;
    if (depth === 0) {
      return source.slice(bodyStart, i + 1);
    }
  }
  return null;
}

function main() {
  if (!fs.existsSync(targetFile)) {
    console.error('❌ 未找到目标文件:', targetFile);
    process.exit(1);
  }

  const content = fs.readFileSync(targetFile, 'utf8');
  const reducerBody = extractReducerBody(content);

  if (!reducerBody) {
    console.error('❌ 无法解析 gameReducer 函数体');
    process.exit(1);
  }

  const rules = [
    {
      id: 'NO_GAMEDATAMANAGER_IN_REDUCER',
      regex: /GameDataManager\./g,
      message: 'Reducer 内禁止使用 GameDataManager.*（I/O副作用）',
    },
    {
      id: 'NO_DYNAMIC_REQUIRE_IN_REDUCER',
      regex: /require\s*\(/g,
      message: 'Reducer 内禁止动态 require()',
    },
    {
      id: 'NO_SCATTER_RECOMPUTE_IN_REDUCER',
      regex: /ScatterPuzzle\.scatterPuzzle\s*\(/g,
      message: 'Reducer 内禁止执行 ScatterPuzzle.scatterPuzzle() 重计算',
    },
  ];

  const violations = [];

  for (const rule of rules) {
    const matches = [...reducerBody.matchAll(rule.regex)];
    if (matches.length > 0) {
      violations.push({
        rule: rule.id,
        message: rule.message,
        count: matches.length,
      });
    }
  }

  if (violations.length > 0) {
    console.error('❌ Reducer 纯度扫描未通过:\n');
    for (const v of violations) {
      console.error(`- [${v.rule}] ${v.message}，命中 ${v.count} 次`);
    }
    process.exit(1);
  }

  console.log('✅ Reducer 纯度扫描通过');
}

main();
