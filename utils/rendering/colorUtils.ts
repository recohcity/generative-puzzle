/**
 * 颜色工具函数
 * 提供安全地处理颜色值和添加透明度的函数
 */

/**
 * 安全地为颜色添加透明度
 * 支持多种颜色格式：#RRGGBB、rgb()、rgba()、hsl()、hsla()
 * @param color 原始颜色字符串
 * @param alpha 透明度，0-1之间的小数
 * @returns 带有透明度的颜色字符串
 */
export function appendAlpha(color: string, alpha: number = 1): string {
  // 确保alpha值在0-1范围内
  const validAlpha = Math.max(0, Math.min(1, alpha));
  
  // 对十六进制颜色 #RRGGBB 格式进行处理
  if (/^#([0-9a-f]{6})$/i.test(color)) {
    // 从十六进制字符串中提取RGB值
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${validAlpha})`;
  }
  
  // 对十六进制颜色 #RGB 格式进行处理
  if (/^#([0-9a-f]{3})$/i.test(color)) {
    const r = parseInt(color.charAt(1) + color.charAt(1), 16);
    const g = parseInt(color.charAt(2) + color.charAt(2), 16);
    const b = parseInt(color.charAt(3) + color.charAt(3), 16);
    return `rgba(${r}, ${g}, ${b}, ${validAlpha})`;
  }
  
  // 对rgb()格式进行处理
  const rgbMatch = color.match(/^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);
  if (rgbMatch) {
    const [, r, g, b] = rgbMatch;
    return `rgba(${r}, ${g}, ${b}, ${validAlpha})`;
  }
  
  // 对rgba()格式进行处理 - 替换现有的alpha值
  const rgbaMatch = color.match(/^rgba\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([0-9.]+))?\s*\)$/i);
  if (rgbaMatch) {
    const [, r, g, b] = rgbaMatch;
    return `rgba(${r}, ${g}, ${b}, ${validAlpha})`;
  }
  
  // 对hsl()格式进行处理
  const hslMatch = color.match(/^hsl\s*\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*\)$/i);
  if (hslMatch) {
    const [, h, s, l] = hslMatch;
    return `hsla(${h}, ${s}%, ${l}%, ${validAlpha})`;
  }
  
  // 对hsla()格式进行处理 - 替换现有的alpha值
  const hslaMatch = color.match(/^hsla\s*\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*(?:,\s*([0-9.]+))?\s*\)$/i);
  if (hslaMatch) {
    const [, h, s, l] = hslaMatch;
    return `hsla(${h}, ${s}%, ${l}%, ${validAlpha})`;
  }
  
  // 对于不支持的格式，或保留原始颜色的同时创建合法的rgba颜色
  // 返回一个带有提供的alpha值的灰色（以防无法识别颜色格式）
  return `rgba(204, 204, 204, ${validAlpha})`;
} 