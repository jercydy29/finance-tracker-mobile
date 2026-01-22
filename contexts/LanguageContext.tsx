import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import { I18n } from 'i18n-js';
import en from '@/locales/en.json';
import ja from '@/locales/ja.json';

type Language = 'en' | 'ja';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  isLoaded: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = '@finance_tracker_language';

// Initialize i18n
const i18n = new I18n({
  en,
  ja,
});

// Enable fallback to 'en' if translation is missing
i18n.enableFallback = true;
i18n.defaultLocale = 'en';

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
  const [isLoaded, setIsLoaded] = useState(false);

  // Detect device language on first launch
  const detectDeviceLanguage = (): Language => {
    const deviceLocale = Localization.getLocales()[0]?.languageCode;
    // If device is set to Japanese, use 'ja', otherwise default to 'en'
    return deviceLocale === 'ja' ? 'ja' : 'en';
  };

  // Load saved language preference or detect device language
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (savedLanguage) {
          setLanguageState(savedLanguage as Language);
          i18n.locale = savedLanguage;
        } else {
          // First launch - detect device language
          const deviceLang = detectDeviceLanguage();
          setLanguageState(deviceLang);
          i18n.locale = deviceLang;
          await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, deviceLang);
        }
      } catch (error) {
        console.error('Failed to load language:', error);
        const deviceLang = detectDeviceLanguage();
        setLanguageState(deviceLang);
        i18n.locale = deviceLang;
      } finally {
        setIsLoaded(true);
      }
    };

    loadLanguage();
  }, []);

  // Update language and persist to storage
  const setLanguage = async (lang: Language) => {
    try {
      setLanguageState(lang);
      i18n.locale = lang;
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch (error) {
      console.error('Failed to save language:', error);
    }
  };

  // Translation function with parameter interpolation
  const t = (key: string, params?: Record<string, string | number>): string => {
    return i18n.t(key, params);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isLoaded }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
