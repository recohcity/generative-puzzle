import { SupportedLocale } from './config';

// 翻译文件类型定义 - 使用更灵活的类型定义
export interface TranslationMessages {
  [key: string]: any;
}

// 动态导入翻译文件
export async function loadMessages(locale: SupportedLocale): Promise<TranslationMessages> {
  try {
    const messages = await import(`./locales/${locale}.json`);
    return messages.default || messages;
  } catch (error) {
    console.warn(`Failed to load messages for locale ${locale}, falling back to zh-CN`);
    const fallback = await import('./locales/zh-CN.json');
    return fallback.default || fallback;
  }
}

// 简单的插值函数 - 支持单大括号格式 {key}
export function interpolate(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return values[key]?.toString() || match;
  });
}

// 获取嵌套对象的值
export function getNestedValue(obj: Record<string, any>, path: string): string {
  try {
    const result = path.split('.').reduce((current: any, key) => {
      if (current === null || current === undefined) {
        return undefined;
      }
      return current[key];
    }, obj);
    return typeof result === 'string' ? result : path;
  } catch (error) {
    console.warn('Error getting nested value for path:', path, error);
    return path;
  }
}

// 随机选择完成消息
export function getRandomCompletionMessage(messages: TranslationMessages): string {
  const completionMessages = messages.game.hints.completionMessages;
  if (!completionMessages || completionMessages.length === 0) {
    return messages.game.hints.completed; // 回退到默认完成消息
  }
  const randomIndex = Math.floor(Math.random() * completionMessages.length);
  return completionMessages[randomIndex];
}