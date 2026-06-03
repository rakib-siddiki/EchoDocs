import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';

  constructor() {
    this.apiKey = process.env['GEMINI_API_KEY'] || '';
  }

  async generateContent(prompt: string): Promise<string> {
    if (!this.apiKey) {
      this.logger.error('Gemini API key is not configured');
      throw new Error('Gemini API key is not configured');
    }

    const url = `${this.baseUrl}/gemini-1.5-flash:generateContent?key=${this.apiKey}`;
    
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

      const data = (await response.json()) as {
        candidates?: {
          content?: {
            parts?: {
              text?: string;
            }[];
          };
        }[];
      };

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        this.logger.error('Invalid response format from Gemini API');
        throw new Error('Invalid response format from Gemini API');
      }

      return text;
    } catch (error: any) {
      this.logger.error(`Failed to call Gemini API: ${error.message}`);
      throw error;
    }
  }
}
