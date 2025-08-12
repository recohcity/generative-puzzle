"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SupportedLocale, DEFAULT_LOCALE } from '@/src/i18n/config';
import { TranslationMessages, loadMessages, interpolate, getNestedValue, getRandomCompletionMessage } from '@/src/i18n';

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
  const [messages, setMessages] = useState<TranslationMessages | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  // 标记客户端已挂载
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 初始化语言设置 - 立即加载默认语言
  useEffect(() => {
    const initializeLocale = async () => {
      setIsLoading(true);
      try {
        // 直接加载默认中文翻译
        const defaultMessages = await loadMessages(DEFAULT_LOCALE);
        setMessages(defaultMessages);
      } catch (error) {
        console.error('Failed to load default messages:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeLocale();
  }, []);

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