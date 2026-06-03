import { IngestionService } from './ingestion.service';
import { EmbeddingService } from './embedding.service';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs/promises';
import pdf = require('pdf-parse');

jest.mock('pdf-parse', () => {
  return jest.fn().mockResolvedValue({ text: 'Sample text from PDF document.' });
});

describe('IngestionService', () => {
  let prismaMock: jest.Mocked<PrismaClient>;
  let embeddingServiceMock: jest.Mocked<EmbeddingService>;
  let ingestionService: IngestionService;

  beforeEach(() => {
    jest.clearAllMocks();

    prismaMock = {
      document: {
        update: jest.fn().mockResolvedValue({ id: 'doc-123', status: 'PROCESSED' }),
      },
      $executeRawUnsafe: jest.fn().mockResolvedValue(1),
      $transaction: jest.fn().mockImplementation(async (callback) => {
        return callback(prismaMock);
      }),
    } as unknown as jest.Mocked<PrismaClient>;

    embeddingServiceMock = {
      embedText: jest.fn().mockResolvedValue(Array(768).fill(0.5)),
    } as unknown as jest.Mocked<EmbeddingService>;

    ingestionService = new IngestionService(prismaMock, embeddingServiceMock);
  });

  it('should successfully run ingestion for a markdown file', async () => {
    const readFileSpy = jest.spyOn(fs, 'readFile').mockResolvedValue('This is markdown file content with enough characters to test chunking correctly.');

    await ingestionService.run('doc-123', 'test.md', 'md');

    // Assert file reading
    expect(readFileSpy).toHaveBeenCalledWith('test.md', 'utf-8');

    // Assert status transition at start: PENDING -> PROCESSING
    expect(prismaMock.document.update).toHaveBeenNthCalledWith(1, {
      where: { id: 'doc-123' },
      data: { status: 'PROCESSING' },
    });

    // Assert embedding generation
    expect(embeddingServiceMock.embedText).toHaveBeenCalled();

    // Assert transactional updates (deletion then insertions)
    expect(prismaMock.$executeRawUnsafe).toHaveBeenCalledWith(
      `DELETE FROM "Chunk" WHERE "documentId" = $1`,
      'doc-123'
    );
    expect(prismaMock.$executeRawUnsafe).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO "Chunk"'),
      expect.any(String),
      'This is markdown file content with enough characters to test chunking correctly.',
      expect.stringContaining('[0.5,0.5'),
      0,
      'doc-123'
    );

    // Assert status transition at end: PROCESSING -> PROCESSED
    expect(prismaMock.document.update).toHaveBeenNthCalledWith(2, {
      where: { id: 'doc-123' },
      data: { status: 'PROCESSED' },
    });

    readFileSpy.mockRestore();
  });

  it('should successfully run ingestion for a PDF file', async () => {
    const readFileSpy = jest.spyOn(fs, 'readFile').mockResolvedValue(Buffer.from('pdf data dummy'));

    await ingestionService.run('doc-123', 'test.pdf', 'pdf');

    // Assert file reading
    expect(readFileSpy).toHaveBeenCalledWith('test.pdf');
    expect(pdf).toHaveBeenCalledWith(Buffer.from('pdf data dummy'));

    // Assert status transition at start
    expect(prismaMock.document.update).toHaveBeenNthCalledWith(1, {
      where: { id: 'doc-123' },
      data: { status: 'PROCESSING' },
    });

    // Assert embedding generation
    expect(embeddingServiceMock.embedText).toHaveBeenCalled();

    // Assert final status update
    expect(prismaMock.document.update).toHaveBeenNthCalledWith(2, {
      where: { id: 'doc-123' },
      data: { status: 'PROCESSED' },
    });

    readFileSpy.mockRestore();
  });

  it('should transition status to FAILED and rethrow if text extraction fails', async () => {
    const readFileSpy = jest.spyOn(fs, 'readFile').mockRejectedValue(new Error('File not found'));

    await expect(ingestionService.run('doc-123', 'missing.md', 'md')).rejects.toThrow('File not found');

    // Assert status initialized to PROCESSING
    expect(prismaMock.document.update).toHaveBeenNthCalledWith(1, {
      where: { id: 'doc-123' },
      data: { status: 'PROCESSING' },
    });

    // Assert status updated to FAILED on exception
    expect(prismaMock.document.update).toHaveBeenNthCalledWith(2, {
      where: { id: 'doc-123' },
      data: { status: 'FAILED' },
    });

    readFileSpy.mockRestore();
  });

  it('should transition status to FAILED and rethrow if embedding service fails', async () => {
    const readFileSpy = jest.spyOn(fs, 'readFile').mockResolvedValue('markdown content');
    embeddingServiceMock.embedText.mockRejectedValue(new Error('Gemini API quota exceeded'));

    await expect(ingestionService.run('doc-123', 'test.md', 'md')).rejects.toThrow('Gemini API quota exceeded');

    // Assert status initialized to PROCESSING
    expect(prismaMock.document.update).toHaveBeenNthCalledWith(1, {
      where: { id: 'doc-123' },
      data: { status: 'PROCESSING' },
    });

    // Assert status updated to FAILED
    expect(prismaMock.document.update).toHaveBeenNthCalledWith(2, {
      where: { id: 'doc-123' },
      data: { status: 'FAILED' },
    });

    readFileSpy.mockRestore();
  });
});
