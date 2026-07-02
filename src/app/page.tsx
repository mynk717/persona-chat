import { Github } from "lucide-react";

import { PersonaChatShell } from "@/components/PersonaChatShell";
import { loadPersona } from "@/lib/persona-loader";

export default async function HomePage(): Promise<JSX.Element> {
  const personas = await Promise.all([
    loadPersona("hitesh-choudhary"),
    loadPersona("piyush-garg")
  ]);

  return (
    <main className="min-h-screen bg-transparent text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-4 sm:px-6 lg:px-8">
        <nav className="mb-4 flex items-center justify-between rounded-[1.75rem] border border-white/10 bg-black/30 px-5 py-4 backdrop-blur-xl">
          <div>
            <div className="font-display text-2xl font-semibold tracking-tight text-white">
              PersonaChat
            </div>
            <div className="text-xs uppercase tracking-[0.24em] text-zinc-500">
              Multi-persona AI conversations
            </div>
          </div>

          <a
            href="#"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-300 transition hover:border-white/20 hover:text-white"
          >
            <Github className="h-4 w-4" />
            GitHub
          </a>
        </nav>

        <div className="flex min-h-0 flex-1 flex-col">
          <PersonaChatShell personas={personas} />
        </div>
      </div>
    </main>
  );
}
