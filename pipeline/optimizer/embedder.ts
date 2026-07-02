import type { OptimizedChunk } from "./chunker";

export interface EmbeddedChunk extends OptimizedChunk {
  embedding: number[];
}

export async function embedChunks(chunks: OptimizedChunk[]): Promise<EmbeddedChunk[]> {
  void chunks;

  throw new Error(
    "Embeddings are not implemented yet. Add OpenAI embeddings or a local model here when RAG is needed."
  );
}
