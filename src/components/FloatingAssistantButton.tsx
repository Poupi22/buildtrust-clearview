import { Bot } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

export function FloatingAssistantButton() {
  const location = useLocation();
  const { t } = useTranslation();

  if (location.pathname === "/assistant") return null;

  return (
    <Button
      asChild
      size="icon"
      className="fixed bottom-20 right-4 z-50 h-14 w-14 rounded-full shadow-lg lg:bottom-6 lg:right-6"
    >
      <Link to="/assistant" aria-label={t("nav.assistant")} title={t("nav.assistant")}>
        <Bot className="h-6 w-6" />
      </Link>
    </Button>
  );
}