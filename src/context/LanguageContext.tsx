"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import {
  type Lang,
  type Translations,
  type LanguageMeta,
  LANGUAGES,
  translations,
  detectLanguage,
} from "@/lib/i18n";

const STORAGE_KEY = "sc_wh_lang";

interface LanguageContextValue {
  lang: Lang;
  meta: LanguageMeta;
  setLang: (lang: Lang) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: "en",
  meta: LANGUAGES[0],
  setLang: () => {},
  t: translations.en,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Lang | null;
    setLangState(stored ?? detectLanguage());
  }, []);

  function setLang(l: Lang) {
    setLangState(l);
    localStorage.setItem(STORAGE_KEY, l);
  }

  const meta = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0];

  return (
    <LanguageContext.Provider value={{ lang, meta, setLang, t: translations[lang] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  return useContext(LanguageContext);
}
