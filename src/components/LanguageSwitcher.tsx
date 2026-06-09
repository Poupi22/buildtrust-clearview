import { useEffect, useState } from "react";
import { Languages } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { setLanguage, getLanguage } from "@/i18n";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { LangCode } from "@/i18n/resources";

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const [lang, setLang] = useState<LangCode>(getLanguage());

  useEffect(() => {
    const handler = (l: string) => setLang(l as LangCode);
    i18n.on("languageChanged", handler);
    return () => i18n.off("languageChanged", handler);
  }, [i18n]);

  const change = async (next: LangCode) => {
    setLanguage(next);
    if (user) {
      // best-effort persist
      await supabase.from("user_preferences").upsert({ user_id: user.id, language: next });
    }
  };

  if (compact) {
    return (
      <div className="inline-flex items-center gap-1 rounded-md border bg-card p-0.5 text-xs">
        {(["en", "fr"] as const).map((l) => (
          <button
            key={l}
            onClick={() => change(l)}
            className={
              "px-2 py-1 rounded font-medium uppercase " +
              (lang === l ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")
            }
          >
            {l}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {(["en", "fr"] as const).map((l) => (
        <Button
          key={l}
          variant={lang === l ? "default" : "outline"}
          onClick={() => change(l)}
          className="gap-2"
        >
          <Languages className="h-4 w-4" />
          {l === "en" ? t("common.english") : t("common.french")}
        </Button>
      ))}
    </div>
  );
}
