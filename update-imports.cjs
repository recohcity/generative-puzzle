const fs = require('fs');
const path = require('path');

const projectRoot = __dirname;

function updateImports(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== '.next' && file !== 'game-core') {
        updateImports(fullPath);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;

      // Replace imports
      const replacements = [
        { regex: /@\/types\/puzzleTypes/g, replacement: '@generative-puzzle/game-core' },
        { regex: /@\/utils\/geometry\/puzzleGeometry/g, replacement: '@generative-puzzle/game-core' },
        { regex: /@\/utils\/score\/ScoreCalculator/g, replacement: '@generative-puzzle/game-core' },
        { regex: /@\/utils\/score\/RotationEfficiencyCalculator/g, replacement: '@generative-puzzle/game-core' },
      ];

      for (const r of replacements) {
        if (r.regex.test(content)) {
          content = content.replace(r.regex, r.replacement);
          changed = true;
        }
      }

      if (changed) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated: ${path.relative(projectRoot, fullPath)}`);
      }
    }
  }
}

['app', 'components', 'contexts', 'core', 'e2e', 'hooks', 'utils'].forEach(dir => {
  updateImports(path.join(projectRoot, dir));
});
