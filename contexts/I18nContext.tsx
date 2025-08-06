"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SupportedLocale, getStoredLocale, setStoredLocale, DEFAULT_LOCALE } from '@/src/i18n/config';
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
  const [locale, setLocale] = useState<SupportedLocale>(() => {
    // 在服务端始终返回默认语言，避免水合错误
    if (typeof window === 'undefined') return DEFAULT_LOCALE;
    return getStoredLocale();
  });
  const [messages, setMessages] = useState<TranslationMessages | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  // 标记客户端已挂载
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 初始化语言设置
  useEffect(() => {
    if (!isClient) return;
    
    const initializeLocale = async () => {
      setIsLoading(true);
      const storedLocale = getStoredLocale();
      
      // 如果存储的语言与当前语言不同，更新语言
      if (storedLocale !== locale) {
        setLocale(storedLocale);
      }
      
      try {
        const loadedMessages = await loadMessages(storedLocale);
        setMessages(loadedMessages);
      } catch (error) {
        console.error('Failed to load initial messages:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeLocale();
  }, [isClient, locale]);

  // 切换语言
  const changeLocale = async (newLocale: SupportedLocale) => {
    if (newLocale === locale) return;

    setIsLoading(true);
    try {
      const newMessages = await loadMessages(newLocale);
      setMessages(newMessages);
      setLocale(newLocale);
      setStoredLocale(newLocale);
    } catch (error) {
      console.error('Failed to change locale:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 翻译函数
  const t = (key: string, values?: Record<string, string | number>): string => {
    if (!messages) return key;

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