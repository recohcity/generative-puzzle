"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SupportedLocale, DEFAULT_LOCALE } from '@/src/i18n/config';
import { TranslationMessages, loadMessages, interpolate, getNestedValue, getRandomCompletionMessage } from '@/src/i18n';

// 预加载默认翻译文件 - 修正后的结构，与 .json 文件 1:1 对齐，防止 Key 泄露
const defaultMessages = {
  "common": {
    "loading": "加载中...",
    "error": "错误",
    "success": "成功",
    "cancel": "取消",
    "confirm": "确认",
    "close": "关闭"
  },
  "auth": {
    "guest": "游客",
    "login": "立即登录",
    "logout": "退出",
    "loggedIn": "已登录",
    "logoutDescription": "确定要退出当前账号吗？这不会删除您的记录。",
    "registerButton": "注册",
    "loginButton": "登录",
    "userPanel": "用户"
  },
  "game": {
    "title": "生成式拼图游戏",
    "description": "基于 Next.js 的生成式拼图",
    "hints": {
      "selectShape": "请点击生成你喜欢的形状",
      "selectCutType": "请选择切割类型",
      "cutShape": "请切割形状",
      "scatterPuzzle": "请散开拼图，开始游戏",
      "gameInProgress": "请选择拼图拖到正确位置",
      "completed": "恭喜！拼图完成！",
      "completionMessages": ["你好犀利㖞", "叻叻猪", "完美晒", "劲到飞起", "识玩", "型到漏油"]
    }
  },
  "score": {
    "label": "分数",
    "newRecord": "新纪录",
    "breakdown": {
      "title": "分数详情",
      "base": "基础得分",
      "timeBonus": "速度加成",
      "rotationScore": "旋转得分",
      "hintScore": "提示扣分",
      "final": "最终得分",
      "subtotal": "小计"
    }
  },
  "stats": {
    "gameComplete": "游戏完成",
    "viewScore": "查看成绩",
    "currentGameResult": "本局成绩",
    "currentGameScore": "本局成绩",
    "duration": "游戏时长",
    "piecesUnit": "片"
  },
  "difficulty": {
    "easy": "简单",
    "medium": "中等",
    "hard": "困难",
    "levelLabel": "难度{level}"
  },
  "leaderboard": {
    "title": "排行榜",
    "empty": "暂无记录",
    "close": "关闭"
  }
};

interface I18nContextType {
  locale: SupportedLocale;
  messages: TranslationMessages | null;
  isLoading: boolean;
  changeLocale: (newLocale: SupportedLocale) => Promise<void>;
  t: (key: string, values?: Record<string, string | number>) => string;
  getRandomCompletionMessage: (seed?: number) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<SupportedLocale>(DEFAULT_LOCALE);
  const [messages, setMessages] = useState<TranslationMessages | null>(defaultMessages as any);
  const [isLoading, setIsLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;
    const loadInitialTranslations = async () => {
      try {
        const zhMessages = await loadMessages('zh-CN');
        if (zhMessages) setMessages(zhMessages);
      } catch (error) {
        console.warn('I18n load fail:', error);
      }
    };
    loadInitialTranslations();
  }, [isClient]);

  const changeLocale = async (newLocale: SupportedLocale) => {
    if (newLocale === locale) return;
    setIsLoading(true);
    try {
      const newMessages = await loadMessages(newLocale);
      if (newMessages) {
        setMessages(newMessages);
        setLocale(newLocale);
      }
    } catch (error) {
      console.error('Locale change error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const t = (key: string, values?: Record<string, string | number>): string => {
    if (!messages) return key;
    const translation = getNestedValue(messages, key);
    if (typeof translation !== 'string') return key;
    if (values) return interpolate(translation, values);
    return translation;
  };

  const getRandomCompletionMessageFunc = (seed?: number): string => {
    if (!messages || !messages.game) return 'Completed!';
    return getRandomCompletionMessage(messages, seed);
  };

  return (
    <I18nContext.Provider value={{ locale, messages, isLoading, changeLocale, t, getRandomCompletionMessage: getRandomCompletionMessageFunc }}>
      {children}
    </I18nContext.Provider>
  );
}

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useI18n must be inside I18nProvider');
  return context;
};

export const useTranslation = () => {
  const { t, locale, changeLocale, isLoading, getRandomCompletionMessage } = useI18n();
  return { t, locale, changeLocale, isLoading, getRandomCompletionMessage };
};