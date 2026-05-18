export class ChunkingService {
  /**
   * Splits a raw text string into fixed-size chunks (~1000 chars) with 200-char overlap.
   * Tries to align chunk boundaries on spaces or newlines to preserve word structures.
   * 
   * @param text The input text string to chunk.
   * @param chunkSize The maximum size of each chunk.
   * @param overlap The character overlap between consecutive chunks.
   */
  static chunkText(text: string, chunkSize = 1000, overlap = 200): string[] {
    if (!text || text.trim() === '') {
      return [];
    }
    if (text.length <= chunkSize) {
      return [text.trim()];
    }

    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
      let end = start + chunkSize;
      
      // If we are not at the very end of the text, look for word/newline boundaries
      if (end < text.length) {
        // Look backward up to 100 characters to find a space or newline boundary
        const lookback = text.substring(Math.max(start, end - 100), end);
        const lastSpace = lookback.lastIndexOf(' ');
        const lastNewline = lookback.lastIndexOf('\n');
        const splitIdx = Math.max(lastSpace, lastNewline);

        if (splitIdx !== -1) {
          // Adjust end to match the nearest boundary
          end = Math.max(start + 1, end - 100 + splitIdx);
        }
      } else {
        end = text.length;
      }

      const chunk = text.substring(start, end).trim();
      if (chunk) {
        chunks.push(chunk);
      }

      // Slide the window back by overlap
      const nextStart = end - overlap;
      // Ensure start always increases to avoid infinite loop
      if (nextStart <= start) {
        start = end;
      } else {
        start = nextStart;
      }
    }

    return chunks;
  }
}
