"use client";

import { useEffect } from 'react';
import { useLanguageStore } from '@/store/languageStore';

export const LanguageInitializer: React.FC = () => {
  const { initializeLanguage } = useLanguageStore();

  useEffect(() => {
    // 在组件挂载时初始化语言
    initializeLanguage();
  }, [initializeLanguage]);

  // 这个组件不渲染任何内容，只负责初始化语言
  return null;
};