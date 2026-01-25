"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

type Unit = 'lbs' | 'kg';
type Currency = 'USD' | 'BRL' | 'CAD';
type Language = 'en' | 'pt-BR';
type Theme = 'light' | 'dark';

interface ConfigContextType {
  unit: Unit;
  currency: Currency;
  language: Language;
  theme: Theme;
  setUnit: (u: Unit) => void;
  setCurrency: (c: Currency) => void;
  setLanguage: (l: Language) => void;
  setTheme: (t: Theme) => void;
  toggleUnit: () => void;
  toggleCurrency: () => void;
  t: (key: string) => string;
  // Weight & Price helpers
  toDisplayWeight: (lbs: number) => number;
  toStorageWeight: (input: number) => number;
  formatWeight: (lbs: number) => string;
  toDisplayPrice: (pricePerLb: number) => number;
  formatPrice: (pricePerLb: number) => string;
  formatCurrency: (value: number) => string;
  label: string;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

import en from '../locales/en.json';
import pt from '../locales/pt.json';

const translations: any = {
  en,
  'pt-BR': pt
};

export function UnitProvider({ children }: { children: React.ReactNode }) {
  const [unit, setUnitState] = useState<Unit>('kg');
  const [currency, setCurrencyState] = useState<Currency>('BRL');
  const [language, setLanguageState] = useState<Language>('en');
  const [theme, setThemeState] = useState<Theme>('light');

  useEffect(() => {
    const savedUnit = localStorage.getItem('roasteros-unit') as Unit || 'kg';
    const savedCurrency = localStorage.getItem('roasteros-currency') as Currency || 'BRL';
    const savedLanguage = localStorage.getItem('roasteros-language') as Language || 'en';
    const savedTheme = localStorage.getItem('roasteros-theme') as Theme || 'light';
    
    setUnitState(savedUnit);
    setCurrencyState(savedCurrency);
    setLanguageState(savedLanguage);
    setThemeState(savedTheme);

    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const setUnit = (u: Unit) => {
    setUnitState(u);
    localStorage.setItem('roasteros-unit', u);
  };

  const setCurrency = (c: Currency) => {
    setCurrencyState(c);
    localStorage.setItem('roasteros-currency', c);
  };

  const setLanguage = (l: Language) => {
    setLanguageState(l);
    localStorage.setItem('roasteros-language', l);
  };

  const setTheme = (t: Theme) => {
    setThemeState(t);
    localStorage.setItem('roasteros-theme', t);
    if (t === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const toggleUnit = () => {
    const newUnit = unit === 'lbs' ? 'kg' : 'lbs';
    setUnit(newUnit);
  };

  const toggleCurrency = () => {
    const currencies: Currency[] = ['USD', 'BRL', 'CAD'];
    const currentIndex = currencies.indexOf(currency);
    const nextIndex = (currentIndex + 1) % currencies.length;
    setCurrency(currencies[nextIndex]);
  };

  const t = (key: string) => {
    const keys = key.split('.');
    let value = translations[language];
    for (const k of keys) {
      value = value?.[k];
    }
    return value || key;
  };

  const LBS_TO_KG = 0.45359237;
  const KG_TO_LBS = 2.20462262;

  const toDisplayWeight = (lbs: number) => {
    return unit === 'lbs' ? lbs : lbs * LBS_TO_KG;
  };

  const toStorageWeight = (input: number) => {
    return unit === 'lbs' ? input : input * KG_TO_LBS;
  };

  const toDisplayPrice = (pricePerLb: number) => {
    return unit === 'lbs' ? pricePerLb : pricePerLb * KG_TO_LBS;
  };

  const formatCurrency = (value: number) => {
    const locale = currency === 'BRL' ? 'pt-BR' : 'en-US';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
    }).format(value);
  };

  const formatWeight = (lbs: number) => {
    const val = toDisplayWeight(lbs);
    return `${val.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${unit}`;
  };

  const formatPrice = (pricePerLb: number) => {
    const val = toDisplayPrice(pricePerLb);
    return formatCurrency(val) + `/${unit}`;
  };

  return (
    <ConfigContext.Provider value={{
      unit,
      currency,
      language,
      theme,
      setUnit,
      setCurrency,
      setLanguage,
      setTheme,
      toggleUnit,
      toggleCurrency,
      t,
      toDisplayWeight,
      toStorageWeight,
      formatWeight,
      toDisplayPrice,
      formatPrice,
      formatCurrency,
      label: unit
    }}>
      {children}
    </ConfigContext.Provider>
  );
}

export const useUnits = () => {
  const context = useContext(ConfigContext);
  if (!context) throw new Error("useUnits must be used within UnitProvider");
  return context;
};
