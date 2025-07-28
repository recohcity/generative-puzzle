/**
 * Script to replace scattered console.log statements with unified logging service
 * Task 18: Replace scattered console.log statements
 */

const fs = require('fs');
const path = require('path');

class ConsoleLogReplacer {
  constructor() {
    this.replacements = [];
    this.errors = [];
    this.stats = {
      filesProcessed: 0,
      replacementsMade: 0,
      errorsFound: 0
    };
  }

  // Define replacement patterns for different console methods
  getReplacementPatterns() {
    return [
      {
        // console.log with context information
        pattern: /console\.log\(['"`]([^'"`]*)[^'"`]*['"`]\s*,\s*([^)]+)\)/g,
        replacement: (match, message, context) => {
          const component = this.extractComponent(match);
          return `${component}Logger.info('${message}', { ${context} })`;
        }
      },
      {
        // Simple console.log
        pattern: /console\.log\(['"`]([^'"`]*)[^'"`]*['"`]\)/g,
        replacement: (match, message) => {
          const component = this.extractComponent(match);
          return `${component}Logger.info('${message}')`;
        }
      },
      {
        // console.error with error object
        pattern: /console\.error\(['"`]([^'"`]*)[^'"`]*['"`]\s*,\s*([^)]+)\)/g,
        replacement: (match, message, errorObj) => {
          const component = this.extractComponent(match);
          return `${component}Logger.error('${message}', ${errorObj})`;
        }
      },
      {
        // Simple console.error
        pattern: /console\.error\(['"`]([^'"`]*)[^'"`]*['"`]\)/g,
        replacement: (match, message) => {
          const component = this.extractComponent(match);
          return `${component}Logger.error('${message}')`;
        }
      },
      {
        // console.warn
        pattern: /console\.warn\(['"`]([^'"`]*)[^'"`]*['"`]\)/g,
        replacement: (match, message) => {
          const component = this.extractComponent(match);
          return `${component}Logger.warn('${message}')`;
        }
      },
      {
        // console.debug
        pattern: /console\.debug\(['"`]([^'"`]*)[^'"`]*['"`]\)/g,
        replacement: (match, message) => {
          const component = this.extractComponent(match);
          return `${component}Logger.debug('${message}')`;
        }
      }
    ];
  }

  // Extract component name from file path or content
  extractComponent(content) {
    // Try to determine component from common patterns
    if (content.includes('DeviceManager') || content.includes('device')) return 'device';
    if (content.includes('AdaptationEngine') || content.includes('adaptation')) return 'adaptation';
    if (content.includes('PuzzleAdaptationService') || content.includes('puzzle')) return 'puzzle';
    if (content.includes('CanvasManager') || content.includes('canvas')) return 'canvas';
    if (content.includes('EventManager') || content.includes('event')) return 'event';
    if (content.includes('useCanvas')) return 'useCanvas';
    return 'logger'; // Default to main logger
  }

  // Process a single file
  processFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      let modifiedContent = content;
      let fileReplacements = 0;

      // Check if file already imports logger
      const hasLoggerImport = content.includes('from \'../utils/logger\'') || 
                             content.includes('from \'../../utils/logger\'') ||
                             content.includes('from \'../../../utils/logger\'');

      const patterns = this.getReplacementPatterns();
      
      patterns.forEach(({ pattern, replacement }) => {
        const matches = modifiedContent.match(pattern);
        if (matches) {
          modifiedContent = modifiedContent.replace(pattern, replacement);
          fileReplacements += matches.length;
        }
      });

      // Add logger import if replacements were made and import doesn't exist
      if (fileReplacements > 0 && !hasLoggerImport) {
        const importPath = this.getLoggerImportPath(filePath);
        const importStatement = `import { logger, deviceLogger, adaptationLogger, puzzleLogger, canvasLogger, eventLogger, useCanvasLogger } from '${importPath}';\n`;
        
        // Insert import after existing imports
        const importRegex = /(import.*from.*['"];?\n)+/;
        if (importRegex.test(modifiedContent)) {
          modifiedContent = modifiedContent.replace(importRegex, (match) => match + importStatement);
        } else {
          modifiedContent = importStatement + modifiedContent;
        }
      }

      // Write back if changes were made
      if (fileReplacements > 0) {
        fs.writeFileSync(filePath, modifiedContent);
        this.replacements.push({
          file: filePath,
          count: fileReplacements
        });
        this.stats.replacementsMade += fileReplacements;
      }

      this.stats.filesProcessed++;
      
      if (fileReplacements > 0) {
        console.log(`✅ ${filePath}: ${fileReplacements} replacements`);
      }

    } catch (error) {
      this.errors.push({
        file: filePath,
        error: error.message
      });
      this.stats.errorsFound++;
      console.log(`❌ ${filePath}: ${error.message}`);
    }
  }

  // Get appropriate import path for logger
  getLoggerImportPath(filePath) {
    const depth = filePath.split('/').length - 1;
    const prefix = '../'.repeat(depth);
    return `${prefix}utils/logger`;
  }

  // Process directory recursively
  processDirectory(dirPath, extensions = ['.ts', '.tsx']) {
    const items = fs.readdirSync(dirPath);
    
    items.forEach(item => {
      const itemPath = path.join(dirPath, item);
      const stat = fs.statSync(itemPath);
      
      if (stat.isDirectory()) {
        // Skip certain directories
        if (!['node_modules', '.git', 'dist', 'build', 'tests', 'docs'].includes(item)) {
          this.processDirectory(itemPath, extensions);
        }
      } else if (stat.isFile()) {
        const ext = path.extname(item);
        if (extensions.includes(ext)) {
          this.processFile(itemPath);
        }
      }
    });
  }

  // Generate report
  generateReport() {
    console.log('\n📋 Console.log Replacement Report');
    console.log('=================================');
    console.log(`Files processed: ${this.stats.filesProcessed}`);
    console.log(`Replacements made: ${this.stats.replacementsMade}`);
    console.log(`Errors encountered: ${this.stats.errorsFound}`);
    
    if (this.replacements.length > 0) {
      console.log('\n📝 Files with replacements:');
      this.replacements.forEach(({ file, count }) => {
        console.log(`  ${file}: ${count} replacements`);
      });
    }
    
    if (this.errors.length > 0) {
      console.log('\n❌ Errors:');
      this.errors.forEach(({ file, error }) => {
        console.log(`  ${file}: ${error}`);
      });
    }
    
    console.log(`\n${this.stats.errorsFound === 0 ? '🎉' : '⚠️'} Replacement ${this.stats.errorsFound === 0 ? 'completed successfully' : 'completed with errors'}`);
  }

  // Run the replacement process
  run() {
    console.log('🚀 Starting console.log replacement process...\n');
    
    // Process main directories
    const directories = [
      'core',
      'providers', 
      'hooks',
      'src',
      'scripts'
    ];
    
    directories.forEach(dir => {
      if (fs.existsSync(dir)) {
        console.log(`📁 Processing directory: ${dir}`);
        this.processDirectory(dir);
      }
    });
    
    this.generateReport();
    
    return this.stats.errorsFound === 0;
  }
}

