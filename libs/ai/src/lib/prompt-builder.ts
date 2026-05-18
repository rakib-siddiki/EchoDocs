import { Chunk } from '@echodocs/types';

export class PromptBuilder {
  /**
   * Accepts retrieved document chunks and a user query, and returns a formatted RAG prompt string.
   * Incorporates strict guidelines to minimize hallucination and enforce source citation.
   * 
   * @param chunks Chunks retrieved from the vector search.
   * @param query The user's query string.
   */
  static buildPrompt(chunks: Chunk[], query: string): string {
    if (!query || query.trim() === '') {
      throw new Error('Query cannot be empty');
    }

    const contextParts = chunks.map((chunk, index) => {
      const docName = chunk.document?.name || 'Unknown Document';
      return `[Source ${index + 1}]: "${docName}" (Chunk Index: ${chunk.chunkIndex})\nContent: ${chunk.content}`;
    });

    const contextString = contextParts.length > 0 
      ? contextParts.join('\n\n')
      : 'No relevant context found.';

    return `You are EchoDocs, a precise RAG-based AI assistant. Your goal is to answer the user's question using only the provided source documents.

Guidelines:
1. Base your answer STRICTLY on the facts and information in the sources.
2. If the sources do not contain the answer, say "I cannot find the answer in the provided documents."
3. Cite your sources in the text using bracketed numbers, like [1], [2], corresponding to the source index.

---
RELEVANT SOURCES:
${contextString}
---

USER QUESTION:
${query}

PRECISE ANSWER:`;
  }
}
