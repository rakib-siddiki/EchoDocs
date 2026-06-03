import { Injectable, Logger } from '@nestjs/common';
import { EmbeddingService, VectorSearchService, PromptBuilder } from '@echodocs/ai';
import { GeminiService } from './gemini.service';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private readonly distanceThreshold = 0.7; // similarity >= 0.3

  constructor(
    private readonly embeddingService: EmbeddingService,
    private readonly vectorSearchService: VectorSearchService,
    private readonly geminiService: GeminiService
  ) {}

  async query(query: string, sessionId?: string) {
    if (!query || query.trim() === '') {
      throw new Error('Query cannot be empty');
    }

    this.logger.log(`Processing chat query: "${query}"`);

    // 1. Convert the query into a vector embedding
    const queryEmbedding = await this.embeddingService.embedText(query);

    // 2. Retrieve top-5 most similar chunks
    const chunks = await this.vectorSearchService.searchSimilarChunks(queryEmbedding, 5);

    // Filter by similarity threshold (distance <= threshold)
    const relevantChunks = chunks.filter(
      (chunk: any) => chunk.distance !== undefined && chunk.distance <= this.distanceThreshold
    );

    // 3. Check if we have any relevant chunks
    if (relevantChunks.length === 0) {
      this.logger.warn(`No relevant chunks found for query: "${query}" (closest distance: ${chunks[0]?.distance})`);
      return {
        answer: "I couldn't find an answer in the uploaded documents (not found in documents).",
        citations: [],
      };
    }

    // 4. Build prompt
    const prompt = PromptBuilder.buildPrompt(relevantChunks, query);

    // 5. Call Gemini
    let answer = await this.geminiService.generateContent(prompt);

    // Map to citations
    const citations = relevantChunks.map((chunk) => ({
      documentId: chunk.documentId,
      documentName: chunk.document?.name || 'Unknown Document',
      chunkIndex: chunk.chunkIndex,
      excerpt: chunk.content,
    }));

    // If Gemini specifies it can't find the answer, clear citations
    const isNotFound = 
      answer.toLowerCase().includes('cannot find the answer') ||
      answer.toLowerCase().includes('not found');

    if (isNotFound) {
      this.logger.warn(`Gemini indicated answer not found in documents for query: "${query}"`);
      return {
        answer,
        citations: [],
      };
    }

    return {
      answer,
      citations,
    };
  }
}
