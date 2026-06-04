import { getSystemRelevantChunks, SYSTEM_QA_PAIRS } from './system-questions';

describe('SystemQuestions', () => {
  it('should return empty array for empty or whitespace-only queries', () => {
    expect(getSystemRelevantChunks('')).toEqual([]);
    expect(getSystemRelevantChunks('   ')).toEqual([]);
  });

  it('should return empty array for completely unrelated query', () => {
    expect(getSystemRelevantChunks('what is the weather today?')).toEqual([]);
    expect(getSystemRelevantChunks('tell me a joke')).toEqual([]);
  });

  it('should match the exact suggested questions', () => {
    for (const pair of SYSTEM_QA_PAIRS) {
      const chunks = getSystemRelevantChunks(pair.question);
      expect(chunks).toHaveLength(1);
      expect(chunks[0].content).toContain(pair.question);
      expect(chunks[0].content).toContain(pair.answer);
      expect(chunks[0].document?.name).toBe('EchoDocs System FAQs');
      expect((chunks[0] as any).distance).toBe(0.1);
    }
  });

  it('should match query variations based on keywords', () => {
    // Test case 1: About the app
    const aboutChunks = getSystemRelevantChunks('what is this application about?');
    expect(aboutChunks).toHaveLength(1);
    expect(aboutChunks[0].content).toContain('What is this application about?');

    // Test case 2: How to upload
    const uploadChunks = getSystemRelevantChunks('how do I upload documents?');
    expect(uploadChunks).toHaveLength(1);
    expect(uploadChunks[0].content).toContain('How do I upload new documents?');

    // Test case 3: Supported files
    const fileChunks = getSystemRelevantChunks('what files are supported?');
    expect(fileChunks).toHaveLength(1);
    expect(fileChunks[0].content).toContain('What kind of files are supported for ingestion?');

    // Test case 4: RAG model explanation
    const ragChunks = getSystemRelevantChunks('how does the RAG model work?');
    expect(ragChunks).toHaveLength(1);
    expect(ragChunks[0].content).toContain('Explain how the RAG model answers my questions.');
  });
});
