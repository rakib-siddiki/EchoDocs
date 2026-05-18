export class EmbeddingService {
  private apiKey: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env['GEMINI_API_KEY'] || '';
  }

  /**
   * Generates a 768-dimensional float vector embedding for the given text
   * using the Gemini `text-embedding-004` model.
   * 
   * @param text The string to embed.
   */
  async embedText(text: string): Promise<number[]> {
    if (!text || text.trim() === '') {
      throw new Error('Text to embed cannot be empty');
    }
    if (!this.apiKey) {
      throw new Error('Gemini API key is not configured');
    }

    const url = `${this.baseUrl}/text-embedding-004:embedContent?key=${this.apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: {
          parts: [
            {
              text: text,
            },
          ],
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini Embedding API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json() as { embedding?: { values?: number[] } };
    if (!data.embedding || !data.embedding.values) {
      throw new Error('Invalid embedding response format from Gemini API');
    }

    return data.embedding.values;
  }
}
