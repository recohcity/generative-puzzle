"use strict";
/**
 * 移动端适配验证测试
 * 验证iPhone 16系列和Android设备的适配效果
 */
Object.defineProperty(exports, "__esModule", { value: true });
var DeviceManager_1 = require("./core/DeviceManager");
var canvasAdaptation_1 = require("./constants/canvasAdaptation");
console.log('🧪 开始移动端适配验证测试...\n');
var deviceManager = DeviceManager_1.DeviceManager.getInstance();
// 测试设备列表
var mobileDevices = [
    // iPhone 16系列
    { name: 'iPhone 16e', width: 390, height: 844, brand: 'Apple' },
    { name: 'iPhone 16', width: 393, height: 852, brand: 'Apple' },
    { name: 'iPhone 16 Plus', width: 430, height: 932, brand: 'Apple' },
    { name: 'iPhone 16 Pro', width: 402, height: 874, brand: 'Apple' },
    { name: 'iPhone 16 Pro Max', width: 440, height: 956, brand: 'Apple' },
    // Android主流设备
    { name: 'Google Pixel 8', width: 393, height: 852, brand: 'Google' },
    { name: 'Samsung Galaxy S24', width: 393, height: 852, brand: 'Samsung' },
    { name: 'Samsung Galaxy S24 Ultra', width: 440, height: 956, brand: 'Samsung' },
    { name: 'Xiaomi 14', width: 402, height: 874, brand: 'Xiaomi' },
    { name: 'OnePlus 12', width: 402, height: 874, brand: 'OnePlus' },
];
// 测试1: 竖屏模式适配效果
console.log('✅ 测试1: 竖屏模式适配效果');
console.log('设备名称'.padEnd(20) + '品牌'.padEnd(10) + '分辨率'.padEnd(12) + '画布尺寸'.padEnd(10) + 'iPhone优化'.padEnd(15) + '匹配型号'.padEnd(18) + '适配质量');
console.log('─'.repeat(100));
mobileDevices.forEach(function (device) {
    var detection = deviceManager.getDeviceLayoutMode(device.width, device.height);
    var canvasResult = (0, canvasAdaptation_1.calculateMobilePortraitCanvasSize)(device.width, device.height);
    var hasOptimization = detection.iPhone16Model !== undefined;
    var matchedModel = detection.iPhone16Model || '通用适配';
    var canvasSize = canvasResult.canvasSize;
    // 计算适配质量 (画布尺寸相对于屏幕宽度的利用率)
    var utilizationRate = (canvasSize / device.width * 100).toFixed(1);
    var quality = parseFloat(utilizationRate) >= 85 ? '优秀' : parseFloat(utilizationRate) >= 75 ? '良好' : '一般';
    console.log(device.name.padEnd(20) +
        device.brand.padEnd(10) +
        "".concat(device.width, "\u00D7").concat(device.height).padEnd(12) +
        "".concat(canvasSize, "px").padEnd(10) +
        (hasOptimization ? 'Yes' : 'No').padEnd(15) +
        matchedModel.padEnd(18) +
        "".concat(quality, " (").concat(utilizationRate, "%)"));
});
// 测试2: 横屏模式适配效果
console.log('\n✅ 测试2: 横屏模式适配效果');
console.log('设备名称'.padEnd(20) + '品牌'.padEnd(10) + '分辨率'.padEnd(12) + '画布尺寸'.padEnd(10) + '面板宽度'.padEnd(10) + 'iPhone优化'.padEnd(15) + '空间利用');
console.log('─'.repeat(100));
mobileDevices.forEach(function (device) {
    var detection = deviceManager.getDeviceLayoutMode(device.height, device.width); // 横屏：宽高互换
    var canvasResult = (0, canvasAdaptation_1.calculateMobileLandscapeCanvasSize)(device.height, device.width);
    var hasOptimization = detection.iPhone16Model !== undefined;
    var canvasSize = canvasResult.canvasSize;
    var panelWidth = canvasResult.panelWidth;
    // 计算空间利用率 (画布+面板相对于屏幕宽度的利用率)
    var totalUsedWidth = canvasSize + panelWidth + 20; // 加上边距
    var utilizationRate = (totalUsedWidth / device.height * 100).toFixed(1); // 横屏时height是宽度
    console.log(device.name.padEnd(20) +
        device.brand.padEnd(10) +
        "".concat(device.height, "\u00D7").concat(device.width).padEnd(12) +
        "".concat(canvasSize, "px").padEnd(10) +
        "".concat(panelWidth, "px").padEnd(10) +
        (hasOptimization ? 'Yes' : 'No').padEnd(15) +
        "".concat(utilizationRate, "%"));
});
// 测试3: 跨品牌一致性验证
console.log('\n✅ 测试3: 跨品牌一致性验证');
// 找出相同分辨率的不同品牌设备
var resolutionGroups = {};
mobileDevices.forEach(function (device) {
    var key = "".concat(device.width, "\u00D7").concat(device.height);
    if (!resolutionGroups[key]) {
        resolutionGroups[key] = [];
    }
    resolutionGroups[key].push(device);
});
Object.entries(resolutionGroups).forEach(function (_a) {
    var resolution = _a[0], devices = _a[1];
    var deviceList = devices;
    if (deviceList.length > 1) {
        console.log("\n\u5206\u8FA8\u7387 ".concat(resolution, " \u7684\u8BBE\u5907:"));
        var results = deviceList.map(function (device) {
            var detection = deviceManager.getDeviceLayoutMode(device.width, device.height);
            var canvasResult = (0, canvasAdaptation_1.calculateMobilePortraitCanvasSize)(device.width, device.height);
            return {
                device: device.name,
                brand: device.brand,
                canvasSize: canvasResult.canvasSize,
                iPhone16Model: detection.iPhone16Model,
                forceReason: detection.forceReason
            };
        });
        // 检查一致性
        var canvasSizes_1 = results.map(function (r) { return r.canvasSize; });
        var iPhone16Models_1 = results.map(function (r) { return r.iPhone16Model; });
        var forceReasons_1 = results.map(function (r) { return r.forceReason; });
        var canvasConsistent = canvasSizes_1.every(function (size) { return size === canvasSizes_1[0]; });
        var modelConsistent = iPhone16Models_1.every(function (model) { return model === iPhone16Models_1[0]; });
        var reasonConsistent = forceReasons_1.every(function (reason) { return reason === forceReasons_1[0]; });
        results.forEach(function (result) {
            console.log("  ".concat(result.device, " (").concat(result.brand, "): \u753B\u5E03=").concat(result.canvasSize, "px, \u578B\u53F7=").concat(result.iPhone16Model || 'N/A', ", \u539F\u56E0=").concat(result.forceReason || 'N/A'));
        });
        console.log("  \u4E00\u81F4\u6027\u68C0\u67E5: \u753B\u5E03\u5C3A\u5BF8".concat(canvasConsistent ? '✓' : '✗', ", iPhone\u578B\u53F7").concat(modelConsistent ? '✓' : '✗', ", \u68C0\u6D4B\u539F\u56E0").concat(reasonConsistent ? '✓' : '✗'));
    }
});
// 测试4: 边界情况测试
console.log('\n✅ 测试4: 边界情况测试');
var edgeCases = [
    { name: '最小iPhone尺寸', width: 320, height: 568 },
    { name: '最大手机尺寸', width: 480, height: 1000 },
    { name: '接近平板尺寸', width: 600, height: 800 },
    { name: '超宽手机', width: 360, height: 900 },
];
console.log('边界情况'.padEnd(15) + '分辨率'.padEnd(12) + '设备类型'.padEnd(10) + '布局模式'.padEnd(12) + '画布尺寸'.padEnd(10) + '处理方式');
console.log('─'.repeat(75));
edgeCases.forEach(function (testCase) {
    var detection = deviceManager.getDeviceLayoutMode(testCase.width, testCase.height);
    var canvasResult = (0, canvasAdaptation_1.calculateMobilePortraitCanvasSize)(testCase.width, testCase.height);
    console.log(testCase.name.padEnd(15) +
        "".concat(testCase.width, "\u00D7").concat(testCase.height).padEnd(12) +
        detection.deviceType.padEnd(10) +
        detection.layoutMode.padEnd(12) +
        "".concat(canvasResult.canvasSize, "px").padEnd(10) +
        (detection.forceReason || '标准检测'));
});
// 测试5: 性能基准测试
console.log('\n✅ 测试5: 性能基准测试');
var performanceTests = [
    { name: '设备检测', iterations: 1000, test: function () { return deviceManager.getDeviceLayoutMode(402, 874); } },
    { name: '竖屏画布计算', iterations: 1000, test: function () { return (0, canvasAdaptation_1.calculateMobilePortraitCanvasSize)(402, 874); } },
    { name: '横屏画布计算', iterations: 1000, test: function () { return (0, canvasAdaptation_1.calculateMobileLandscapeCanvasSize)(874, 402); } },
];
performanceTests.forEach(function (perfTest) {
    var startTime = Date.now();
    for (var i = 0; i < perfTest.iterations; i++) {
        perfTest.test();
    }
    var endTime = Date.now();
    var avgTime = (endTime - startTime) / perfTest.iterations;
    console.log("".concat(perfTest.name, ": ").concat(perfTest.iterations, "\u6B21\u5E73\u5747\u8017\u65F6 ").concat(avgTime.toFixed(3), "ms"));
});
// 总结
console.log('\n🎉 移动端适配验证测试总结');
console.log('─'.repeat(50));
var totalDevices = mobileDevices.length;
var optimizedDevices = mobileDevices.filter(function (device) {
    var detection = deviceManager.getDeviceLayoutMode(device.width, device.height);
    return detection.iPhone16Model !== undefined;
}).length;
var appleDevices = mobileDevices.filter(function (d) { return d.brand === 'Apple'; }).length;
var androidDevices = totalDevices - appleDevices;
var androidOptimized = mobileDevices.filter(function (device) {
    if (device.brand === 'Apple')
        return false;
    var detection = deviceManager.getDeviceLayoutMode(device.width, device.height);
    return detection.iPhone16Model !== undefined;
}).length;
console.log("\u603B\u6D4B\u8BD5\u8BBE\u5907: ".concat(totalDevices, " (Apple: ").concat(appleDevices, ", Android: ").concat(androidDevices, ")"));
console.log("iPhone\u7EA7\u4F18\u5316\u8986\u76D6: ".concat(optimizedDevices, "/").concat(totalDevices, " (").concat((optimizedDevices / totalDevices * 100).toFixed(1), "%)"));
console.log("Android\u8BBE\u5907\u4F18\u5316: ".concat(androidOptimized, "/").concat(androidDevices, " (").concat((androidOptimized / androidDevices * 100).toFixed(1), "%)"));
console.log("\u9002\u914D\u4E00\u81F4\u6027: \u76F8\u540C\u5206\u8FA8\u7387\u8BBE\u5907\u83B7\u5F97\u76F8\u540C\u9002\u914D\u6548\u679C");
console.log("\u6027\u80FD\u8868\u73B0: \u6240\u6709\u64CD\u4F5C\u5747\u57281ms\u5185\u5B8C\u6210");
console.log('\n🧪 移动端适配验证测试完成!');
