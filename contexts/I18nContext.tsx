"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SupportedLocale, DEFAULT_LOCALE } from '@/src/i18n/config';
import { TranslationMessages, loadMessages, interpolate, getNestedValue, getRandomCompletionMessage } from '@/src/i18n';

// 预加载默认翻译文件 - 使用静态导入确保可靠性
const defaultMessages = {
  "common": {
    "loading": "加载中...",
    "error": "错误",
    "success": "成功",
    "cancel": "取消",
    "confirm": "确认",
    "close": "关闭"
  },
  "game": {
    "title": "生成式拼图游戏",
    "description": "一个基于Next.js和React的生成式拼图游戏项目",
    "hints": {
      "selectShape": "请点击生成你喜欢的形状",
      "selectCutType": "请选择切割类型",
      "cutShape": "请切割形状",
      "scatterPuzzle": "请散开拼图，开始游戏",
      "gameInProgress": "请选择拼图拖到正确位置",
      "completed": "恭喜！拼图完成！",
      "progress": "{{completed}} / {{total}} 块拼图已完成",
      "completionMessages": [
        "你好犀利吖！",
        "太棒了！",
        "完美！",
        "厉害了！",
        "真不错！",
        "干得漂亮！",
        "超赞的！",
        "好样的！",
        "绝绝子！"
      ],
      "hintText": "这里"
    },
    "shapes": {
      "title": "选择形状类型",
      "polygon": "多边形",
      "curve": "云朵形状",
      "irregular": "锯齿形状"
    },
    "cutType": {
      "title": "选择切割类型",
      "straight": "直线",
      "diagonal": "斜线"
    },
    "cutCount": {
      "title": "选择切割次数",
      "difficulty": {
        "easy": "简单",
        "hard": "困难"
      },
      "button": "切割形状",
      "hints": {
        "selectCutType": "请先选择切割类型",
        "selectCount": "请选择切割次数"
      }
    },
    "scatter": {
      "title": "散开拼图",
      "button": "散开拼图",
      "completed": "拼图已散开"
    },
    "controls": {
      "title": "游戏控制",
      "hint": "提示",
      "rotateLeft": "左转",
      "rotateRight": "右转",
      "restart": "重新开始",
      "currentAngle": "当前角度: {{angle}}°",
      "rotateInstruction": "可以使用2只手指旋转拼图",
      "rotateInstructionDesktop": "(旋转角度需与目标角度匹配才能放置)"
    },
    "tabs": {
      "shape": "形状",
      "puzzle": "类型",
      "cut": "次数",
      "scatter": "散开",
      "controls": "控制"
    },
    "audio": {
      "toggleOn": "开启背景音乐",
      "toggleOff": "关闭背景音乐"
    },
    "fullscreen": {
      "enter": "全屏",
      "exit": "退出全屏"
    }
  }
};

interface I18nContextType {
  locale: SupportedLocale;
  messages: TranslationMessages | null;
  isLoading: boolean;
  changeLocale: (newLocale: SupportedLocale) => Promise<void>;
  t: (key: string, values?: Record<string, string | number>) => string;
  getRandomCompletionMessage: () => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

interface I18nProviderProps {
  children: ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  // 始终从默认语言开始，避免水合错误
  const [locale, setLocale] = useState<SupportedLocale>(DEFAULT_LOCALE);
  // 立即使用预加载的默认翻译文件，避免显示翻译键
  const [messages, setMessages] = useState<TranslationMessages | null>(defaultMessages as TranslationMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // 标记客户端已挂载
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 初始化语言设置 - 页面刷新后保持默认中文
  useEffect(() => {
    if (!isClient) return;
    
    // 页面刷新后默认停留在中文，用户需要手动切换语言
    console.log('I18n initialized with default locale (zh-CN)');
  }, [isClient]);

  // 切换语言 - 不保存用户偏好，每次刷新回到默认中文
  const changeLocale = async (newLocale: SupportedLocale) => {
    if (newLocale === locale) return;

    setIsLoading(true);
    try {
      const newMessages = await loadMessages(newLocale);
      setMessages(newMessages);
      setLocale(newLocale);
      console.log(`Language switched to: ${newLocale}`);
    } catch (error) {
      console.error('Failed to change locale:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 翻译函数
  const t = (key: string, values?: Record<string, string | number>): string => {
    // 现在我们总是有翻译文件（至少是默认的），所以可以简化逻辑
    if (!messages) {
      console.warn('Translation messages not available, returning key:', key);
      return key;
    }

    const translation = getNestedValue(messages, key);

    if (values && typeof translation === 'string') {
      return interpolate(translation, values);
    }

    return translation;
  };

  // 获取随机完成消息
  const getRandomCompletionMessageFunc = (): string => {
    if (!messages) return 'Completed!';
    return getRandomCompletionMessage(messages);
  };

  const value: I18nContextType = {
    locale,
    messages,
    isLoading,
    changeLocale,
    t,
    getRandomCompletionMessage: getRandomCompletionMessageFunc,
  };

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextType {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

// 便捷的翻译Hook
export function useTranslation() {
  const { t, locale, changeLocale, isLoading, getRandomCompletionMessage } = useI18n();
  return { t, locale, changeLocale, isLoading, getRandomCompletionMessage };
}