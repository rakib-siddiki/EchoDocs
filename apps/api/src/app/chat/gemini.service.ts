import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';

  constructor() {
    this.apiKey = process.env['GEMINI_API_KEY'] || '';
  }

  async *generateContentStream(prompt: string): AsyncGenerator<string, void, unknown> {
    if (!this.apiKey) {
      this.logger.error('Gemini API key is not configured');
      throw new Error('Gemini API key is not configured');
    }

    const url = `${this.baseUrl}/gemini-3.5-flash:streamGenerateContent?alt=sse&key=${this.apiKey}`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`Gemini API returned error: ${response.status} - ${errorText}`);
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          
          let lineEndIdx;
          while ((lineEndIdx = buffer.indexOf('\n')) !== -1) {
            const line = buffer.slice(0, lineEndIdx).trim();
            buffer = buffer.slice(lineEndIdx + 1);

            if (line.startsWith('data: ')) {
              const jsonStr = line.slice(6).trim();
              try {
                const parsed = JSON.parse(jsonStr);
                const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
                if (text) {
                  yield text;
                }
              } catch (e) {
                this.logger.warn(`Failed to parse SSE JSON line: ${jsonStr}, error: ${e}`);
              }
            }
          }
        }
        
        // Process remaining buffer
        if (buffer.trim().startsWith('data: ')) {
          const line = buffer.trim();
          const jsonStr = line.slice(6).trim();
          try {
            const parsed = JSON.parse(jsonStr);
            const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              yield text;
            }
          } catch (e) {
            // ignore
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to stream from Gemini API: ${errorMessage}`);
      throw error;
    }
  }
}
