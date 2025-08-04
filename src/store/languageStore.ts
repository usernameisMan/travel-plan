import { create } from 'zustand';

export type Language = 'en' | 'zh';

interface LanguageState {
  language: Language;
  setLanguage: (language: Language) => void;
  initializeLanguage: () => Promise<void>;
}

// 检测浏览器语言
const detectBrowserLanguage = (): Language => {
  if (typeof window === 'undefined') return 'en';
  
  const browserLang = navigator.language || navigator.languages?.[0] || 'en';
  
  // 检查是否为中文
  if (browserLang.startsWith('zh')) {
    return 'zh';
  }
  
  return 'en';
};

// 通过IP检测地理位置
const detectLocationLanguage = async (): Promise<Language> => {
  // API列表，按优先级排序
  const apis = [
    'https://ipapi.co/json/',
    'https://ipinfo.io/json',
  ];
  
  // 中文区域：中国大陆、台湾、香港、澳门、新加坡
  const chineseRegions = ['cn', 'tw', 'hk', 'mo', 'sg'];
  
  for (const apiUrl of apis) {
    try {
      // 创建AbortController实现超时
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3秒超时
      
      const response = await fetch(apiUrl, {
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      
      // 根据不同API的响应格式获取国家代码
      let countryCode: string | undefined;
      if (data.country_code) {
        countryCode = data.country_code.toLowerCase(); // ipapi.co
      } else if (data.country) {
        countryCode = data.country.toLowerCase(); // ipinfo.io
      }
      
      if (countryCode && chineseRegions.includes(countryCode)) {
        console.log(`Language detected as Chinese based on location: ${countryCode}`);
        return 'zh';
      }
      
      console.log(`Language detected as English based on location: ${countryCode || 'unknown'}`);
      return 'en';
      
    } catch (error) {
      console.log(`API ${apiUrl} failed:`, error);
      continue; // 尝试下一个API
    }
  }
  
  // 所有API都失败，降级到浏览器语言检测
  console.log('All IP location APIs failed, falling back to browser language');
  return detectBrowserLanguage();
};

export const useLanguageStore = create<LanguageState>((set, get) => ({
  language: 'en',
  setLanguage: (language) => {
    set({ language });
    // 保存到localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('user-language', language);
    }
  },
  /**
   * 自动初始化语言设置
   * 
   * 检测优先级：
   * 1. 用户手动设置的语言（存储在localStorage中）- 最高优先级
   * 2. 基于IP地理位置的语言检测 - 自动检测用户所在地区
   * 3. 浏览器语言设置 - 降级方案
   * 4. 默认英语 - 最终降级方案
   */
  initializeLanguage: async () => {
    if (typeof window === 'undefined') return;
    
    // 1. 首先检查localStorage中是否有用户手动设置的语言
    // 这确保用户的选择优先级最高
    const savedLanguage = localStorage.getItem('user-language') as Language;
    if (savedLanguage && ['en', 'zh'].includes(savedLanguage)) {
      set({ language: savedLanguage });
      console.log(`Language loaded from user preference: ${savedLanguage}`);
      return;
    }
    
    // 2. 尝试通过IP检测地理位置
    // 这提供了基于用户实际位置的智能语言选择
    try {
      const locationLang = await detectLocationLanguage();
      set({ language: locationLang });
      console.log(`Language auto-detected: ${locationLang} (based on IP location)`);
    } catch (error) {
      // 3. 如果IP检测失败，使用浏览器语言
      // 这是最可靠的降级方案
      const browserLang = detectBrowserLanguage();
      set({ language: browserLang });
      console.log(`Language auto-detected: ${browserLang} (based on browser language)`);
    }
  },
}));