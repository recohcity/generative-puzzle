export type HapticType = 'collide' | 'success' | 'light';

/**
 * 触发移动端触觉反馈（震动）
 * 注意：目前 Web Vibration API 主要在 Android 端受支持
 * iOS Safari 出于策略原因不支持此 API
 * 
 * @param type 'collide' (碰撞边缘) | 'success' (拼图正确吸附)
 */
export const triggerHaptic = (type: HapticType) => {
  // 环境安全检查：确保在浏览器环境且设备支持 vibrate API
  if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
    try {
      switch (type) {
        case 'collide':
          // 碰到边缘：极短促震动 (模拟轻微碰撞)
          window.navigator.vibrate(15); 
          break;
        case 'success':
          // 放置正确：清晰的两段式震动 (模拟清脆的“咔哒”落位)
          window.navigator.vibrate([20, 30, 20]); 
          break;
        case 'light':
          // 交互反馈：极短促震动 (模拟微小触碰)
          window.navigator.vibrate(10);
          break;
      }
    } catch (e) {
      // 忽略可能的权限拦截错误
      console.warn('Vibration API failed', e);
    }
  }
};
