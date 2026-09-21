import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useTranslation } from "react-i18next";
import { Bot, Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "buildtrust-assistant-messages";

function loadMessages(): UIMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function Assistant() {
  const { t, i18n } = useTranslation();
  const { profile } = useAuth();
  const [sessionError, setSessionError] = useState(false);
  const savedRef = useRef<UIMessage[] | null>(null);
  if (savedRef.current === null) savedRef.current = loadMessages();

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/assistant-chat`,
        // Resolve authentication for every request. getSession() may return a
        // cached token, so explicitly refresh it when it is near expiry.
        headers: async () => {
          const { data, error: sessionReadError } = await supabase.auth.getSession();
          if (sessionReadError || !data.session) {
            setSessionError(true);
            throw new Error(t("assistant.sessionExpired"));
          }

          const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
          if (refreshError || !refreshed.session) {
            setSessionError(true);
            await supabase.auth.signOut();
            throw new Error(t("assistant.sessionExpired"));
          }

          setSessionError(false);
          return {
            Authorization: `Bearer ${refreshed.session.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string,
          };
        },
      }),
    [t],
  );


  const { messages, sendMessage, setMessages, status, error } = useChat({
    id: "buildtrust-assistant",
    transport,
    messages: savedRef.current,
  });

  // Persist the single ongoing conversation in this browser only.
  useEffect(() => {
    if (status === "streaming") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // storage full or unavailable — chat still works for the session
    }
  }, [messages, status]);

  const textareaFocusKey = useRef(0);
  const newConversation = () => {
    setMessages([]);
    window.localStorage.removeItem(STORAGE_KEY);
    textareaFocusKey.current += 1;
  };

  const handleSubmit = async (message: { text?: string }) => {
    const text = message.text?.trim();
    if (!text || status === "submitted" || status === "streaming") return;
    setSessionError(false);
    try {
      await sendMessage({ text });
    } catch {
      // useChat exposes request failures through `error`; swallowing the
      // rejected promise prevents an auth failure from crashing the page.
    }
  };

  const firstName = profile?.full_name?.split(" ")[0];

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] lg:h-[calc(100vh-7rem)] max-w-3xl mx-auto">
      <div className="flex items-center justify-between gap-3 pb-3 border-b">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Bot className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="font-display font-bold text-lg truncate">{t("assistant.title")}</h1>
            <p className="text-xs text-muted-foreground truncate">{t("assistant.subtitle")}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={newConversation} disabled={messages.length === 0}>
          <Plus className="h-4 w-4 mr-1.5" />
          {t("assistant.newConversation")}
        </Button>
      </div>

      <Conversation className="flex-1">
        <ConversationContent>
          {messages.length === 0 ? (
            <ConversationEmptyState
              icon={<Bot className="h-10 w-10 text-primary" />}
              title={t("assistant.emptyTitle", { name: firstName ?? "" })}
              description={t("assistant.emptyDescription")}
            />
          ) : (
            messages.map((m) => (
              <Message key={m.id} from={m.role}>
                <MessageContent>
                  {m.parts.map((part, i) => {
                    if (part.type === "text") {
                      return m.role === "assistant" ? (
                        <MessageResponse key={i}>{part.text}</MessageResponse>
                      ) : (
                        <p key={i} className="whitespace-pre-wrap">{part.text}</p>
                      );
                    }
                    if (part.type === "reasoning" && part.text) {
                      return (
                        <p key={i} className="text-xs text-muted-foreground italic whitespace-pre-wrap">
                          {part.text}
                        </p>
                      );
                    }
                    return null;
                  })}
                </MessageContent>
              </Message>
            ))
          )}
          {status === "submitted" && (
            <Message from="assistant">
              <MessageContent>
                <Shimmer className="text-sm">{t("assistant.thinking")}</Shimmer>
              </MessageContent>
            </Message>
          )}
          {(error || sessionError) && (
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {sessionError || error?.message?.includes("401") || error?.message?.includes("session has expired")
                ? t("assistant.sessionExpired")
                : error?.message || t("assistant.error")}
            </div>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="pt-3">
        <PromptInput onSubmit={handleSubmit}>
          <PromptInputTextarea
            key={textareaFocusKey.current}
            autoFocus
            placeholder={t("assistant.placeholder")}
            disabled={status === "submitted"}
          />
          <PromptInputFooter className="justify-end">
            <PromptInputSubmit status={status} disabled={status === "submitted"} />
          </PromptInputFooter>
        </PromptInput>
        <p className="mt-2 text-[11px] text-muted-foreground text-center flex items-center justify-center gap-1">
          <Trash2 className="h-3 w-3" />
          {t("assistant.privacyNote")}
        </p>
      </div>
    </div>
  );
}
