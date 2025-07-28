/**
 * 综合测试设备检测统一效果
 * 验证在不同设备和屏幕尺寸下设备检测的准确性
 */

import { DeviceManager } from './core/DeviceManager';

console.log('🧪 开始设备检测统一效果综合测试...\n');

// 测试设备数据集
const testDevices = [
  // 桌面设备
  { name: '标准桌面', width: 1920, height: 1080, expectedType: 'desktop', expectedLayout: 'desktop' },
  { name: '超宽桌面', width: 3440, height: 1440, expectedType: 'desktop', expectedLayout: 'desktop' },
  { name: '4K桌面', width: 3840, height: 2160, expectedType: 'desktop', expectedLayout: 'desktop' },
  { name: '小桌面', width: 1366, height: 768, expectedType: 'desktop', expectedLayout: 'desktop' },
  
  // iPhone 16系列
  { name: 'iPhone 16e 竖屏', width: 390, height: 844, expectedType: 'phone', expectedLayout: 'portrait', expectedModel: 'iPhone 16e' },
  { name: 'iPhone 16e 横屏', width: 844, height: 390, expectedType: 'phone', expectedLayout: 'landscape', expectedModel: 'iPhone 16e' },
  { name: 'iPhone 16 竖屏', width: 393, height: 852, expectedType: 'phone', expectedLayout: 'portrait', expectedModel: 'iPhone 16' },
  { name: 'iPhone 16 横屏', width: 852, height: 393, expectedType: 'phone', expectedLayout: 'landscape', expectedModel: 'iPhone 16' },
  { name: 'iPhone 16 Plus 竖屏', width: 430, height: 932, expectedType: 'phone', expectedLayout: 'portrait', expectedModel: 'iPhone 16 Plus' },
  { name: 'iPhone 16 Plus 横屏', width: 932, height: 430, expectedType: 'phone', expectedLayout: 'landscape', expectedModel: 'iPhone 16 Plus' },
  { name: 'iPhone 16 Pro 竖屏', width: 402, height: 874, expectedType: 'phone', expectedLayout: 'portrait', expectedModel: 'iPhone 16 Pro' },
  { name: 'iPhone 16 Pro 横屏', width: 874, height: 402, expectedType: 'phone', expectedLayout: 'landscape', expectedModel: 'iPhone 16 Pro' },
  { name: 'iPhone 16 Pro Max 竖屏', width: 440, height: 956, expectedType: 'phone', expectedLayout: 'portrait', expectedModel: 'iPhone 16 Pro Max' },
  { name: 'iPhone 16 Pro Max 横屏', width: 956, height: 440, expectedType: 'phone', expectedLayout: 'landscape', expectedModel: 'iPhone 16 Pro Max' },
  
  // Android主流设备
  { name: 'Google Pixel 8 竖屏', width: 393, height: 852, expectedType: 'phone', expectedLayout: 'portrait' },
  { name: 'Google Pixel 8 横屏', width: 852, height: 393, expectedType: 'phone', expectedLayout: 'landscape' },
  { name: 'Samsung Galaxy S24 竖屏', width: 393, height: 852, expectedType: 'phone', expectedLayout: 'portrait' },
  { name: 'Samsung Galaxy S24 横屏', width: 852, height: 393, expectedType: 'phone', expectedLayout: 'landscape' },
  { name: 'Samsung Galaxy S24 Ultra 竖屏', width: 440, height: 956, expectedType: 'phone', expectedLayout: 'portrait' },
  { name: 'Samsung Galaxy S24 Ultra 横屏', width: 956, height: 440, expectedType: 'phone', expectedLayout: 'landscape' },
  { name: 'Xiaomi 14 竖屏', width: 402, height: 874, expectedType: 'phone', expectedLayout: 'portrait' },
  { name: 'Xiaomi 14 横屏', width: 874, height: 402, expectedType: 'phone', expectedLayout: 'landscape' },
  
  // 平板设备
  { name: 'iPad 竖屏', width: 768, height: 1024, expectedType: 'tablet', expectedLayout: 'desktop' },
  { name: 'iPad 横屏', width: 1024, height: 768, expectedType: 'tablet', expectedLayout: 'desktop' },
  { name: 'iPad Pro 竖屏', width: 834, height: 1194, expectedType: 'tablet', expectedLayout: 'desktop' },
  { name: 'iPad Pro 横屏', width: 1194, height: 834, expectedType: 'tablet', expectedLayout: 'desktop' },
  
  // 边界情况
  { name: '小屏手机', width: 320, height: 568, expectedType: 'phone', expectedLayout: 'portrait' },
  { name: '大屏手机', width: 480, height: 960, expectedType: 'phone', expectedLayout: 'portrait' },
  { name: '方形屏幕', width: 800, height: 800, expectedType: 'tablet', expectedLayout: 'desktop' },
];

