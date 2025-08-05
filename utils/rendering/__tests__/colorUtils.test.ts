import { appendAlpha } from '../colorUtils';

describe('appendAlpha', () => {
  test('正确处理六位十六进制颜色值', () => {
    expect(appendAlpha('#FF5500', 0.8)).toBe('rgba(255, 85, 0, 0.8)');
    expect(appendAlpha('#123456', 0.5)).toBe('rgba(18, 52, 86, 0.5)');
    expect(appendAlpha('#FFFFFF', 1)).toBe('rgba(255, 255, 255, 1)');
  });

  test('正确处理三位十六进制颜色值', () => {
    expect(appendAlpha('#F50', 0.8)).toBe('rgba(255, 85, 0, 0.8)');
    expect(appendAlpha('#123', 0.5)).toBe('rgba(17, 34, 51, 0.5)');
    expect(appendAlpha('#FFF', 1)).toBe('rgba(255, 255, 255, 1)');
  });

  test('正确处理rgb格式颜色值', () => {
    expect(appendAlpha('rgb(255, 85, 0)', 0.8)).toBe('rgba(255, 85, 0, 0.8)');
    expect(appendAlpha('rgb(18, 52, 86)', 0.5)).toBe('rgba(18, 52, 86, 0.5)');
  });

  test('正确处理rgba格式颜色值', () => {
    // 替换原有的alpha值
    expect(appendAlpha('rgba(255, 85, 0, 0.4)', 0.8)).toBe('rgba(255, 85, 0, 0.8)');
    expect(appendAlpha('rgba(18, 52, 86, 1)', 0.5)).toBe('rgba(18, 52, 86, 0.5)');
  });

  test('正确处理hsl格式颜色值', () => {
    expect(appendAlpha('hsl(120, 50%, 50%)', 0.8)).toBe('hsla(120, 50%, 50%, 0.8)');
    expect(appendAlpha('hsl(240, 100%, 50%)', 0.5)).toBe('hsla(240, 100%, 50%, 0.5)');
  });

  test('正确处理hsla格式颜色值', () => {
    // 替换原有的alpha值
    expect(appendAlpha('hsla(120, 50%, 50%, 0.3)', 0.8)).toBe('hsla(120, 50%, 50%, 0.8)');
    expect(appendAlpha('hsla(240, 100%, 50%, 1)', 0.5)).toBe('hsla(240, 100%, 50%, 0.5)');
  });

  test('处理不支持的颜色格式', () => {
    expect(appendAlpha('invalid-color', 0.8)).toBe('rgba(204, 204, 204, 0.8)');
    expect(appendAlpha('', 0.5)).toBe('rgba(204, 204, 204, 0.5)');
  });

  test('处理边界alpha值', () => {
    // alpha值小于0时，应返回透明度为0
    expect(appendAlpha('#FF5500', -0.5)).toBe('rgba(255, 85, 0, 0)');
    // alpha值大于1时，应返回透明度为1
    expect(appendAlpha('#FF5500', 1.5)).toBe('rgba(255, 85, 0, 1)');
  });

  test('处理默认alpha值', () => {
    // 不提供alpha参数时，应使用默认值1
    expect(appendAlpha('#FF5500')).toBe('rgba(255, 85, 0, 1)');
    expect(appendAlpha('#123')).toBe('rgba(17, 34, 51, 1)');
    expect(appendAlpha('rgb(255, 85, 0)')).toBe('rgba(255, 85, 0, 1)');
    expect(appendAlpha('hsl(120, 50%, 50%)')).toBe('hsla(120, 50%, 50%, 1)');
    expect(appendAlpha('invalid-color')).toBe('rgba(204, 204, 204, 1)');
  });
}); 