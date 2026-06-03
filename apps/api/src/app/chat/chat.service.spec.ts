import { Test, TestingModule } from '@nestjs/testing';
import { ChatService } from './chat.service';
import { GeminiService } from './gemini.service';
import { EmbeddingService, VectorSearchService, PromptBuilder } from '@echodocs/ai';

describe('ChatService (Unit)', () => {
  let service: ChatService;
  let embeddingServiceMock: jest.Mocked<EmbeddingService>;
  let vectorSearchServiceMock: jest.Mocked<VectorSearchService>;
  let geminiServiceMock: jest.Mocked<GeminiService>;

  beforeEach(async () => {
    // Create mocks
    embeddingServiceMock = {
      embedText: jest.fn(),
    } as unknown as jest.Mocked<EmbeddingService>;

    vectorSearchServiceMock = {
      searchSimilarChunks: jest.fn(),
    } as unknown as jest.Mocked<VectorSearchService>;

    geminiServiceMock = {
      generateContent: jest.fn(),
    } as unknown as jest.Mocked<GeminiService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        { provide: EmbeddingService, useValue: embeddingServiceMock },
        { provide: VectorSearchService, useValue: vectorSearchServiceMock },
        { provide: GeminiService, useValue: geminiServiceMock },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
  });

  it('should call EmbeddingService, VectorSearchService, and GeminiService in order with correct args', async () => {
    const query = 'What is EchoDocs?';
    const mockEmbedding = Array(768).fill(0.1);
    const mockChunks = [
      {
        id: 'chunk-1',
        content: 'EchoDocs is a documentation assistant.',
        chunkIndex: 0,
        documentId: 'doc-1',
        document: {
          id: 'doc-1',
          name: 'README.md',
          status: 'PROCESSED',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        distance: 0.2, // Below the threshold (0.7), so it's relevant
      },
    ];
    const mockAnswer = 'EchoDocs is an assistant.';

    // Setup mocks
    embeddingServiceMock.embedText.mockResolvedValue(mockEmbedding);
    vectorSearchServiceMock.searchSimilarChunks.mockResolvedValue(mockChunks as any);
    geminiServiceMock.generateContent.mockResolvedValue(mockAnswer);

    // Call service
    const result = await service.query(query);

    // Assert returns correct data
    expect(result.answer).toBe(mockAnswer);
    expect(result.citations).toHaveLength(1);
    expect(result.citations[0]).toEqual({
      documentId: 'doc-1',
      documentName: 'README.md',
      chunkIndex: 0,
      excerpt: 'EchoDocs is a documentation assistant.',
    });

    // Verify order and arguments
    expect(embeddingServiceMock.embedText).toHaveBeenCalledWith(query);
    expect(vectorSearchServiceMock.searchSimilarChunks).toHaveBeenCalledWith(mockEmbedding, 5);
    
    // Ensure PromptBuilder is used correctly by rebuilding the prompt and checking it
    const expectedPrompt = PromptBuilder.buildPrompt(mockChunks as any, query);
    expect(geminiServiceMock.generateContent).toHaveBeenCalledWith(expectedPrompt);

    // Verify calling order: Embedding -> Vector Search -> Gemini
    const embedOrder = embeddingServiceMock.embedText.mock.invocationCallOrder[0];
    const searchOrder = vectorSearchServiceMock.searchSimilarChunks.mock.invocationCallOrder[0];
    const geminiOrder = geminiServiceMock.generateContent.mock.invocationCallOrder[0];

    expect(embedOrder).toBeLessThan(searchOrder);
    expect(searchOrder).toBeLessThan(geminiOrder);
  });

  it('should return a "not found in documents" message and empty citations if no relevant chunks are found', async () => {
    const query = 'Unrelated topic';
    const mockEmbedding = Array(768).fill(0.1);
    const mockChunks = [
      {
        id: 'chunk-1',
        content: 'Irrelevant text.',
        chunkIndex: 0,
        documentId: 'doc-1',
        document: {
          id: 'doc-1',
          name: 'README.md',
          status: 'PROCESSED',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        distance: 0.8, // Above threshold (0.7), so irrelevant
      },
    ];

    embeddingServiceMock.embedText.mockResolvedValue(mockEmbedding);
    vectorSearchServiceMock.searchSimilarChunks.mockResolvedValue(mockChunks as any);

    const result = await service.query(query);

    expect(result.answer).toContain('not found in documents');
    expect(result.citations).toEqual([]);
    expect(geminiServiceMock.generateContent).not.toHaveBeenCalled();
  });
});