const deviceManager = DeviceManager.getInstance();

// 测试1: 基本设备检测准确性
console.log('✅ 测试1: 基本设备检测准确性');
console.log('设备名称'.padEnd(25) + '分辨率'.padEnd(12) + '预期类型'.padEnd(10) + '实际类型'.padEnd(10) + '预期布局'.padEnd(12) + '实际布局'.padEnd(12) + '结果');
console.log('─'.repeat(95));

let passedTests = 0;
let totalTests = testDevices.length;

testDevices.forEach(device => {
  const result = deviceManager.getDeviceLayoutMode(device.width, device.height);
  const typeMatch = result.deviceType === device.expectedType;
  const layoutMatch = result.layoutMode === device.expectedLayout;
  const testPassed = typeMatch && layoutMatch;
  
  if (testPassed) passedTests++;
  
  const status = testPassed ? '✓' : '✗';
  
  console.log(
    device.name.padEnd(25) +
    `${device.width}×${device.height}`.padEnd(12) +
    device.expectedType.padEnd(10) +
    result.deviceType.padEnd(10) +
    device.expectedLayout.padEnd(12) +
    result.layoutMode.padEnd(12) +
    status
  );
});

console.log(`\n基本检测准确率: ${passedTests}/${totalTests} (${(passedTests/totalTests*100).toFixed(1)}%)`);

// 测试2: iPhone 16系列特殊检测
console.log('\n✅ 测试2: iPhone 16系列特殊检测');
console.log('设备名称'.padEnd(25) + '分辨率'.padEnd(12) + '预期型号'.padEnd(18) + '实际型号'.padEnd(18) + '精确匹配'.padEnd(10) + '结果');
console.log('─'.repeat(95));

let iPhone16PassedTests = 0;
const iPhone16Devices = testDevices.filter(d => d.expectedModel);

iPhone16Devices.forEach(device => {
  const result = deviceManager.getDeviceLayoutMode(device.width, device.height);
  const modelMatch = result.iPhone16Model === device.expectedModel;
  const exactMatch = result.iPhone16Exact === true;
  const testPassed = modelMatch && exactMatch;
  
  if (testPassed) iPhone16PassedTests++;
  
  const status = testPassed ? '✓' : '✗';
  
  console.log(
    device.name.padEnd(25) +
    `${device.width}×${device.height}`.padEnd(12) +
    (device.expectedModel || 'N/A').padEnd(18) +
    (result.iPhone16Model || 'N/A').padEnd(18) +
    (result.iPhone16Exact ? 'Yes' : 'No').padEnd(10) +
    status
  );
});

console.log(`\niPhone 16检测准确率: ${iPhone16PassedTests}/${iPhone16Devices.length} (${(iPhone16PassedTests/iPhone16Devices.length*100).toFixed(1)}%)`);

// 测试3: 跨品牌手机适配覆盖
console.log('\n✅ 测试3: 跨品牌手机适配覆盖');
const androidDevices = testDevices.filter(d => d.name.includes('Google') || d.name.includes('Samsung') || d.name.includes('Xiaomi'));
let androidOptimizedCount = 0;

console.log('Android设备名称'.padEnd(25) + '分辨率'.padEnd(12) + 'iPhone优化'.padEnd(15) + '匹配型号'.padEnd(18) + '适配效果');
console.log('─'.repeat(85));

androidDevices.forEach(device => {
  const result = deviceManager.getDeviceLayoutMode(device.width, device.height);
  const hasOptimization = result.iPhone16Model !== undefined;
  const matchedModel = result.iPhone16Model || '通用适配';
  
  if (hasOptimization) androidOptimizedCount++;
  
  console.log(
    device.name.padEnd(25) +
    `${device.width}×${device.height}`.padEnd(12) +
    (hasOptimization ? 'Yes' : 'No').padEnd(15) +
    matchedModel.padEnd(18) +
    (hasOptimization ? '✓ iPhone级优化' : '○ 通用适配')
  );
});

console.log(`\nAndroid设备iPhone级优化覆盖率: ${androidOptimizedCount}/${androidDevices.length} (${(androidOptimizedCount/androidDevices.length*100).toFixed(1)}%)`);

