import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

import { addMessage, buildMessages } from "@/lib/context-manager";
import { buildEntityPromptBlock, matchEntities } from "@/lib/persona-entities";
import { buildGroundingPromptBlock } from "@/lib/persona-grounding";
import {
  buildConversationControlBlock,
  buildStyleGuardBlock,
  buildSystemPrompt,
  detectIntent,
  loadPersona
} from "@/lib/persona-loader";
import { buildResourcePromptBlock, recommendResources } from "@/lib/resource-recommender";
import type { ChatMessage } from "@/types/persona";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ChatRequestBody {
  message: string;
  personaId: string;
  history: ChatMessage[];
}

function isChatMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== "object") {
    return false;
  }

  const message = value as Record<string, unknown>;

  return (
    typeof message.id === "string" &&
    (message.role === "user" || message.role === "assistant") &&
    typeof message.content === "string" &&
    typeof message.timestamp === "string" &&
    typeof message.personaId === "string"
  );
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured." },
      { status: 500 }
    );
  }

  let body: Partial<ChatRequestBody>;

  try {
    body = (await request.json()) as Partial<ChatRequestBody>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const message = body.message?.trim();
  const personaId = body.personaId?.trim();
  const history = Array.isArray(body.history) ? body.history.filter(isChatMessage) : [];

  if (!message || !personaId) {
    return NextResponse.json(
      { error: "Both message and personaId are required." },
      { status: 400 }
    );
  }

  try {
    const persona = await loadPersona(personaId);
    const intent = detectIntent(message);
    const [entityBlock, resources, groundingBlock] = await Promise.all([
      buildEntityPromptBlock(personaId, message),
      recommendResources(personaId, message, intent),
      buildGroundingPromptBlock(personaId, message, intent)
    ]);
    const matchedEntities = await matchEntities(personaId, message);
    const systemPrompt = [
      buildSystemPrompt(persona, intent),
      buildConversationControlBlock(message),
      buildStyleGuardBlock(persona, history),
      entityBlock,
      groundingBlock,
      buildResourcePromptBlock(resources)
    ]
      .filter(Boolean)
      .join("\n\n");

    const userMessage: ChatMessage = {
      id: `server-${Date.now()}`,
      role: "user",
      content: message,
      timestamp: new Date().toISOString(),
      personaId
    };

    const messages = buildMessages(addMessage(history, userMessage), systemPrompt);
    const provenance = {
      intent,
      chips: [
        ...new Set(
          [
            persona.meta.full_name,
            intent,
            ...matchedEntities.map((entity) => entity.name),
            ...resources.slice(0, 2).map((resource) => resource.title),
            persona.meta.sources_scraped?.[0] ? "source-backed" : ""
          ].filter(Boolean)
        )
      ]
    };
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      stream: true,
      temperature: 0.72,
      messages
    });

    const encoder = new TextEncoder();

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        let closed = false;
        try {
          for await (const chunk of completion) {
            const token = chunk.choices[0]?.delta?.content ?? "";
            if (token) {
              controller.enqueue(encoder.encode(token));
            }
          }
          controller.close();
          closed = true;
        } catch (streamError) {
          controller.error(streamError);
          closed = true;
        } finally {
          if (!closed) {
            controller.close();
          }
        }
      }
    });

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "X-Provenance": Buffer.from(JSON.stringify(provenance)).toString("base64")
      }
    });
  } catch (caughtError) {
    const messageText =
      caughtError instanceof Error ? caughtError.message : "Unexpected server error.";
    const status = messageText.includes("ENOENT") ? 404 : 500;

    return NextResponse.json(
      { error: status === 404 ? "Persona not found." : messageText },
      { status }
    );
  }
}
