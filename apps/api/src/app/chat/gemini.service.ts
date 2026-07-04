import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly apiKey: string;
  private readonly ai: GoogleGenAI;

  constructor() {
    this.apiKey = process.env['GEMINI_API_KEY'] || '';
    this.ai = new GoogleGenAI({ apiKey: this.apiKey });
  }

  async *generateContentStream(prompt: string): AsyncGenerator<string, void, unknown> {
    if (!this.apiKey) {
      this.logger.error('Gemini API key is not configured');
      throw new Error('Gemini API key is not configured');
    }

    try {
      const responseStream = await this.ai.models.generateContentStream({
        model: 'gemini-3.1-flash-lite',
        contents: prompt,
      });

      for await (const chunk of responseStream) {
        if (chunk.text) {
          yield chunk.text;
        }
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to stream from Gemini API: ${errorMessage}`);
      throw error;
    }
  }
}
