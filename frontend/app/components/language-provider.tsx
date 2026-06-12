"use client";

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";

export type Language = "en" | "id";

type Dictionary = Record<string, string>;

const dictionaries: Record<Language, Dictionary> = {
  en: {
    "brand.tagline": "Recording Management",
    "nav.dashboard": "Dashboard",
    "nav.booking": "Booking",
    "nav.clients": "Clients",
    "nav.staffEquipment": "Staff & Equipment",
    "nav.invoices": "Invoices",
    "nav.revenue": "Revenue",
    "nav.settings": "Settings",
    "common.rows": "Rows",
    "common.previous": "Previous",
    "common.next": "Next",
    "common.page": "Page",
    "settings.language": "Language",
    "settings.languageHelp": "Default app language (English by default).",
    "settings.languageEnglish": "English",
    "settings.languageIndonesian": "Bahasa Indonesia"
  },
  id: {
    "brand.tagline": "Manajemen Rekaman",
    "nav.dashboard": "Dashboard",
    "nav.booking": "Pemesanan",
    "nav.clients": "Klien",
    "nav.staffEquipment": "Staf & Peralatan",
    "nav.invoices": "Invoice",
    "nav.revenue": "Pendapatan",
    "nav.settings": "Pengaturan",
    "common.rows": "Baris",
    "common.previous": "Sebelumnya",
    "common.next": "Berikutnya",
    "common.page": "Halaman",
    "settings.language": "Bahasa",
    "settings.languageHelp": "Bahasa default aplikasi (default English).",
    "settings.languageEnglish": "English",
    "settings.languageIndonesian": "Bahasa Indonesia"
  }
};

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);
const STORAGE_KEY = "app_language";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "en" || saved === "id") {
      setLanguageState(saved);
    }
  }, []);

  function setLanguage(nextLanguage: Language) {
    setLanguageState(nextLanguage);
    localStorage.setItem(STORAGE_KEY, nextLanguage);
  }

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage,
      t: (key: string) => dictionaries[language][key] ?? dictionaries.en[key] ?? key
    }),
    [language]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used inside LanguageProvider");
  }
  return context;
}

