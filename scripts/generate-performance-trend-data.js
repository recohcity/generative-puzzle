const fse = require('fs-extra');
const path = require('path');
const dayjs = require('dayjs');

const logsDir = path.join(__dirname, '../playwright-test-logs');
const outputFile = path.join(logsDir, 'performance_trend_data.json');

async function main() {
  const files = (await fse.readdir(logsDir)).filter(f => f.startsWith('test-report-') && f.endsWith('.md'));
  const all = [];
  for (const file of files) {
    const content = await fse.readFile(path.join(logsDir, file), 'utf-8');
    const match = content.match(/<!--\s*([\s\S]*?)\s*-->/);
    if (match && match[1]) {
      try {
        const meta = JSON.parse(match[1]).data;
        const m = meta.metrics || {};
        const s = meta.scenario || {};
        all.push({
          time: dayjs(meta.timestamp).format('YYYY-MM-DD HH:mm'),
          status: meta.status,
          count: s.pieceCount,
          loadTime: m.loadTime,
          shapeGenerationTime: m.shapeGenerationTime,
          puzzleGenerationTime: m.puzzleGenerationTime,
          scatterTime: m.scatterTime,
          avgInteractionTime: m.avgInteractionTime,
          fps: m.avgFps,
          memoryUsage: m.memoryUsage,
          shapeType: s.shapeType,
          cutType: s.cutType,
          cutCount: s.cutCount
        });
      } catch (e) {
        console.error('Parse error in', file, e);
      }
    }
  }
  all.sort((a, b) => new Date(a.time) - new Date(b.time));
  await fse.writeJson(outputFile, all, { spaces: 2 });
  console.log('Performance trend data generated:', outputFile);
}

if (require.main === module) {
  main();
} 