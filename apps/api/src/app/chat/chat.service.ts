import { Injectable, Logger } from '@nestjs/common';
import { EmbeddingService, VectorSearchService, PromptBuilder, getSystemRelevantChunks } from '@echodocs/ai';
import { Chunk } from '@echodocs/types';
import { GeminiService } from './gemini.service';

export interface ChatStreamTokenEvent {
  type: 'token';
  content: string;
}

export interface ChatStreamCitationsEvent {
  type: 'citations';
  citations: unknown[];
}

export interface ChatStreamDoneEvent {
  type: 'done';
}

export interface ChatStreamErrorEvent {
  type: 'error';
  message: string;
}

export type ChatStreamEvent =
  | ChatStreamTokenEvent
  | ChatStreamCitationsEvent
  | ChatStreamDoneEvent
  | ChatStreamErrorEvent;

interface ChunkWithDistance extends Chunk {
  distance?: number;
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private readonly distanceThreshold = 0.7; // similarity >= 0.3

  constructor(
    private readonly embeddingService: EmbeddingService,
    private readonly vectorSearchService: VectorSearchService,
    private readonly geminiService: GeminiService
  ) {}

  async *queryStream(query: string): AsyncGenerator<ChatStreamEvent, void, unknown> {
    if (!query || query.trim() === '') {
      throw new Error('Query cannot be empty');
    }

    this.logger.log(`Processing streaming chat query: "${query}"`);

    // 1. Convert the query into a vector embedding
    const queryEmbedding = await this.embeddingService.embedText(query);

    // 2. Retrieve top-5 most similar chunks from database
    const dbChunks = await this.vectorSearchService.searchSimilarChunks(queryEmbedding, 5);

    // Retrieve matching system FAQ chunks
    const systemChunks = getSystemRelevantChunks(query);

    // Combine both sets of chunks
    const combinedChunks = [...systemChunks, ...dbChunks];

    // Filter by similarity threshold (distance <= threshold)
    const relevantChunks = combinedChunks.filter(
      (chunk: ChunkWithDistance) => chunk.distance !== undefined && chunk.distance <= this.distanceThreshold
    );

    // Map to citations
    const citations = relevantChunks.map((chunk) => ({
      documentId: chunk.documentId,
      documentName: chunk.document?.name || 'Unknown Document',
      chunkIndex: chunk.chunkIndex,
      excerpt: chunk.content,
    }));

    // 3. Check if we have any relevant chunks
    if (relevantChunks.length === 0) {
      this.logger.warn(`No relevant chunks found for query: "${query}" (closest distance: ${(dbChunks[0] as ChunkWithDistance)?.distance})`);
      yield { type: 'token', content: "I couldn't find an answer in the uploaded documents (not found in documents)." };
      yield { type: 'citations', citations: [] };
      yield { type: 'done' };
      return;
    }

    // 4. Build prompt
    const prompt = PromptBuilder.buildPrompt(relevantChunks, query);

    // 5. Call Gemini in streaming mode
    let fullAnswer = '';
    try {
      for await (const token of this.geminiService.generateContentStream(prompt)) {
        fullAnswer += token;
        yield { type: 'token', content: token };
      }

      // If Gemini specifies it can't find the answer, clear citations
      const isNotFound = 
        fullAnswer.toLowerCase().includes('cannot find the answer') ||
        fullAnswer.toLowerCase().includes('not found');

      if (isNotFound) {
        this.logger.warn(`Gemini indicated answer not found in documents for query: "${query}"`);
        yield { type: 'citations', citations: [] };
      } else {
        yield { type: 'citations', citations };
      }
      
      yield { type: 'done' };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error in streaming chat query: ${errorMessage}`);
      yield { type: 'error', message: errorMessage || 'Error occurred during streaming' };
    }
  }
}
