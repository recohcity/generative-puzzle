"use client";

import { useEffect, useState } from 'react';
import { useTranslation } from '@/contexts/I18nContext';

const DynamicTitle: React.FC = () => {
  const { t, locale, isLoading } = useTranslation();
  const [isClient, setIsClient] = useState(false);

  // 标记客户端已挂载，避免水合错误
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    // 只在客户端且翻译加载完成后执行
    if (!isClient || isLoading) return;

    // 更新页面标题
    document.title = t('game.title');
    
    // 更新HTML lang属性 - 使用 suppressHydrationWarning 避免水合警告
    if (document.documentElement.lang !== locale) {
      document.documentElement.lang = locale;
    }
    
    // 更新meta description（如果存在）
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', t('game.description'));
    }
  }, [t, locale, isLoading, isClient]);

  return null; // 这个组件不渲染任何内容
};

export default DynamicTitle;