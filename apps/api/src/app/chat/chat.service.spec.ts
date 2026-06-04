import { Test, TestingModule } from '@nestjs/testing';
import { ChatService } from './chat.service';
import { GeminiService } from './gemini.service';
import { EmbeddingService, VectorSearchService, PromptBuilder } from '@echodocs/ai';
import { Chunk } from '@echodocs/types';

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
      generateContentStream: jest.fn(),
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



  it('should stream tokens, citations, and done event when relevant chunks are found', async () => {
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
        distance: 0.2,
      },
    ];

    embeddingServiceMock.embedText.mockResolvedValue(mockEmbedding);
    vectorSearchServiceMock.searchSimilarChunks.mockResolvedValue(mockChunks as unknown as Chunk[]);
    
    geminiServiceMock.generateContentStream.mockImplementation(async function* () {
      yield 'EchoDocs ';
      yield 'is ';
      yield 'assistant.';
    });

    const events = [];
    for await (const event of service.queryStream(query)) {
      events.push(event);
    }

    expect(events).toHaveLength(5);
    expect(events[0]).toEqual({ type: 'token', content: 'EchoDocs ' });
    expect(events[1]).toEqual({ type: 'token', content: 'is ' });
    expect(events[2]).toEqual({ type: 'token', content: 'assistant.' });
    expect(events[3]).toEqual({
      type: 'citations',
      citations: [
        {
          documentId: 'doc-1',
          documentName: 'README.md',
          chunkIndex: 0,
          excerpt: 'EchoDocs is a documentation assistant.',
        },
      ],
    });
    expect(events[4]).toEqual({ type: 'done' });
  });

  it('should yield not found tokens and empty citations in queryStream when no relevant chunks are found', async () => {
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
        distance: 0.8,
      },
    ];

    embeddingServiceMock.embedText.mockResolvedValue(mockEmbedding);
    vectorSearchServiceMock.searchSimilarChunks.mockResolvedValue(mockChunks as unknown as Chunk[]);

    const events = [];
    for await (const event of service.queryStream(query)) {
      events.push(event);
    }

    expect(events).toHaveLength(3);
    expect(events[0].type).toBe('token');
    expect(events[0].content).toContain('not found in documents');
    expect(events[1]).toEqual({ type: 'citations', citations: [] });
    expect(events[2]).toEqual({ type: 'done' });
    expect(geminiServiceMock.generateContentStream).not.toHaveBeenCalled();
  });

  it('should include system FAQ chunks when the query is about application details', async () => {
    const query = 'What is this application about?';
    const mockEmbedding = Array(768).fill(0.1);
    
    // Database returns no relevant chunks
    const mockChunks = [
      {
        id: 'chunk-1',
        content: 'Some unrelated DB content.',
        chunkIndex: 0,
        documentId: 'doc-1',
        document: {
          id: 'doc-1',
          name: 'README.md',
          status: 'PROCESSED',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        distance: 0.8, // above threshold (irrelevant)
      },
    ];

    embeddingServiceMock.embedText.mockResolvedValue(mockEmbedding);
    vectorSearchServiceMock.searchSimilarChunks.mockResolvedValue(mockChunks as unknown as Chunk[]);

    geminiServiceMock.generateContentStream.mockImplementation(async function* () {
      yield 'EchoDocs ';
      yield 'is ';
      yield 'RAG ';
      yield 'platform.';
    });

    const events = [];
    for await (const event of service.queryStream(query)) {
      events.push(event);
    }

    // Expecting tokens from stream, citations from system FAQ, and done event
    expect(events).toHaveLength(6);
    expect(events[0]).toEqual({ type: 'token', content: 'EchoDocs ' });
    expect(events[1]).toEqual({ type: 'token', content: 'is ' });
    expect(events[2]).toEqual({ type: 'token', content: 'RAG ' });
    expect(events[3]).toEqual({ type: 'token', content: 'platform.' });
    expect(events[4]).toEqual({
      type: 'citations',
      citations: [
        {
          documentId: 'system-faq-doc',
          documentName: 'EchoDocs System FAQs',
          chunkIndex: 0,
          excerpt: expect.stringContaining('EchoDocs is an advanced document management'),
        },
      ],
    });
    expect(events[5]).toEqual({ type: 'done' });
  });
});
