import { SupportedLocale } from './config';

// 翻译文件类型定义
export interface TranslationMessages {
  common: {
    loading: string;
    error: string;
    success: string;
    cancel: string;
    confirm: string;
    close: string;
  };
  game: {
    title: string;
    description: string;
    hints: {
      selectShape: string;
      selectCutType: string;
      cutShape: string;
      scatterPuzzle: string;
      gameInProgress: string;
      completed: string;
      progress: string;
      completionMessages: string[];
      hintText: string;
    };
    shapes: {
      title: string;
      polygon: string;
      curve: string;
      irregular: string;
    };
    cutType: {
      title: string;
      straight: string;
      diagonal: string;
    };
    cutCount: {
      title: string;
      difficulty: {
        easy: string;
        hard: string;
      };
      button: string;
      hints: {
        selectCutType: string;
        selectCount: string;
      };
    };
    scatter: {
      title: string;
      button: string;
      completed: string;
    };
    controls: {
      title: string;
      hint: string;
      rotateLeft: string;
      rotateRight: string;
      restart: string;
      currentAngle: string;
      rotateInstruction: string;
      rotateInstructionDesktop: string;
    };
    tabs: {
      shape: string;
      puzzle: string;
      cut: string;
      scatter: string;
      controls: string;
    };
    audio: {
      toggleOn: string;
      toggleOff: string;
    };
    fullscreen: {
      enter: string;
      exit: string;
    };
  };
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

// 简单的插值函数
export function interpolate(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return values[key]?.toString() || match;
  });
}

// 获取嵌套对象的值
export function getNestedValue(obj: Record<string, any>, path: string): string {
  const result = path.split('.').reduce((current: any, key) => current?.[key], obj);
  return typeof result === 'string' ? result : path;
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