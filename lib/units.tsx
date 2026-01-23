"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

type Unit = 'lbs' | 'kg';
type Currency = 'USD' | 'BRL';

interface UnitContextType {
  unit: Unit;
  currency: Currency;
  toggleUnit: () => void;
  toggleCurrency: () => void;
  // Converts DB value (lbs) to UI value (lbs or kg)
  toDisplayWeight: (lbs: number) => number;
  // Converts UI input (lbs or kg) to DB value (lbs)
  toStorageWeight: (input: number) => number;
  // Formats weight with unit label
  formatWeight: (lbs: number) => string;
  // Converts price/lb to price/unit
  toDisplayPrice: (pricePerLb: number) => number;
  // Formats price with currency and unit
  formatPrice: (pricePerLb: number) => string;
  // General currency formatter
  formatCurrency: (value: number) => string;
  label: string;
}

const UnitContext = createContext<UnitContextType | undefined>(undefined);

export function UnitProvider({ children }: { children: React.ReactNode }) {
  const [unit, setUnit] = useState<Unit>('kg');
  const [currency, setCurrency] = useState<Currency>('BRL');

  useEffect(() => {
    const savedUnit = localStorage.getItem('roasteros-unit') as Unit || 'kg';
    const savedCurrency = localStorage.getItem('roasteros-currency') as Currency || 'BRL';
    setUnit(savedUnit);
    setCurrency(savedCurrency);
  }, []);

  const toggleUnit = () => {
    setUnit(prev => {
      const newVal = prev === 'lbs' ? 'kg' : 'lbs';
      localStorage.setItem('roasteros-unit', newVal);
      return newVal;
    });
  };

  const toggleCurrency = () => {
    setCurrency(prev => {
      const newVal = prev === 'USD' ? 'BRL' : 'USD';
      localStorage.setItem('roasteros-currency', newVal);
      return newVal;
    });
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
    const locale = currency === 'USD' ? 'en-US' : 'pt-BR';
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
    <UnitContext.Provider value={{
      unit,
      currency,
      toggleUnit,
      toggleCurrency,
      toDisplayWeight,
      toStorageWeight,
      formatWeight,
      toDisplayPrice,
      formatPrice,
      formatCurrency,
      label: unit
    }}>
      {children}
    </UnitContext.Provider>
  );
}

export const useUnits = () => {
  const context = useContext(UnitContext);
  if (!context) throw new Error("useUnits must be used within UnitProvider");
  return context;
};