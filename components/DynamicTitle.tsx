"use client";

import { useEffect } from 'react';
import { useTranslation } from '@/contexts/I18nContext';

const DynamicTitle: React.FC = () => {
  const { t, locale, isLoading } = useTranslation();

  useEffect(() => {
    if (!isLoading) {
      // 更新页面标题
      document.title = t('game.title');
      
      // 更新HTML lang属性
      document.documentElement.lang = locale;
      
      // 更新meta description（如果存在）
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', t('game.description'));
      }
    }
  }, [t, locale, isLoading]);

  return null; // 这个组件不渲染任何内容
};

export default DynamicTitle;