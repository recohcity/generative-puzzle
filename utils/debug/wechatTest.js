/**
 * 微信浏览器User-Agent测试脚本
 * 用于验证不同微信浏览器版本的User-Agent字符串
 */

// 常见的微信浏览器User-Agent示例
const wechatUserAgents = [
  // iPhone微信浏览器
  'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.20(0x18001428) NetType/WIFI Language/zh_CN',
  
  // Android微信浏览器
  'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/87.0.4280.141 Mobile Safari/537.36 MicroMessenger/8.0.19.2080(0x28001333) Process/tools WeChat/arm64 Weixin NetType/WIFI Language/zh_CN ABI/arm64',
  
  // 企业微信
  'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 wxwork/4.0.8 MicroMessenger/7.0.1 Language/zh',
  
  // iPad微信浏览器 - 竖屏 (768x1024)
  'Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.20(0x18001428) NetType/WIFI Language/zh_CN',
  
  // iPad微信浏览器 - 横屏 (1024x768)
  'Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.20(0x18001428) NetType/WIFI Language/zh_CN',
];

// 测试函数
function testWeChatDetection(userAgent, screenWidth = 1024, screenHeight = 768) {
  const isWeChat = /MicroMessenger/i.test(userAgent);
  const isWeChatWork = /wxwork/i.test(userAgent);
  const isMobileBrowser = /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  const isAndroid = /Android/i.test(userAgent);
  const isIOS = /iPhone|iPad|iPod/i.test(userAgent);
  const isIPad = /iPad/i.test(userAgent) || (isIOS && screenWidth >= 768);
  
  // 模拟新的检测逻辑
  let deviceType = 'desktop';
  let layoutMode = 'desktop';
  
  if (isWeChat || isWeChatWork) {
    if (isIPad) {
      if (screenWidth >= 1024) {
        deviceType = 'desktop';
        layoutMode = 'desktop';
      } else {
        deviceType = 'tablet';
        layoutMode = screenHeight > screenWidth ? 'portrait' : 'landscape';
      }
    } else if (screenWidth <= 900) {
      deviceType = 'phone';
      layoutMode = screenHeight > screenWidth ? 'portrait' : 'landscape';
    } else {
      deviceType = 'tablet';
      layoutMode = screenHeight > screenWidth ? 'portrait' : 'landscape';
    }
  }
  
  return {
    userAgent: userAgent.substring(0, 80) + '...',
    screenSize: `${screenWidth}x${screenHeight}`,
    isWeChat,
    isWeChatWork,
    isMobileBrowser,
    isAndroid,
    isIOS,
    isIPad,
    deviceType,
    layoutMode,
    shouldUseDesktop: deviceType === 'desktop'
  };
}

// 运行测试
console.log('🧪 微信浏览器User-Agent检测测试');
console.log('='.repeat(50));

const testCases = [
  { ua: wechatUserAgents[0], width: 390, height: 844, desc: 'iPhone微信竖屏' },
  { ua: wechatUserAgents[0], width: 844, height: 390, desc: 'iPhone微信横屏' },
  { ua: wechatUserAgents[3], width: 768, height: 1024, desc: 'iPad微信竖屏' },
  { ua: wechatUserAgents[4], width: 1024, height: 768, desc: 'iPad微信横屏' },
  { ua: wechatUserAgents[4], width: 1366, height: 1024, desc: 'iPad Pro微信横屏' },
];

testCases.forEach((testCase, index) => {
  console.log(`\n测试 ${index + 1}: ${testCase.desc}`);
  const result = testWeChatDetection(testCase.ua, testCase.width, testCase.height);
  console.table(result);
});

// 导出测试函数供其他地方使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testWeChatDetection, wechatUserAgents };
}