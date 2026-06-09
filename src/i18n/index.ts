import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { baseResources, type LangCode } from "./resources";
import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "buildtrust.lang";

function detectInitialLang(): LangCode {
  const stored = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
  if (stored === "en" || stored === "fr") return stored;
  if (typeof navigator !== "undefined" && navigator.language?.toLowerCase().startsWith("fr")) return "fr";
  return "en";
}

i18n
  .use(initReactI18next)
  .init({
    resources: baseResources as any,
    lng: detectInitialLang(),
    fallbackLng: "en",
    interpolation: { escapeValue: false },
    returnNull: false,
  });

// Apply DB-managed overrides on top of the base resources.
// Keys use dot-notation (e.g. "nav.projects"); we splat them into the
// "translation" namespace so they take precedence over the bundled defaults.
function setNested(obj: any, path: string, value: string) {
  const parts = path.split(".");
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    cur[parts[i]] = cur[parts[i]] ?? {};
    cur = cur[parts[i]];
  }
  cur[parts[parts.length - 1]] = value;
}

export async function loadTranslationOverrides() {
  try {
    const { data, error } = await supabase.from("translations").select("key, en, fr");
    if (error || !data) return;
    const en: any = {};
    const fr: any = {};
    for (const row of data) {
      setNested(en, row.key, row.en);
      setNested(fr, row.key, row.fr);
    }
    i18n.addResourceBundle("en", "translation", en, true, true);
    i18n.addResourceBundle("fr", "translation", fr, true, true);
  } catch {
    // ignore — base resources still work
  }
}

export function setLanguage(lang: LangCode) {
  i18n.changeLanguage(lang);
  try {
    localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = lang;
  } catch {/* noop */}
}

export function getLanguage(): LangCode {
  return (i18n.language as LangCode) || "en";
}

export default i18n;
