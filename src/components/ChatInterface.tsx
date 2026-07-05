"use client";

import { useEffect, useRef, useState } from "react";
import { LoaderCircle, Mic, MicOff, SendHorizontal } from "lucide-react";

import type { ChatMessage, Persona } from "@/types/persona";
import { MessageBubble } from "@/components/MessageBubble";

interface ChatInterfaceProps {
  persona: Persona;
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  onSend: (message: string) => Promise<void>;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
}

interface WindowWithSpeechRecognition extends Window {
  SpeechRecognition?: new () => SpeechRecognitionInstance;
  webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
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

export function ChatInterface({
  persona,
  messages,
  isLoading,
  error,
  onSend
}: ChatInterfaceProps): JSX.Element {
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) {
      return;
    }

    container.scrollTo({
      top: container.scrollHeight,
      behavior: "smooth"
    });
  }, [messages, isLoading]);

  useEffect(() => {
    const win = window as WindowWithSpeechRecognition;
    setVoiceSupported(Boolean(win.SpeechRecognition || win.webkitSpeechRecognition));

    return () => {
      recognitionRef.current?.abort();
      recognitionRef.current = null;
    };
  }, []);

  const handleSubmit = async (): Promise<void> => {
    const value = input.trim();
    if (!value || isLoading) {
      return;
    }

    setInput("");
    await onSend(value);
  };

  const stopListening = (): void => {
    recognitionRef.current?.stop();
  };

  const handleVoiceToggle = (): void => {
    if (isLoading || !voiceSupported) {
      return;
    }

    if (isListening) {
      stopListening();
      return;
    }

    const win = window as WindowWithSpeechRecognition;
    const Recognition = win.SpeechRecognition ?? win.webkitSpeechRecognition;

    if (!Recognition) {
      return;
    }

    const recognition = new Recognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "hi-IN";

    let transcript = "";

    recognition.onresult = (event) => {
      let partial = "";

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const alternative = result[0];

        if (result.isFinal) {
          transcript += `${alternative.transcript} `;
        } else {
          partial += alternative.transcript;
        }
      }

      setInput(`${transcript}${partial}`.trimStart());
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognition.onerror = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    setIsListening(true);
    recognition.start();
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-black/30 shadow-glow backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <div className="flex items-center gap-3">
          <span
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: persona.meta.theme_color }}
          />
          <div>
            <div className="font-display text-lg font-semibold text-white">
              {persona.meta.full_name}
            </div>
            <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">
              {persona.meta.primary_language}
            </div>
          </div>
        </div>

        {isLoading ? (
          <LoaderCircle className="h-4 w-4 animate-spin text-zinc-400" />
        ) : null}
      </div>

      <div ref={scrollContainerRef} className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="max-w-md rounded-[1.8rem] border border-dashed border-white/10 bg-white/[0.03] px-6 py-7 text-center">
              <div className="font-display text-xl text-white">
                {persona.voice.signature_phrases[0]}
              </div>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                Ask something technical, career-focused, or when you need a push.
              </p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble key={message.id} message={message} persona={persona} />
          ))
        )}

        {isLoading ? (
          <div className="flex items-end gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl animate-soft-pulse"
              style={{
                background: `linear-gradient(135deg, ${hexToRgba(
                  persona.meta.theme_color,
                  0.7
                )}, ${hexToRgba(persona.meta.theme_color, 0.3)})`
              }}
            >
              <span className="text-xs font-semibold text-white">
                {persona.meta.full_name
                  .split(" ")
                  .map((part) => part[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </span>
            </div>
            <div
              className="flex items-center gap-2 rounded-[1.35rem] border px-4 py-3"
              style={{
                backgroundColor: hexToRgba(persona.meta.theme_color, 0.1),
                borderColor: hexToRgba(persona.meta.theme_color, 0.22)
              }}
            >
              <span className="mr-1 text-[10px] uppercase tracking-[0.18em] text-zinc-400">
                typing
              </span>
              {[0, 1, 2].map((index) => (
                <span
                  key={index}
                  className="h-2.5 w-2.5 animate-bounce rounded-full"
                  style={{
                    backgroundColor: persona.meta.theme_color,
                    animationDelay: `${index * 120}ms`
                  }}
                />
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="border-t border-white/10 p-4">
        {error ? (
          <div className="mb-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        <div className="flex items-end gap-3 rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-3">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void handleSubmit();
              }
            }}
            rows={1}
            placeholder={`Message ${persona.meta.full_name.split(" ")[0]}...`}
            className="max-h-40 min-h-[3.2rem] flex-1 resize-none bg-transparent px-2 py-2 text-sm text-white outline-none placeholder:text-zinc-500"
          />

          <button
            type="button"
            onClick={handleVoiceToggle}
            disabled={isLoading || !voiceSupported}
            aria-pressed={isListening}
            title={voiceSupported ? "Speak instead of typing" : "Voice input not supported in this browser"}
            className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 text-white transition disabled:cursor-not-allowed disabled:opacity-40"
            style={{
              backgroundColor: isListening ? persona.meta.theme_color : "rgba(255,255,255,0.03)",
              boxShadow: isListening
                ? `0 12px 24px ${hexToRgba(persona.meta.theme_color, 0.28)}`
                : undefined
            }}
          >
            {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </button>

          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={isLoading || input.trim().length === 0}
            className="inline-flex h-12 w-12 items-center justify-center rounded-2xl text-white transition disabled:cursor-not-allowed disabled:opacity-45"
            style={{
              backgroundColor: persona.meta.theme_color,
              boxShadow: `0 12px 24px ${hexToRgba(persona.meta.theme_color, 0.28)}`
            }}
          >
            <SendHorizontal className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-2 text-[11px] uppercase tracking-[0.18em] text-zinc-500">
          {voiceSupported
            ? isListening
              ? "Listening... speak naturally"
              : "Voice input available"
            : "Voice input unavailable in this browser"}
        </div>
      </div>
    </div>
  );
}
