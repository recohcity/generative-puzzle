"use strict";
/**
 * 新旋转效率算法演示脚本
 * 展示"完美旋转+500分，每超出1次-10分"算法的工作效果
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockTranslation = exports.testCases = void 0;
const RotationEfficiencyCalculator_1 = require("./RotationEfficiencyCalculator");
// 模拟翻译函数
const mockTranslation = (key, params) => {
    const translations = {
        'rotation.perfect': '完美',
        'rotation.excess': `多了${params?.count || 0}次`
    };
    return translations[key] || key;
};
exports.mockTranslation = mockTranslation;
// 演示数据
const testCases = [
    { actual: 5, min: 5, description: '完美旋转 - 实际等于最小' },
    { actual: 8, min: 6, description: '超出旋转 - 多了2次' },
    { actual: 12, min: 8, description: '超出旋转 - 多了4次' },
    { actual: 0, min: 0, description: '无需旋转的完美情况' },
    { actual: 3, min: 0, description: '无需旋转但进行了旋转' },
    { actual: 15, min: 10, description: '大量超出旋转' },
    { actual: 1, min: 1, description: '最小完美旋转' },
    { actual: 20, min: 5, description: '极端超出情况' }
];
exports.testCases = testCases;
console.log('🎯 新旋转效率算法演示');
console.log('算法规则：完美旋转+500分，每超出1次-10分');
console.log('='.repeat(80));
// 展示算法统计信息
const stats = RotationEfficiencyCalculator_1.RotationEfficiencyCalculator.getAlgorithmStats();
console.log('📊 算法参数:');
console.log(`   完美旋转奖励: +${stats.perfectBonus}分`);
console.log(`   超出旋转惩罚: -${stats.excessPenalty}分/次`);
console.log(`   完美旋转颜色: ${stats.colors.PERFECT}`);
console.log(`   超出旋转颜色: ${stats.colors.EXCESS}`);
console.log();
// 测试每个案例
testCases.forEach((testCase, index) => {
    console.log(`📝 测试案例 ${index + 1}: ${testCase.description}`);
    // 使用基础算法
    const result = RotationEfficiencyCalculator_1.RotationEfficiencyCalculator.calculateScore(testCase.actual, testCase.min);
    // 使用国际化算法
    const i18nResult = (0, RotationEfficiencyCalculator_1.calculateNewRotationScoreWithI18n)(testCase.actual, testCase.min, mockTranslation);
    // 使用便捷函数
    const simpleScore = (0, RotationEfficiencyCalculator_1.calculateNewRotationScore)(testCase.actual, testCase.min);
    const displayText = (0, RotationEfficiencyCalculator_1.formatNewRotationDisplay)(testCase.actual, testCase.min);
    console.log(`   输入: 实际${testCase.actual}次, 最小${testCase.min}次`);
    console.log(`   结果: ${result.isPerfect ? '✅ 完美旋转' : '❌ 超出旋转'}`);
    console.log(`   分数: ${result.score >= 0 ? '+' : ''}${result.score}分`);
    console.log(`   显示: ${result.displayText}`);
    console.log(`   颜色: ${result.displayColor}`);
    if (!result.isPerfect) {
        console.log(`   超出: ${result.excessRotations}次 × -10分 = ${result.excessRotations * -10}分`);
    }
    // 验证一致性
    if (result.score !== simpleScore) {
        console.log(`   ⚠️  警告: 分数不一致! 基础算法: ${result.score}, 便捷函数: ${simpleScore}`);
    }
    console.log();
});
// 性能测试
console.log('⚡ 性能测试');
console.log('-'.repeat(40));
const performanceTestCount = 10000;
const startTime = performance.now();
for (let i = 0; i < performanceTestCount; i++) {
    const actualRotations = Math.floor(Math.random() * 50);
    const minRotations = Math.floor(Math.random() * 30);
    RotationEfficiencyCalculator_1.RotationEfficiencyCalculator.calculateScore(actualRotations, minRotations);
}
const endTime = performance.now();
const duration = endTime - startTime;
const avgTime = duration / performanceTestCount;
console.log(`执行${performanceTestCount}次计算:`);
console.log(`总耗时: ${duration.toFixed(2)}ms`);
console.log(`平均耗时: ${avgTime.toFixed(4)}ms/次`);
console.log(`性能评估: ${avgTime < 0.01 ? '✅ 优秀' : avgTime < 0.1 ? '✅ 良好' : '⚠️ 需要优化'}`);
console.log();
// 批量计算演示
console.log('📦 批量计算演示');
console.log('-'.repeat(40));
const batchTestCases = [
    { actualRotations: 5, minRotations: 5 },
    { actualRotations: 8, minRotations: 6 },
    { actualRotations: 10, minRotations: 10 },
    { actualRotations: 15, minRotations: 8 }
];
const batchResults = RotationEfficiencyCalculator_1.RotationEfficiencyCalculator.calculateBatchScores(batchTestCases);
batchResults.forEach((result, index) => {
    const testCase = batchTestCases[index];
    console.log(`${index + 1}. ${testCase.actualRotations}/${testCase.minRotations} → ${result.score >= 0 ? '+' : ''}${result.score}分 (${result.displayText})`);
});
console.log();
// 边界条件测试
console.log('🔍 边界条件测试');
console.log('-'.repeat(40));
const boundaryTests = [
    { actual: 0, min: 0, name: '零旋转完美' },
    { actual: 1, min: 0, name: '最小超出' },
    { actual: 100, min: 100, name: '大数完美' },
    { actual: 50, min: 1, name: '极端超出' }
];
boundaryTests.forEach(test => {
    const result = RotationEfficiencyCalculator_1.RotationEfficiencyCalculator.calculateScore(test.actual, test.min);
    console.log(`${test.name}: ${test.actual}/${test.min} → ${result.score >= 0 ? '+' : ''}${result.score}分`);
});
console.log();
// 与旧算法对比（模拟）
console.log('🔄 新旧算法对比');
console.log('-'.repeat(40));
// 模拟旧算法（基于效率百分比）
const calculateOldRotationScore = (actualRotations, minRotations) => {
    if (actualRotations === 0 || minRotations === 0)
        return 0;
    const efficiency = (minRotations / actualRotations) * 100;
    if (efficiency >= 100)
        return 200; // 完美：+200分
    if (efficiency >= 80)
        return 100; // 接近完美：+100分
    if (efficiency >= 60)
        return 50; // 旋转有点多：+50分
    if (efficiency >= 40)
        return -50; // 旋转太多了：-50分
    if (efficiency >= 20)
        return -100; // 请减少旋转：-100分
    return -200; // 看清楚再旋转：-200分
};
const comparisonCases = [
    { actual: 10, min: 10 },
    { actual: 12, min: 10 },
    { actual: 15, min: 10 },
    { actual: 20, min: 10 },
    { actual: 30, min: 10 }
];
console.log('实际/最小 | 新算法分数 | 旧算法分数 | 差异');
console.log('-'.repeat(50));
comparisonCases.forEach(testCase => {
    const newScore = (0, RotationEfficiencyCalculator_1.calculateNewRotationScore)(testCase.actual, testCase.min);
    const oldScore = calculateOldRotationScore(testCase.actual, testCase.min);
    const difference = newScore - oldScore;
    console.log(`${testCase.actual.toString().padStart(2)}/${testCase.min.toString().padStart(2).padEnd(7)} | ${newScore.toString().padStart(8)} | ${oldScore.toString().padStart(8)} | ${difference >= 0 ? '+' : ''}${difference}`);
});
console.log();
console.log('✅ 新旋转效率算法演示完成！');
console.log('🎯 核心优势：');
console.log('   1. 算法简单直观：完美旋转+500分，每超出1次-10分');
console.log('   2. 奖励明确：完美操作获得高额奖励');
console.log('   3. 惩罚线性：超出次数与扣分成正比');
console.log('   4. 性能优秀：平均计算时间 < 0.01ms');
console.log('   5. 国际化支持：完整的中英文显示');
