# cutGenerators 迁移指南

## 🎯 迁移概述

本指南帮助开发者从原版本`cutGenerators.ts`迁移到重构版本`cutGenerators-v2.ts`。

## 📦 API兼容性

### 完全兼容的API

```typescript
// 原版本调用方式
import { generateCuts } from 'utils/puzzle/cutGenerators';

// 新版本调用方式 - API完全一致
import { generateCuts } from 'utils/puzzle/cutGenerators-v2';

// 调用方式完全相同，无需修改
const cuts = generateCuts(shape, difficulty, type);
```

### 函数签名

```typescript
generateCuts(
  shape: Point[],           // 形状点数组
  difficulty: number,       // 难度级别 (1-8)
  type: "straight" | "diagonal"  // 切割类型
): CutLine[]               // 返回切割线数组
```

## 🔄 渐进式迁移策略

### 阶段1: 评估和准备

1. **运行兼容性测试**
   ```bash
   npm run test:unit -- --testPathPatterns="cutGenerators-compatibility"
   ```

2. **检查现有调用点**
   ```bash
   # 搜索所有使用cutGenerators的文件
   grep -r "from.*cutGenerators" src/
   ```

### 阶段2: 试点迁移

1. **选择低风险模块进行试点**
   ```typescript
   // 在测试环境中尝试新版本
   import { generateCuts } from 'utils/puzzle/cutGenerators-v2';
   ```

2. **运行对比测试**
   ```typescript
   // 同时运行两个版本进行对比
   const originalResult = generateCutsOriginal(shape, difficulty, type);
   const v2Result = generateCutsV2(shape, difficulty, type);
   
   // 验证结果质量相似
   console.log('Original:', originalResult.length);
   console.log('V2:', v2Result.length);
   ```

### 阶段3: 全面迁移

1. **批量替换导入语句**
   ```bash
   # 使用sed命令批量替换（谨慎使用）
   find src/ -name "*.ts" -exec sed -i 's/cutGenerators/cutGenerators-v2/g' {} \;
   ```

2. **运行完整测试套件**
   ```bash
   npm run test:unit
   npm run test:e2e
   ```

## 🛠️ 迁移检查清单

### 迁移前检查

- [ ] 备份现有代码
- [ ] 运行所有相关测试确保基线正常
- [ ] 确认V2版本测试全部通过
- [ ] 准备回滚计划

### 迁移过程检查

- [ ] 逐个文件进行迁移
- [ ] 每次迁移后运行测试
- [ ] 检查控制台是否有新的警告或错误
- [ ] 验证功能行为一致性

### 迁移后验证

- [ ] 运行完整测试套件
- [ ] 进行性能基准测试
- [ ] 检查内存使用情况
- [ ] 验证错误处理行为

## 🚨 注意事项

### 性能考虑

- V2版本可能在某些情况下比原版本稍慢（通常在可接受范围内）
- 如果性能是关键因素，请先进行基准测试
- 大多数情况下，性能差异可以忽略不计

### 错误处理

```typescript
// V2版本提供更详细的错误信息
try {
  const cuts = generateCuts(shape, difficulty, type);
} catch (error) {
  console.error('切割生成失败:', error.message);
  // V2版本的错误信息更加详细和有用
}
```

### 调试支持

```typescript
// V2版本提供更好的调试信息
const cuts = generateCuts(shape, difficulty, type);
// 检查控制台输出，V2版本提供更详细的生成过程信息
```

## 🔧 故障排除

### 常见问题

1. **导入错误**
   ```typescript
   // 错误
   import { generateCuts } from 'utils/puzzle/cutGenerators-v2.ts';
   
   // 正确
   import { generateCuts } from 'utils/puzzle/cutGenerators-v2';
   ```

2. **类型错误**
   ```typescript
   // 确保使用正确的类型
   import type { CutLine } from 'utils/puzzle/cutGeneratorTypes';
   ```

3. **性能问题**
   ```typescript
   // 如果遇到性能问题，可以临时回退到原版本
   import { generateCuts } from 'utils/puzzle/cutGenerators';
   ```

### 回滚策略

如果迁移过程中遇到问题：

1. **立即回滚**
   ```bash
   git checkout -- src/
   ```

2. **部分回滚**
   ```typescript
   // 只回滚有问题的文件
   import { generateCuts } from 'utils/puzzle/cutGenerators';
   ```

3. **报告问题**
   - 记录具体的错误信息
   - 提供复现步骤
   - 包含相关的测试用例

## 📊 迁移验证

### 功能验证脚本

```typescript
// 创建验证脚本
import { generateCuts as original } from 'utils/puzzle/cutGenerators';
import { generateCuts as v2 } from 'utils/puzzle/cutGenerators-v2';

const testShape = [
  { x: 0, y: 0 },
  { x: 100, y: 0 },
  { x: 100, y: 100 },
  { x: 0, y: 100 }
];

// 验证所有难度级别
for (let difficulty = 1; difficulty <= 8; difficulty++) {
  for (const type of ['straight', 'diagonal'] as const) {
    const originalResult = original(testShape, difficulty, type);
    const v2Result = v2(testShape, difficulty, type);
    
    console.log(`难度${difficulty}-${type}: 原版${originalResult.length}条, V2版${v2Result.length}条`);
  }
}
```

## 🎉 迁移完成

迁移完成后，你将获得：

- ✅ **更好的代码质量**: 模块化、可维护的代码结构
- ✅ **更强的类型安全**: 完整的TypeScript类型支持
- ✅ **更好的测试覆盖**: 全面的测试保障
- ✅ **更容易扩展**: 基于策略模式的可扩展架构
- ✅ **更好的调试体验**: 详细的日志和错误信息

---

**需要帮助？**
- 查看 `docs/cutGenerators-refactoring-report.md` 了解详细的重构信息
- 运行测试套件验证迁移结果
- 如有问题，可以随时回滚到原版本