// Manual replacement patterns for specific cases
const manualReplacements = [
  {
    file: 'providers/hooks/useAdaptation.ts',
    replacements: [
      {
        from: "console.error('Shape adaptation failed:', result.error);",
        to: "adaptationLogger.error('Shape adaptation failed', new Error(result.error));"
      },
      {
        from: "console.error('Puzzle adaptation failed:', result.error);",
        to: "puzzleLogger.error('Puzzle adaptation failed', new Error(result.error));"
      },
      {
        from: "console.error('Canvas size calculation failed:', result.error);",
        to: "canvasLogger.error('Canvas size calculation failed', new Error(result.error));"
      }
    ]
  },
  {
    file: 'providers/hooks/useCanvasEvents.ts',
    replacements: [
      {
        from: "console.log('📊 Performance stats:', {",
        to: "useCanvasLogger.debug('Performance stats', {"
      }
    ]
  }
];

// Apply manual replacements
function applyManualReplacements() {
  console.log('\n🔧 Applying manual replacements...');
  
  manualReplacements.forEach(({ file, replacements }) => {
    if (fs.existsSync(file)) {
      let content = fs.readFileSync(file, 'utf8');
      let changed = false;
      
      replacements.forEach(({ from, to }) => {
        if (content.includes(from)) {
          content = content.replace(from, to);
          changed = true;
          console.log(`✅ ${file}: Manual replacement applied`);
        }
      });
      
      if (changed) {
        fs.writeFileSync(file, content);
      }
    }
  });
}

// Main execution
if (require.main === module) {
  const replacer = new ConsoleLogReplacer();
  const success = replacer.run();
  
  applyManualReplacements();
  
  process.exit(success ? 0 : 1);
}

module.exports = { ConsoleLogReplacer, applyManualReplacements };