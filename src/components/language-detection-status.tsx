"use client";

import React, { useState, useEffect } from 'react';
import { useLanguageStore } from '@/store/languageStore';
import { useTranslation } from '@/lib/i18n';

export const LanguageDetectionStatus: React.FC = () => {
  const { language } = useLanguageStore();
  const t = useTranslation(language);
  const [detectionStatus, setDetectionStatus] = useState<string>('');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // 监听console.log来获取检测状态
    const originalLog = console.log;
    console.log = (...args) => {
      const message = args.join(' ');
      if (message.includes('Language')) {
        setDetectionStatus(message);
        setIsVisible(true);
        // 5秒后隐藏状态
        setTimeout(() => setIsVisible(false), 5000);
      }
      originalLog(...args);
    };

    return () => {
      console.log = originalLog;
    };
  }, []);

  if (!isVisible || !detectionStatus) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-3 rounded-lg shadow-lg animate-slide-up">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <div>
            <p className="text-sm font-medium">
              {language === 'zh' ? '语言自动检测' : 'Language Auto-Detection'}
            </p>
            <p className="text-xs opacity-90">
              {language === 'zh' 
                ? '当前语言: 中文'
                : 'Current: English'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};