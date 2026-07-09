import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Copy, Check } from "lucide-react";
import type { ChatItem } from "@/stores/useAIStore";

export default function ChatMessageBubble({ item }: { item: ChatItem }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const isUser = item.role === "user";

  const copy = () => {
    navigator.clipboard.writeText(item.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`group relative max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
          isUser
            ? "bg-accent text-accent-contrast"
            : "border border-border bg-elevated text-primary"
        }`}
      >
        <div className="whitespace-pre-wrap break-words">
          {item.content || <span className="opacity-60">…</span>}
        </div>
        {!isUser && item.content && (
          <button
            onClick={copy}
            aria-label={t("ai.copy")}
            className="absolute -end-2 -top-2 hidden h-6 w-6 items-center justify-center rounded-md border border-border bg-base text-muted shadow-sm transition hover:text-accent group-hover:flex"
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
          </button>
        )}
      </div>
    </div>
  );
}
