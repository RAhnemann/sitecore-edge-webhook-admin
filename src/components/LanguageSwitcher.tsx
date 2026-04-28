"use client";

import { LANGUAGES } from "@/lib/i18n";
import { useTranslation } from "@/context/LanguageContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function LanguageSwitcher() {
  const { lang, setLang } = useTranslation();

  return (
    <Select value={lang} onValueChange={(v) => setLang(v as typeof lang)}>
      <SelectTrigger size="sm" className="h-8 text-xs w-auto min-w-[7rem]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        {LANGUAGES.map((l) => (
          <SelectItem key={l.code} value={l.code} className="text-xs">
            {l.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
