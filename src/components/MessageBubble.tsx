"use client";

import { useState } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

import type { ChatMessage, Persona } from "@/types/persona";

interface MessageBubbleProps {
  message: ChatMessage;
  persona: Persona;
}

function hexToRgba(hexColor: string, alpha: number): string {
  const normalized = hexColor.replace("#", "");
  const value = normalized.length === 3
    ? normalized
        .split("")
        .map((char) => char + char)
        .join("")
    : normalized;

  const numeric = Number.parseInt(value, 16);
  const r = (numeric >> 16) & 255;
  const g = (numeric >> 8) & 255;
  const b = numeric & 255;

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getInitials(fullName: string): string {
  return fullName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatTimestamp(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });
}

const markdownComponents: Components = {
  code({ children, className, ...props }) {
    const match = /language-(\w+)/.exec(className ?? "");
    const content = String(children).replace(/\n$/, "");

    if (!match) {
      return (
        <code
          className="rounded bg-black/30 px-1.5 py-0.5 text-sm text-orange-200"
          {...props}
        >
          {children}
        </code>
      );
    }

    return (
      <SyntaxHighlighter
        PreTag="div"
        language={match[1]}
        style={oneDark}
        customStyle={{
          margin: 0,
          borderRadius: "0.95rem",
          background: "rgba(3, 7, 18, 0.92)",
          fontSize: "0.85rem"
        }}
      >
        {content}
      </SyntaxHighlighter>
    );
  },
  p({ children }) {
    return <p className="leading-7 text-zinc-100">{children}</p>;
  },
  ul({ children }) {
    return <ul className="list-disc space-y-2 pl-5 text-zinc-100">{children}</ul>;
  },
  ol({ children }) {
    return <ol className="list-decimal space-y-2 pl-5 text-zinc-100">{children}</ol>;
  },
  a({ children, href }) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="text-orange-300 underline decoration-orange-500/50 underline-offset-4"
      >
        {children}
      </a>
    );
  }
};

export function MessageBubble({ message, persona }: MessageBubbleProps): JSX.Element {
  const isAssistant = message.role === "assistant";
  const [selectedReaction, setSelectedReaction] = useState<string | null>(null);
  const reactions = ["👍", "✨", "🎯", "🤝"];

  return (
    <div className={`group flex animate-message-in ${isAssistant ? "justify-start" : "justify-end"}`}>
      <div className={`flex max-w-[88%] items-end gap-3 ${isAssistant ? "" : "flex-row-reverse"}`}>
        {isAssistant ? (
          <div
            className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl text-xs font-semibold text-white"
            style={{
              background: `linear-gradient(135deg, ${hexToRgba(
                persona.meta.theme_color,
                0.7
              )}, ${hexToRgba(persona.meta.theme_color, 0.3)})`
            }}
          >
            <span>{getInitials(persona.meta.full_name)}</span>
            <img
              src={persona.meta.avatar_url}
              alt={persona.meta.full_name}
              className="absolute inset-0 h-full w-full rounded-2xl object-cover"
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />
          </div>
        ) : null}

        <div className="relative">
          <div
            className={`rounded-[1.4rem] border px-4 py-3 shadow-glow transition ${
              isAssistant
                ? "border-white/10 text-white"
                : "border-white/10 bg-white/[0.05] text-zinc-100"
            }`}
            style={
              isAssistant
                ? {
                    backgroundColor: hexToRgba(persona.meta.theme_color, 0.1),
                    borderColor: hexToRgba(persona.meta.theme_color, 0.22)
                  }
                : undefined
            }
          >
            <div className="prose prose-invert prose-sm max-w-none">
              <ReactMarkdown components={markdownComponents}>{message.content}</ReactMarkdown>
            </div>

            {isAssistant && message.provenance ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {message.provenance.chips.map((chip) => (
                  <span
                    key={chip}
                    className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-zinc-300"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          <div className="pointer-events-none absolute -bottom-8 left-2 flex items-center gap-2 opacity-0 transition group-hover:opacity-100">
            <span className="rounded-full border border-white/10 bg-black/80 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-zinc-400">
              {formatTimestamp(message.timestamp)}
            </span>
            {isAssistant ? (
              <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-white/10 bg-black/80 p-1">
                {reactions.map((emoji) => {
                  const active = selectedReaction === emoji;

                  return (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setSelectedReaction(emoji)}
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] transition ${
                        active ? "bg-white/15 scale-110" : "hover:bg-white/10 hover:scale-105"
                      }`}
                      aria-label={`React with ${emoji}`}
                    >
                      {emoji}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
