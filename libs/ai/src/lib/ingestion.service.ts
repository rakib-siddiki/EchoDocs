import { PrismaClient } from '@prisma/client';
import { EmbeddingService } from './embedding.service';
import { ChunkingService } from './chunking.service';
import * as fs from 'fs/promises';
import { randomUUID } from 'crypto';
import { PDFParse } from 'pdf-parse';

export class IngestionService {
  private embeddingService: EmbeddingService;

  constructor(private prisma: PrismaClient, embeddingService?: EmbeddingService) {
    this.embeddingService = embeddingService || new EmbeddingService();
  }

  /**
   * Runs the document ingestion pipeline:
   * 1. Updates status to PROCESSING.
   * 2. Extracts raw text (using pdf-parse for PDF, direct read for MD).
   * 3. Chunks text into ~1000 char overlapping segments.
   * 4. Generates a 768-dimensional embedding for each chunk via Gemini API.
   * 5. Deletes old chunks and bulk-inserts new chunks + sets status to PROCESSED in a transaction.
   * 6. Sets status to FAILED and rethrows if any error occurs.
   * 
   * @param documentId The ID of the document to process.
   * @param filePath The local path of the file on disk.
   * @param fileType The file format/type ('pdf' or 'md').
   */
  async run(documentId: string, filePath: string, fileType: string): Promise<void> {
    if (!documentId) {
      throw new Error('documentId is required');
    }
    if (!filePath) {
      throw new Error('filePath is required');
    }
    if (!fileType) {
      throw new Error('fileType is required');
    }

    // 1. Transition status from PENDING to PROCESSING
    try {
      await this.prisma.document.update({
        where: { id: documentId },
        data: { status: 'PROCESSING' },
      });
    } catch (error) {
      throw new Error(`Failed to initialize document processing status: ${(error as Error).message}`);
    }

    try {
      // 2. Text Extraction
      let rawText = '';
      const lowerType = fileType.toLowerCase();
      if (lowerType === 'pdf') {
        const dataBuffer = await fs.readFile(filePath);
        const parser = new PDFParse({ data: dataBuffer });
        try {
          const pdfData = await parser.getText();
          rawText = pdfData.text;
        } finally {
          await parser.destroy();
        }
      } else if (lowerType === 'md') {
        rawText = await fs.readFile(filePath, 'utf-8');
      } else {
        throw new Error(`Unsupported file type: ${fileType}`);
      }

      // 3. Chunking
      const textChunks = ChunkingService.chunkText(rawText);
      if (textChunks.length === 0) {
        throw new Error('No text extracted from file');
      }

      // 4. Generate embeddings (outside transaction to avoid locking DB resources during API calls)
      interface ChunkWithEmbedding {
        content: string;
        embedding: number[];
        chunkIndex: number;
      }
      const chunksWithEmbeddings: ChunkWithEmbedding[] = [];
      for (let i = 0; i < textChunks.length; i++) {
        const chunkText = textChunks[i];
        const embedding = await this.embeddingService.embedText(chunkText);
        chunksWithEmbeddings.push({
          content: chunkText,
          embedding,
          chunkIndex: i,
        });
      }

      // 5. Storage (all-or-nothing batch update)
      await this.prisma.$transaction(async (tx) => {
        // Delete any existing chunks for this document first (idempotency/cleanup on retry)
        await tx.$executeRawUnsafe(`DELETE FROM "Chunk" WHERE "documentId" = $1`, documentId);

        // Batch insert chunks
        for (const chunk of chunksWithEmbeddings) {
          const chunkId = randomUUID();
          const vectorString = `[${chunk.embedding.join(',')}]`;
          await tx.$executeRawUnsafe(
            `INSERT INTO "Chunk" ("id", "content", "embedding", "chunkIndex", "documentId") VALUES ($1, $2, $3::vector, $4, $5)`,
            chunkId,
            chunk.content,
            vectorString,
            chunk.chunkIndex,
            documentId
          );
        }

        // Update status to PROCESSED
        await tx.document.update({
          where: { id: documentId },
          data: { status: 'PROCESSED' },
        });
      });
    } catch (error) {
      // Update status to FAILED on any unrecoverable error
      try {
        await this.prisma.document.update({
          where: { id: documentId },
          data: { status: 'FAILED' },
        });
      } catch (updateError) {
        console.error(`Failed to update status to FAILED: ${(updateError as Error).message}`);
      }
      throw error; // Rethrow original error for the caller (BullMQ worker)
    }
  }
}
