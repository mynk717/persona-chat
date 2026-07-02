"use client";

import { useState } from "react";

import { ChatInterface } from "@/components/ChatInterface";
import { PersonaSelector } from "@/components/PersonaSelector";
import type { ChatMessage, ChatProvenance, ChatSession, Persona } from "@/types/persona";

interface PersonaChatShellProps {
  personas: Persona[];
}

type SessionMap = Record<string, ChatSession>;

function createMessageId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function parseProvenance(headerValue: string | null): ChatProvenance | undefined {
  if (!headerValue) {
    return undefined;
  }

  try {
    const decoded = atob(headerValue);
    const parsed = JSON.parse(decoded) as Partial<ChatProvenance> & { chips?: unknown };

    if (
      (parsed.intent === "technical" ||
        parsed.intent === "career" ||
        parsed.intent === "motivational" ||
        parsed.intent === "default") &&
      Array.isArray(parsed.chips) &&
      parsed.chips.every((chip) => typeof chip === "string")
    ) {
      return {
        intent: parsed.intent,
        chips: parsed.chips
      };
    }
  } catch {
    return undefined;
  }

  return undefined;
}

function buildInitialSessions(personas: Persona[]): SessionMap {
  return personas.reduce<SessionMap>((sessions, persona) => {
    sessions[persona.id] = {
      personaId: persona.id,
      createdAt: new Date().toISOString(),
      messages: []
    };
    return sessions;
  }, {});
}

export function PersonaChatShell({ personas }: PersonaChatShellProps): JSX.Element {
  const [selectedPersonaId, setSelectedPersonaId] = useState(personas[0]?.id ?? "");
  const [sessions, setSessions] = useState<SessionMap>(() => buildInitialSessions(personas));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedPersona = personas.find((persona) => persona.id === selectedPersonaId) ?? personas[0];

  const activeMessages = selectedPersona ? sessions[selectedPersona.id]?.messages ?? [] : [];

  const handleSend = async (content: string): Promise<void> => {
    if (!selectedPersona) {
      return;
    }

    setError(null);
    setIsLoading(true);

    const personaId = selectedPersona.id;
    const previousMessages = sessions[personaId]?.messages ?? [];

    const userMessage: ChatMessage = {
      id: createMessageId(),
      role: "user",
      content,
      timestamp: new Date().toISOString(),
      personaId
    };

    setSessions((currentSessions) => ({
      ...currentSessions,
      [personaId]: {
        ...currentSessions[personaId],
        messages: [...(currentSessions[personaId]?.messages ?? []), userMessage]
      }
    }));

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: content,
          personaId,
          history: previousMessages
        })
      });

      if (!response.ok || !response.body) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Request failed.");
      }

      const provenance = parseProvenance(response.headers.get("X-Provenance"));
      const assistantMessageId = createMessageId();
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      setSessions((currentSessions) => ({
        ...currentSessions,
        [personaId]: {
          ...currentSessions[personaId],
          messages: [
            ...(currentSessions[personaId]?.messages ?? []),
            {
              id: assistantMessageId,
              role: "assistant",
              content: "",
              timestamp: new Date().toISOString(),
              personaId,
              provenance
            }
          ]
        }
      }));

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        accumulated += decoder.decode(value, { stream: true });

        setSessions((currentSessions) => ({
          ...currentSessions,
          [personaId]: {
            ...currentSessions[personaId],
            messages: (currentSessions[personaId]?.messages ?? []).map((message) =>
              message.id === assistantMessageId ? { ...message, content: accumulated } : message
            )
          }
        }));
      }
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : "Something went wrong.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!selectedPersona) {
    return <div className="text-sm text-zinc-400">No persona data found.</div>;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6">
      <PersonaSelector
        personas={personas}
        selectedPersonaId={selectedPersona.id}
        onSelect={setSelectedPersonaId}
      />
      <div className="min-h-0 flex-1">
        <ChatInterface
          persona={selectedPersona}
          messages={activeMessages}
          isLoading={isLoading}
          error={error}
          onSend={handleSend}
        />
      </div>
    </div>
  );
}