// 测试4: 容差范围测试
console.log('\n✅ 测试4: 容差范围测试 (±10px)');
const toleranceTests = [
  { name: 'iPhone 16 Pro +5px', width: 407, height: 879, expectedModel: 'iPhone 16 Pro', shouldMatch: true },
  { name: 'iPhone 16 Pro -5px', width: 397, height: 869, expectedModel: 'iPhone 16 Pro', shouldMatch: true },
  { name: 'iPhone 16 Pro +15px', width: 417, height: 889, expectedModel: 'iPhone 16 Pro', shouldMatch: false },
  { name: 'iPhone 16 Plus +8px', width: 438, height: 940, expectedModel: 'iPhone 16 Plus', shouldMatch: true },
  { name: 'iPhone 16 Plus -8px', width: 422, height: 924, expectedModel: 'iPhone 16 Plus', shouldMatch: true },
];

console.log('测试用例'.padEnd(20) + '分辨率'.padEnd(12) + '预期匹配'.padEnd(10) + '实际结果'.padEnd(15) + '结果');
console.log('─'.repeat(70));

let tolerancePassedTests = 0;
toleranceTests.forEach(test => {
  const result = deviceManager.getDeviceLayoutMode(test.width, test.height);
  const actualMatch = result.iPhone16Model === test.expectedModel;
  const testPassed = actualMatch === test.shouldMatch;
  
  if (testPassed) tolerancePassedTests++;
  
  const status = testPassed ? '✓' : '✗';
  
  console.log(
    test.name.padEnd(20) +
    `${test.width}×${test.height}`.padEnd(12) +
    (test.shouldMatch ? 'Yes' : 'No').padEnd(10) +
    (actualMatch ? 'Matched' : 'No Match').padEnd(15) +
    status
  );
});

console.log(`\n容差测试准确率: ${tolerancePassedTests}/${toleranceTests.length} (${(tolerancePassedTests/toleranceTests.length*100).toFixed(1)}%)`);

// 测试5: 性能和一致性测试
console.log('\n✅ 测试5: 性能和一致性测试');

// 性能测试
const performanceTestDevice = { width: 402, height: 874 };
const iterations = 1000;
const startTime = Date.now();

for (let i = 0; i < iterations; i++) {
  deviceManager.getDeviceLayoutMode(performanceTestDevice.width, performanceTestDevice.height);
}

const endTime = Date.now();
const avgTime = (endTime - startTime) / iterations;

console.log(`性能测试: ${iterations}次检测平均耗时 ${avgTime.toFixed(3)}ms`);

// 一致性测试
const consistencyResults = [];
for (let i = 0; i < 10; i++) {
  const result = deviceManager.getDeviceLayoutMode(performanceTestDevice.width, performanceTestDevice.height);
  consistencyResults.push(JSON.stringify(result));
}

const isConsistent = consistencyResults.every(result => result === consistencyResults[0]);
console.log(`一致性测试: ${isConsistent ? '✓ 所有结果一致' : '✗ 结果不一致'}`);

// 总结
console.log('\n🎉 设备检测统一效果测试总结');
console.log('─'.repeat(50));
console.log(`基本设备检测准确率: ${(passedTests/totalTests*100).toFixed(1)}%`);
console.log(`iPhone 16系列检测准确率: ${(iPhone16PassedTests/iPhone16Devices.length*100).toFixed(1)}%`);
console.log(`Android设备优化覆盖率: ${(androidOptimizedCount/androidDevices.length*100).toFixed(1)}%`);
console.log(`容差范围测试准确率: ${(tolerancePassedTests/toleranceTests.length*100).toFixed(1)}%`);
console.log(`平均检测性能: ${avgTime.toFixed(3)}ms`);
console.log(`结果一致性: ${isConsistent ? '✓' : '✗'}`);

const overallScore = (
  (passedTests/totalTests) * 0.3 +
  (iPhone16PassedTests/iPhone16Devices.length) * 0.3 +
  (androidOptimizedCount/androidDevices.length) * 0.2 +
  (tolerancePassedTests/toleranceTests.length) * 0.1 +
  (isConsistent ? 1 : 0) * 0.1
) * 100;

console.log(`\n总体评分: ${overallScore.toFixed(1)}/100`);

if (overallScore >= 95) {
  console.log('🎉 优秀! 设备检测统一效果完美');
} else if (overallScore >= 85) {
  console.log('✅ 良好! 设备检测统一效果良好');
} else if (overallScore >= 75) {
  console.log('⚠️  一般! 设备检测统一效果需要改进');
} else {
  console.log('❌ 差! 设备检测统一效果需要重大改进');
}

console.log('\n🧪 设备检测统一效果综合测试完成!');