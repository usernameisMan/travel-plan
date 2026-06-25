"use client";

import React from 'react';
import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLanguageStore, Language } from '@/store/languageStore';
import { cn } from '@/lib/utils';

interface LanguageSwitcherProps {
  className?: string;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ 
  className 
}) => {
  const { language, setLanguage } = useLanguageStore();

  const languageOptions = [
    { value: 'en', label: 'English', flag: '🇺🇸' },
    { value: 'zh', label: '中文', flag: '🇨🇳' },
  ] as const;

  const handleLanguageChange = (value: string) => {
    setLanguage(value as Language);
  };

  return (
    <div className={cn("flex items-center", className)}>
      <Select value={language} onValueChange={handleLanguageChange}>
        <SelectTrigger className="w-auto min-w-[120px] h-10 border-0 bg-transparent hover:bg-purple-50 focus:ring-0 focus:ring-offset-0 transition-colors duration-200 rounded-xl">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-gray-600" />
            <SelectValue />
          </div>
        </SelectTrigger>
        <SelectContent>
          {languageOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <div className="flex items-center gap-2">
                <span>{option.flag}</span>
                <span>{option.label}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};