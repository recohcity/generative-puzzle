#!/usr/bin/env node

/**
 * 自动项目结构文档生成器
 * 扫描项目目录并生成标准格式的项目结构文档
 * 
 * 使用方法：
 * node scripts/generate-project-structure.js
 * 
 * 或添加到 package.json：
 * "generate-structure": "node scripts/generate-project-structure.js"
 */

const fs = require('fs').promises;
const path = require('path');

// 读取并解析 .gitignore 文件
async function loadGitignorePatterns() {
  try {
    const gitignoreContent = await fs.readFile('.gitignore', 'utf8');
    return gitignoreContent
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#')) // 过滤空行和注释
      .map(pattern => {
        // 处理 gitignore 模式
        if (pattern.endsWith('/')) {
          return pattern.slice(0, -1); // 移除末尾的 /
        }
        return pattern;
      });
  } catch (error) {
    console.warn('警告: 无法读取 .gitignore 文件，使用默认忽略规则');
    return [];
  }
}

// 检查路径是否匹配 gitignore 模式
function matchesGitignorePattern(filePath, pattern) {
  const fileName = path.basename(filePath);
  const relativePath = path.relative('.', filePath).replace(/\\/g, '/'); // 统一使用正斜杠
  
  // 处理否定模式 (以 ! 开头)
  if (pattern.startsWith('!')) {
    return false; // 否定模式需要特殊处理，这里先简化
  }
  
  // 处理以 / 开头的绝对路径模式
  if (pattern.startsWith('/')) {
    const cleanPattern = pattern.slice(1);
    if (cleanPattern.includes('*')) {
      const regex = new RegExp('^' + cleanPattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$');
      return regex.test(relativePath);
    }
    return relativePath === cleanPattern || relativePath.startsWith(cleanPattern + '/');
  }
  
  // 处理通配符模式
  if (pattern.includes('*')) {
    const regex = new RegExp(pattern.replace(/\*/g, '.*').replace(/\?/g, '.'));
    return regex.test(fileName) || regex.test(relativePath) || 
           relativePath.split('/').some(part => regex.test(part));
  }
  
  // 处理普通文件名或目录名匹配
  return fileName === pattern || 
         relativePath === pattern || 
         relativePath.startsWith(pattern + '/') ||
         relativePath.includes('/' + pattern + '/') ||
         relativePath.endsWith('/' + pattern) ||
         relativePath.split('/').includes(pattern);
}

// 配置
const CONFIG = {
  // 基础忽略的目录和文件（会与 .gitignore 合并）
  ignore: [
    'node_modules',
    '.git',
    '.DS_Store',
    '*.log',
    'Thumbs.db',
    '.vscode/settings.json', // 保留 .vscode 目录但忽略个人设置
    '.idea',
    '*.tmp',
    '*.temp'
  ],
  
  // 额外忽略的目录（即使 .gitignore 中没有也要忽略）
  alwaysIgnore: [
    '.git',
    'node_modules',
    '.DS_Store',
    'Thumbs.db'
  ],

  // 文件和目录描述
  descriptions: {
    // 根目录文件
    'package.json': '依赖、脚本和元数据配置',
    'package-lock.json': '依赖锁定文件，确保环境一致性',
    'README.md': '项目简介、安装、开发、测试、报告、贡献指南',
    'CHANGELOG.md': '版本历史与变更记录（已更新v1.3.37 重构2.0架构优化完成）',
    'tsconfig.json': 'TypeScript 编译配置',
    'tsconfig.build.tsbuildinfo': 'TypeScript 构建信息文件（自动生成）',
    'tsconfig.temp.tsbuildinfo': 'TypeScript 临时构建信息文件（自动生成）',
    'tsconfig.tsbuildinfo': 'TypeScript 构建信息文件（自动生成）',
    'next.config.mjs': 'Next.js 框架配置',
    'tailwind.config.ts': 'Tailwind CSS 主题与插件配置',
    'postcss.config.mjs': 'PostCSS 配置',
    'jest.config.js': 'Jest 单元测试配置',
    'playwright.config.ts': 'Playwright E2E 测试配置',
    'components.json': 'Shadcn UI 组件配置',
    'next-env.d.ts': 'Next.js 环境类型声明',
    '.gitignore': 'Git 忽略文件配置',
    '.DS_Store': 'macOS 目录缓存文件（可忽略）',
    'debug-iphone16-detection.ts': 'iPhone 16设备检测调试文件（v1.3.34新增）',
    'landscape-panel-width-fix.md': '横屏面板宽度修复文档（v1.3.34新增）',
    'mobile-adaptation-final-summary.md': '移动端适配最终总结（v1.3.34新增）',
    'mobile-adaptation-test.md': '移动端适配测试文档（v1.3.34新增）',
    'mobile-layout-fix-summary.md': '移动端布局修复总结（v1.3.34新增）',

    // 目录
    'src/': '源代码目录（v1.3.37重构2.0新增）',
    'src/config/': '统一配置管理目录（重构2.0核心成果）',
    'core/': '核心服务目录（v1.3.37重构2.0新增）',
    'app/': 'Next.js 应用目录',
    'components/': 'React 组件库',
    'constants/': '全局常量定义',
    'contexts/': '全局状态管理',
    'hooks/': '自定义 React 钩子',
    'lib/': '通用工具库目录',
    'types/': 'TypeScript 类型定义',
    'utils/': '核心算法与工具',
    'providers/': '统一架构提供者目录（v1.3.37新增）',
    'docs/': '项目文档',
    'e2e/': '端到端测试脚本',
    'scripts/': '自动化脚本目录',
    'tests/': '测试文件目录',
    'public/': '静态资源目录',
    'temp/': '临时开发和测试文件目录',

    // 核心文件
    'src/config/index.ts': '统一配置导出接口',
    'src/config/deviceConfig.ts': '设备检测配置统一管理',
    'src/config/adaptationConfig.ts': '适配参数配置统一管理',
    'src/config/performanceConfig.ts': '性能相关配置统一管理',
    'src/config/loggingConfig.ts': '日志配置统一管理',

    'core/LoggingService.ts': '统一日志服务，支持结构化日志和多级别输出',
    'core/ErrorHandlingService.ts': '统一错误处理服务，支持错误分类和自动恢复',
    'core/ErrorMonitoringService.ts': '错误监控服务，支持错误趋势分析',
    'core/ValidationService.ts': '输入验证服务，统一验证规则和错误消息',
    'core/DeviceManager.ts': '设备检测管理器，单例模式，统一管理所有设备检测逻辑',
    'core/CanvasManager.ts': '画布管理器，单例模式，统一管理画布状态和尺寸计算',
    'core/EventManager.ts': '事件管理器，单例模式，统一管理所有事件监听器',

    'app/page.tsx': 'Next.js 应用主页，动态导入核心游戏界面',
    'app/layout.tsx': '全局布局，集成 Context Providers',
    'app/globals.css': '全局 CSS 样式文件',

    'components/GameInterface.tsx': '核心游戏界面，按设备/方向分发布局，驱动画布与面板自适应，使用统一设备检测系统实现跨平台布局选择',
    'components/PuzzleCanvas.tsx': '主画布组件，100%适配父容器，使用统一的设备检测、画布管理和事件系统（v1.3.33重构：迁移到统一架构，移除本地状态管理；v1.3.34优化：移动端画布尺寸计算优化）',
    'components/ActionButtons.tsx': '游戏操作按钮组件，使用统一设备检测系统（v1.3.33重构：迁移到useDevice()）',
    'components/RestartButton.tsx': '重新开始按钮组件',
    'components/ShapeControls.tsx': '基础形状选择组件，使用统一设备检测系统（v1.3.33重构：迁移到useDevice()）',
    'components/PuzzleControlsCutCount.tsx': '切片数量控制组件，使用统一设备检测系统（v1.3.33重构：迁移到useDevice()）',
    'components/PuzzleControlsCutType.tsx': '切片类型控制组件，使用统一设备检测系统（v1.3.33重构：迁移到useDevice()）',
    'components/PuzzleControlsGamepad.tsx': '游戏手柄控制组件，使用统一设备检测系统（v1.3.33重构：迁移到useDevice()）',
    'components/PuzzleControlsScatter.tsx': '拼图散布范围控制组件，使用统一设备检测系统（v1.3.33重构：迁移到useDevice()）',
    'components/GlobalUtilityButtons.tsx': '音乐开关、全屏切换等全局工具按钮',
    'components/UnifiedSystemDemo.tsx': '统一系统演示组件（v1.3.37新增）',
    'components/DesktopPuzzleSettings.tsx': '桌面端游戏设置面板（已适配新形状生成逻辑）',
    'components/EnvModeClient.tsx': '环境模式客户端组件，处理开发/生产环境差异',
    'components/ResponsiveBackground.tsx': '响应式背景组件，使用统一设备检测系统（v1.3.33重构：迁移到useDevice()）',
    'components/layouts/DesktopLayout.tsx': '桌面端布局，使用统一画布管理系统（v1.3.33重构：迁移到useCanvas()）',
    'components/layouts/PhoneLandscapeLayout.tsx': '手机横屏布局，使用统一画布管理系统（v1.3.33重构：迁移到useCanvas()；v1.3.34优化：智能面板宽度计算，优先使用画布尺寸确保显示完整）',
    'components/layouts/PhonePortraitLayout.tsx': '手机竖屏布局，使用统一画布管理系统（v1.3.33重构：迁移到useCanvas()；v1.3.34优化：直接使用适配常量计算画布尺寸，解决大缩小动态显示问题）',
    'components/layouts/PhoneTabPanel.tsx': '移动端Tab面板集中管理组件，负责tab切换、内容区像素级布局、与全局状态同步，tab与画布高度联动',
    'components/animate-ui/backgrounds/bubble.tsx': '动态气泡背景特效组件，提升美术体验',
    'components/loading/LoadingScreen.tsx': '动态加载动画',
    'components/theme-provider.tsx': '主题切换 Context Provider',

    'contexts/GameContext.tsx': '核心状态管理中心，useReducer 管理全局游戏状态，集中管理画布尺寸、scale、orientation、previousCanvasSize，驱动所有自适应逻辑，自动挂载 window.testAPI（测试环境下）；v1.3.33重构：增强统一架构支持，优化状态管理性能；v1.3.34优化：支持移动端跨平台状态管理',

    // hooks目录
    'hooks/usePuzzleInteractions.ts': '拼图交互逻辑钩子（拖拽、旋转、吸附、回弹、音效等）',
    'hooks/useResponsiveCanvasSizing.ts': '响应式画布尺寸管理钩子，监听resize/orientationchange/ResizeObserver，原子性更新状态，驱动下游适配',
    'hooks/useDeviceDetection.ts': '设备/方向检测钩子',
    'hooks/usePuzzleAdaptation.ts': '拼图状态适配钩子（随画布尺寸/方向变化，专门处理散开拼图；v1.3.31注意：已在PuzzleCanvas中禁用以避免Hook冲突）',
    'hooks/useShapeAdaptation.ts': '形状适配钩子（Step2新增，基于拓扑记忆系统的智能形状适配；Step3扩展，支持拼图块同步适配；v1.3.31增强：统一处理散开拼图适配，避免Hook冲突）',
    'hooks/useDebugToggle.ts': '调试模式切换钩子（F10）',
    'hooks/use-mobile.tsx': '移动端检测钩子',
    'hooks/use-toast.ts': '弹窗提示钩子',

    // constants目录
    'constants/canvasAdaptation.ts': '画布适配常量定义，包含iPhone 16全系列检测函数、桌面端/移动端适配参数、三层检测机制等核心适配逻辑；v1.3.34增强：完善移动端竖屏/横屏画布尺寸计算算法，支持智能面板宽度计算',

    // types目录
    'types/global.d.ts': '全局类型声明',
    'types/puzzleTypes.ts': '核心业务类型定义（GameState、PuzzlePiece、CutType 等）',
    'types/common.ts': '通用类型定义（Point、CanvasSize、BoundingBox 等）',
    'types/memory.ts': '记忆系统类型定义（Step2新增，拓扑记忆相关类型）',

    // utils目录
    'utils/constants.ts': '全局常量定义',
    'utils/helper.ts': '通用辅助函数',
    'utils/logger.ts': '日志工具函数（v1.3.37新增）',
    'utils/puzzlePieceAdaptationUtils.ts': '拼图块适配工具函数（Step3新增，绝对坐标适配算法）',

    // utils子目录
    'utils/geometry/puzzleGeometry.ts': '拼图块吸附、对齐等几何计算函数',
    'utils/memory/MemoryManager.ts': '记忆管理器，系统协调器',
    'utils/memory/AdaptationEngine.ts': '核心适配引擎，毫秒级高性能适配',
    'utils/memory/AdaptationRuleEngine.ts': '规则执行引擎',
    'utils/memory/AdaptationRules.ts': '智能适配规则集（30%直径规则、精确居中等）',
    'utils/memory/MemoryStorage.ts': '记忆存储系统',
    'utils/memory/TopologyExtractor.ts': '拓扑结构提取器，基于形状结构的记忆机制',
    'utils/memory/CoordinateCleaner.ts': '坐标清理机制',
    'utils/memory/memoryUtils.ts': '记忆系统工具函数集',
    'utils/puzzle/PuzzleGenerator.ts': '基础形状切割为拼图块的主逻辑',
    'utils/puzzle/cutGenerators.ts': '不同切割算法定义',
    'utils/puzzle/puzzleUtils.ts': '拼图相关通用辅助函数',
    'utils/puzzle/ScatterPuzzle.ts': '拼图块散布算法',
    'utils/rendering/colorUtils.ts': '颜色处理工具',
    'utils/rendering/puzzleDrawing.ts': 'Canvas 上绘制拼图块的函数，支持材质纹理填充与层级优化',
    'utils/rendering/soundEffects.ts': '音效播放函数',
    'utils/shape/ShapeGenerator.ts': '生成多边形、曲线等基础形状',
    'utils/shape/geometryUtils.ts': '形状相关几何计算函数',
    'utils/shape/shapeAdaptationUtils.ts': '形状适配工具函数（Step2新增）',
    'utils/adaptation/UnifiedAdaptationEngine.ts': '统一适配引擎，支持形状、拼图块、散开拼图的统一适配处理（v1.3.31增强：添加详细的NaN检测和错误处理机制，解决Hook冲突导致的坐标异常问题）',

    'providers/SystemProvider.tsx': '系统级提供者，统一管理全局状态和服务',
    'providers/hooks/useDevice.ts': '设备检测Hook，统一设备状态管理',
    'providers/hooks/useCanvas.ts': '画布管理Hook，统一画布状态和尺寸计算',

    'public/bg.jpg': '游戏背景图片（桌面端）',
    'public/bg-mobile-landscape.png': '移动端横屏背景图片（v1.3.34新增）',
    'public/bg-mobile-portrait.png': '移动端竖屏背景图片（v1.3.34新增）',
    'public/puzzle-pieces.mp3': '游戏音效文件',
    'public/texture-tile.png': '瓷砖气孔材质纹理，用于拼图块和目标形状的美术填充',

    // scripts目录
    'scripts/archive-test-results.js': 'E2E 测试后自动归档性能数据，生成 Markdown/JSON 报告',
    'scripts/cleanup-code.js': '代码清理检查脚本（v1.3.37新增），系统性检查代码质量问题，生成清理建议报告',
    'scripts/run-comprehensive-tests.js': '综合测试运行脚本（v1.3.37新增），支持功能测试、性能测试、质量评估',
    'scripts/generate-project-structure.js': '自动项目结构文档生成器（v1.3.37新增），扫描项目目录并生成标准格式的项目结构文档',

    // e2e目录
    'e2e/full_game_flow.spec.ts': '主流程 E2E 测试脚本，自动识别开发/生产环境，报告链路全自动，支持模式分组、对比、差异高亮',

    // lib目录
    'lib/utils.ts': '通用工具函数（如 Tailwind 类名合并）'
  },

  // 输出配置
  output: {
    path: 'docs/project_structure.md',
    includeStats: true,
    markIgnoredDirs: true // 标记被gitignore管理的目录
  },

  // 扫描配置
  maxDepth: 8,
  includeHidden: false
};

// 工具函数
function shouldIgnore(filePath, ignorePatterns, gitignorePatterns = []) {
  const fileName = path.basename(filePath);
  const relativePath = path.relative('.', filePath);
  
  // 检查基础忽略规则
  const matchesBasicIgnore = ignorePatterns.some(pattern => {
    if (pattern.includes('*')) {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return regex.test(fileName) || regex.test(relativePath);
    }
    return fileName === pattern || relativePath === pattern || relativePath.startsWith(pattern + '/');
  });
  
  if (matchesBasicIgnore) return true;
  
  // 检查 gitignore 规则
  const matchesGitignore = gitignorePatterns.some(pattern => 
    matchesGitignorePattern(filePath, pattern)
  );
  
  if (matchesGitignore) return true;
  
  // 检查总是忽略的规则
  return CONFIG.alwaysIgnore.some(pattern => {
    return fileName === pattern || relativePath === pattern || relativePath.startsWith(pattern + '/');
  });
}

function getFileCategory(filePath) {
  const ext = path.extname(filePath);
  const fileName = path.basename(filePath);
  const relativePath = path.relative('.', filePath);

  // 配置文件
  if (/\.(json|yaml|yml|toml|config\.(js|ts|mjs))$/.test(fileName) ||
    /^\..*rc$/.test(fileName) ||
    fileName.includes('.config.')) {
    return 'config';
  }

  // 源代码
  if (/\.(js|ts|jsx|tsx|vue|svelte)$/.test(ext)) {
    return 'source';
  }

  // 样式文件
  if (/\.(css|scss|sass|less|styl)$/.test(ext)) {
    return 'style';
  }

  // 文档
  if (/\.(md|txt|rst|adoc)$/.test(ext)) {
    return 'docs';
  }

  // 测试文件
  if (/\.(test|spec)\.(js|ts|jsx|tsx)$/.test(fileName) || relativePath.includes('test')) {
    return 'test';
  }

  // 自动生成
  if (relativePath.startsWith('dist/') ||
    relativePath.startsWith('build/') ||
    relativePath.startsWith('.next/') ||
    fileName.includes('.tsbuildinfo')) {
    return 'generated';
  }

  return 'other';
}

function sortNodes(a, b) {
  // 目录优先
  if (a.type !== b.type) {
    return a.type === 'directory' ? -1 : 1;
  }

  // 重要文件优先
  const importantFiles = ['package.json', 'README.md', 'CHANGELOG.md', 'tsconfig.json'];
  const aImportant = importantFiles.includes(a.name);
  const bImportant = importantFiles.includes(b.name);

  if (aImportant !== bImportant) {
    return aImportant ? -1 : 1;
  }

  // 字母顺序
  return a.name.localeCompare(b.name);
}

// 核心扫描函数
async function scanDirectory(dirPath, config, currentDepth = 0, gitignorePatterns = []) {
  if (currentDepth >= config.maxDepth) {
    return [];
  }

  try {
    const items = await fs.readdir(dirPath, { withFileTypes: true });
    const nodes = [];

    for (const item of items) {
      const fullPath = path.join(dirPath, item.name);

      if (shouldIgnore(fullPath, config.ignore, gitignorePatterns)) {
        continue;
      }

      if (!config.includeHidden && item.name.startsWith('.') && item.name !== '.gitignore') {
        continue;
      }

      const node = {
        name: item.name,
        path: fullPath,
        type: item.isDirectory() ? 'directory' : 'file',
        category: getFileCategory(fullPath)
      };

      if (item.isDirectory()) {
        node.children = await scanDirectory(fullPath, config, currentDepth + 1, gitignorePatterns);
      } else {
        try {
          const stats = await fs.stat(fullPath);
          node.size = stats.size;
          node.modified = stats.mtime;
        } catch (err) {
          // 忽略无法访问的文件
        }
      }

      nodes.push(node);
    }

    return nodes.sort(sortNodes);
  } catch (err) {
    console.warn(`警告: 无法扫描目录 ${dirPath}: ${err.message}`);
    return [];
  }
}

// 生成根目录结构（按原版本格式）
function generateRootDirectorySection(nodes, gitignorePatterns = []) {
  let result = '';
  
  // 根目录分组
  const groups = {
    config: {
      title: '### 配置文件',
      files: [],
      dirs: []
    },
    core: {
      title: '### 核心目录',
      files: [],
      dirs: []
    },
    unified: {
      title: '### 统一架构系统',
      files: [],
      dirs: []
    },
    docs: {
      title: '### 文档与测试',
      files: [],
      dirs: []
    },
    temp: {
      title: '### 临时开发目录',
      files: [],
      dirs: []
    },
    static: {
      title: '### 静态资源',
      files: [],
      dirs: []
    },
    generated: {
      title: '### 自动生成目录',
      files: [],
      dirs: []
    }
  };
  
  // 分类根目录下的文件和目录
  for (const node of nodes) {
    const description = CONFIG.descriptions[node.name] || CONFIG.descriptions[node.path] || '';
    const descText = description ? `：${description}` : '';
    
    // 检查gitignore标记
    let gitignoreNote = '';
    if (CONFIG.output.markIgnoredDirs && node.type === 'directory') {
      const isContentIgnored = gitignorePatterns.some(pattern => {
        return pattern === `/${node.name}/*` || pattern === `${node.name}/*`;
      });
      if (isContentIgnored) {
        gitignoreNote = ' (内容被gitignore管理)';
      }
    }
    
    const item = `- \`${node.name}\`${descText}${gitignoreNote}`;
    
    // 根据文件/目录名称分组
    if (node.type === 'file') {
      if (/\.(json|mjs|ts|js|md)$/.test(node.name) || node.name.startsWith('.')) {
        groups.config.files.push(item);
      }
    } else {
      // 目录分组
      if (['src', 'core', 'app', 'components', 'constants', 'contexts', 'hooks', 'lib', 'types', 'utils'].includes(node.name)) {
        const dirItem = `- \`${node.name}/\`${descText}${gitignoreNote}（见下）`;
        groups.core.dirs.push(dirItem);
        
        // 添加子目录详情
        if (node.children && node.children.length > 0) {
          const subItems = generateSubDirectoryItems(node.children, 1);
          if (subItems) {
            groups.core.dirs.push(subItems);
          }
        }
      } else if (['providers'].includes(node.name)) {
        const dirItem = `- \`${node.name}/\`${descText}${gitignoreNote}`;
        groups.unified.dirs.push(dirItem);
        if (node.children && node.children.length > 0) {
          const subItems = generateSubDirectoryItems(node.children, 1);
          if (subItems) {
            groups.unified.dirs.push(subItems);
          }
        }
      } else if (['docs', 'e2e', 'scripts', 'tests'].includes(node.name)) {
        const dirItem = `- \`${node.name}/\`${descText}${gitignoreNote}（见下）`;
        groups.docs.dirs.push(dirItem);
      } else if (['temp'].includes(node.name)) {
        const dirItem = `- \`${node.name}/\`${descText}${gitignoreNote}`;
        groups.temp.dirs.push(dirItem);
        if (node.children && node.children.length > 0) {
          const subItems = generateSubDirectoryItems(node.children, 1);
          if (subItems) {
            groups.temp.dirs.push(subItems);
          }
        }
      } else if (['public'].includes(node.name)) {
        const dirItem = `- \`${node.name}/\`${descText}${gitignoreNote}（见下）`;
        groups.static.dirs.push(dirItem);
      } else if (['debug-log', 'playwright-report', 'playwright-test-logs', 'test-results', 'node_modules', '.next', '.vscode', '.kiro', '.git'].includes(node.name)) {
        const dirItem = `- \`${node.name}/\`${descText}${gitignoreNote}`;
        groups.generated.dirs.push(dirItem);
      }
    }
  }
  
  // 生成分组内容
  for (const [key, group] of Object.entries(groups)) {
    if (group.files.length > 0 || group.dirs.length > 0) {
      result += `${group.title}\n`;
      group.files.forEach(item => result += `${item}\n`);
      group.dirs.forEach(item => result += `${item}\n`);
      result += '\n';
    }
  }
  
  return result;
}

// 生成子目录项目
function generateSubDirectoryItems(nodes, level) {
  let result = '';
  const indent = '  '.repeat(level);
  
  for (const node of nodes) {
    const description = CONFIG.descriptions[node.path] || CONFIG.descriptions[node.name] || '';
    const descText = description ? `：${description}` : '';
    
    result += `${indent}- \`${node.name}\`${descText}\n`;
    
    if (node.children && node.children.length > 0 && level < 2) {
      result += generateSubDirectoryItems(node.children, level + 1);
    }
  }
  
  return result;
}

// 生成详细目录结构（用于各个主要目录的详细说明）
function generateDetailedDirectorySection(nodes, targetDir) {
  const targetNode = nodes.find(node => node.name === targetDir);
  if (!targetNode || !targetNode.children) return '';
  
  let result = `## ${targetDir}/\n`;
  
  // 添加目录级别的描述
  const dirDescription = CONFIG.descriptions[targetDir + '/'] || CONFIG.descriptions[targetDir];
  if (dirDescription) {
    result += `${dirDescription}\n\n`;
  }
  
  // 生成子项目
  result += generateSubDirectoryItems(targetNode.children, 0);
  result += '\n---\n\n';
  
  return result;
}

function generateCategorySection(nodes) {
  const categories = {};

  function collectFiles(nodes, parentPath = '') {
    for (const node of nodes) {
      const fullPath = parentPath ? `${parentPath}/${node.name}` : node.name;

      if (node.type === 'file') {
        const category = node.category;
        if (!categories[category]) {
          categories[category] = [];
        }

        const description = CONFIG.descriptions[fullPath] || CONFIG.descriptions[node.name] || '';
        categories[category].push({
          path: fullPath,
          description
        });
      }

      if (node.children) {
        collectFiles(node.children, fullPath);
      }
    }
  }

  collectFiles(nodes);

  let result = '';
  const categoryNames = {
    config: '📋 配置文件',
    source: '💻 源代码',
    style: '🎨 样式文件',
    docs: '📚 文档',
    test: '🧪 测试文件',
    generated: '🔄 自动生成',
    other: '📄 其他文件'
  };

  for (const [category, files] of Object.entries(categories)) {
    if (files.length === 0) continue;

    result += `### ${categoryNames[category] || category}\n\n`;

    for (const file of files.sort((a, b) => a.path.localeCompare(b.path))) {
      const desc = file.description ? `：${file.description}` : '';
      result += `- \`${file.path}\`${desc}\n`;
    }

    result += '\n';
  }

  return result;
}

function calculateStats(nodes) {
  let totalFiles = 0;
  let totalDirectories = 0;
  let totalSize = 0;
  let lastModified = new Date(0);

  function traverse(nodes) {
    for (const node of nodes) {
      if (node.type === 'directory') {
        totalDirectories++;
        if (node.children) {
          traverse(node.children);
        }
      } else {
        totalFiles++;
        if (node.size) {
          totalSize += node.size;
        }
        if (node.modified && node.modified > lastModified) {
          lastModified = node.modified;
        }
      }
    }
  }

  traverse(nodes);

  return {
    totalFiles,
    totalDirectories,
    totalSize: formatBytes(totalSize),
    lastModified: lastModified.toLocaleString('zh-CN')
  };
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 主函数
async function main() {
  try {
    console.log('🚀 开始生成项目结构文档...');
    
    // 加载 .gitignore 规则
    const gitignorePatterns = await loadGitignorePatterns();
    console.log(`✅ 已加载 ${gitignorePatterns.length} 条 .gitignore 规则`);

    // 扫描目录
    const fileTree = await scanDirectory('.', CONFIG, 0, gitignorePatterns);
    console.log('✅ 目录扫描完成');

    // 计算统计信息
    const stats = calculateStats(fileTree);

    // 生成文档内容
    const generatedTime = new Date().toLocaleString('zh-CN');
    // 不再需要这个变量，因为我们使用新的格式
    const categorySection = generateCategorySection(fileTree);

    const document = `# 项目结构（Project Structure）
> 自动生成时间：${generatedTime}
> 生成工具：自动项目结构文档生成器 v1.0.0 (Auto Project Structure Generator)
> 
> **自动化更新**：本文档由脚本自动生成，严格对照实际项目目录结构。修正了以下特性：
> - 自动读取并应用 .gitignore 规则（已加载 ${gitignorePatterns.length} 条规则）
> - 智能标记被gitignore管理的目录
> - 实时统计项目文件和目录数量
> - 按功能分组组织目录结构
> - 详细的文件描述和版本信息

本文件严格对照实际目录结构，分层列出每个目录和主要文件，并为每个文件写明一句简要用途。每次目录变更后运行 \`npm run generate-structure\` 即可更新。

---

## 根目录

${generateRootDirectorySection(fileTree, gitignorePatterns)}

---

${generateDetailedDirectorySection(fileTree, 'app')}

${generateDetailedDirectorySection(fileTree, 'components')}

${generateDetailedDirectorySection(fileTree, 'contexts')}

${generateDetailedDirectorySection(fileTree, 'hooks')}

${generateDetailedDirectorySection(fileTree, 'constants')}

${generateDetailedDirectorySection(fileTree, 'types')}

${generateDetailedDirectorySection(fileTree, 'utils')}

${generateDetailedDirectorySection(fileTree, 'lib')}

${generateDetailedDirectorySection(fileTree, 'public')}

${generateDetailedDirectorySection(fileTree, 'scripts')}

${generateDetailedDirectorySection(fileTree, 'e2e')}

${generateDetailedDirectorySection(fileTree, 'docs')}

${generateDetailedDirectorySection(fileTree, 'tests')}

## 📱 移动端适配统一架构 (v1.3.34)

### 跨平台统一管理策略
- **统一设备检测API**: \`useDevice()\` 支持所有设备类型，返回 deviceType、layoutMode、screenWidth、screenHeight 等统一信息
- **智能布局选择**: 基于设备类型自动选择 DesktopLayout、PhonePortraitLayout、PhoneLandscapeLayout
- **统一画布管理**: \`useCanvas()\` 根据设备类型选择不同的画布尺寸计算策略

### 移动端适配核心特性
- **竖屏模式**: 画布按屏幕宽度适配，保持正方形，画布居上，tab面板居下
- **横屏模式**: 画布按屏幕高度适配，保持正方形，左侧tab面板，右侧画布
- **智能面板宽度**: 横屏模式面板宽度智能计算，优先使用画布尺寸确保显示完整
- **iPhone 16系列优化**: 全系列5个机型的精确检测和针对性适配

### 设备检测优先级
1. **用户代理检测** (isIOS || isAndroid) - 最高优先级
2. **iPhone 16系列精确检测** - 特殊优化
3. **触摸设备 + 屏幕特征检测** - 综合判断
4. **传统屏幕尺寸检测** - 兜底方案

### 移动端性能优化
- **事件监听器优化**: 从分散的resize监听器整合到3个全局监听器
- **内存使用优化**: 设备状态缓存，画布尺寸缓存，事件防抖
- **触摸事件优化**: 集中化触摸事件处理，避免重复监听

---

## 🏆 项目重要里程碑

### ✅ Step1: 画布适配系统完成 (v1.3.27)
- iPhone 16全系列精确适配，空间利用率92-95%
- 桌面端超宽屏支持，移动端Tab面板优化
- 三层检测机制，响应式布局系统完善

### ✅ Step2: 智能形状适配系统完成 (v1.3.29)
- **拓扑记忆机制**：基于形状结构而非坐标的创新记忆系统
- **30%直径规则**：确保形状在任何画布上都有合适的大小比例
- **无限循环修复**：从200+条日志减少到2条，彻底解决React依赖链循环
- **高性能优化**：记忆创建0.1-6ms，适配执行0.02-3ms，并发处理50次/24ms

### ✅ Step3: 拼图块适配系统完成 (v1.3.30)
- **绝对坐标适配算法**：创新性地实现基于画布中心的绝对坐标适配，彻底解决累积误差问题
- **画布中心基准点统一**：拼图块与目标形状使用相同的画布中心作为变换基准，实现像素级精确对齐
- **智能状态检测机制**：区分未散开拼图块的适配场景，避免与散开拼图适配系统产生冲突

### ✅ Step4: 散开拼图适配系统完成 (v1.3.31)
- **Hook冲突问题彻底修复**：解决usePuzzleAdaptation和useShapeAdaptation冲突导致的拼图不可见问题
- **统一适配引擎集成**：所有拼图适配统一由useShapeAdaptation中的适配引擎处理，避免数据竞争
- **窗口调整可见性保障**：散开拼图在任意窗口尺寸调整后都保持可见和可交互

### ✅ Step5: 统一架构重构完成 (v1.3.33)
- **架构冲突根本解决**：彻底解决3套设备检测、4套画布管理、多套适配逻辑的冲突问题
- **核心管理器系统**：实现DeviceManager、CanvasManager、EventManager、AdaptationEngine四大核心管理器
- **组件全面迁移**：所有控制组件、布局组件成功迁移到统一系统，代码重复度降低70%

### ✅ Step6: 移动端适配完善 (v1.3.34)
- **竖屏适配问题彻底解决**：修复画布和tab面板大缩小动态显示问题，画布按屏幕宽度适配，保持正方形
- **横屏适配问题彻底解决**：修复设备误识别和面板显示不完整问题，优化设备检测逻辑，优先使用用户代理检测
- **智能面板宽度计算**：横屏模式面板宽度智能计算，优先使用画布尺寸确保显示完整

### ✅ Step7: 统一适配系统架构完善 (v1.3.35)
- **适配系统冲突根本解决**：识别并解决多个适配系统并行运行导致的拼图元素不一致问题
- **统一变换矩阵实现**：所有拼图元素（已完成、未完成、提示区域）使用相同的缩放和偏移计算
- **重复适配系统清理**：移除冲突的usePuzzleAdaptation调用，只保留统一适配引擎

### ✅ Step8: 桌面端画布居中修复完成 (v1.3.36)
- **无限循环问题根本性修复**：彻底解决适配系统双重Hook循环依赖问题
- **手动适配机制创新**：摆脱复杂Hook系统，实现精确的画布适配控制
- **累积缩放错误修复**：使用useRef记录状态，避免多次窗口调整的累积错误

### ✅ Step9: 重构2.0架构优化完成 (v1.3.37)
- **渐进式优化成功**：在重构1.0的95分基础上，通过24个系统性任务实现87.5%优化完成度
- **系统质量提升**：从95分提升到97分，在高质量系统基础上的稳步改善
- **配置统一管理**：建立src/config/统一配置体系，90%完成度，消除70%配置重复
- **错误处理统一**：建立完整的LoggingService、ErrorHandlingService、ErrorMonitoringService体系，95%统一性

---

## 📊 项目统计

- **总文件数**：${stats.totalFiles}
- **总目录数**：${stats.totalDirectories}
- **项目大小**：${stats.totalSize}
- **最后修改**：${stats.lastModified}
- **Gitignore规则**：${gitignorePatterns.length} 条

---

## 📝 说明

- 🔄 **自动生成**：本文档由脚本自动生成，请勿手动编辑
- 📁 **描述完整**：重要文件和目录已添加详细说明
- 🚫 **智能过滤**：已忽略临时文件、构建产物和不重要文件
- ⚡ **实时同步**：运行 \\\`npm run generate-structure\\\` 即可更新文档
- 🏷️ **状态标记**：自动标记被gitignore管理的目录

### 更新方法

\\\`\\\`\\\`bash
# 手动更新
npm run generate-structure

# 或直接运行脚本
node scripts/generate-project-structure.js
\\\`\\\`\\\`

### 配置说明

文件描述和忽略规则可在 \\\`scripts/generate-project-structure.js\\\` 中的 \\\`CONFIG\\\` 对象中修改。

---

*文档生成时间：${generatedTime}*`;
`;

    // 写入文件
    await fs.writeFile(CONFIG.output.path, document, 'utf8');

    console.log(`✅ 文档已生成：${CONFIG.output.path}`);
    console.log('\n📊 生成统计：');
    console.log(`   文件总数：${stats.totalFiles}`);
    console.log(`   目录总数：${stats.totalDirectories}`);
    console.log(`   文档大小：${document.length} 字符`);
    console.log(`   项目大小：${stats.totalSize}`);

  } catch (error) {
    console.error('❌ 生成失败：', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = { main, CONFIG };