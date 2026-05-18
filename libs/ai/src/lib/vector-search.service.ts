import { PrismaClient } from '@prisma/client';
import { Chunk } from '@echodocs/types';

interface RawChunkRow {
  id: string;
  content: string;
  chunkIndex: number;
  documentId: string;
  documentName: string;
  distance: number;
}

export class VectorSearchService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Executes a cosine similarity vector search query using the `<=>` operator against pgvector in Supabase.
   * Returns the top-k most similar chunks, including their nested Document metadata.
   * 
   * @param embedding The query vector (768 dimensions).
   * @param k The number of top-similar results to return.
   */
  async searchSimilarChunks(embedding: number[], k = 5): Promise<Chunk[]> {
    if (!embedding || embedding.length !== 768) {
      throw new Error('Embedding vector must be a number array of length 768');
    }

    const vectorString = `[${embedding.join(',')}]`;

    // Execute raw SQL cosine similarity query using pgvector '<=>' operator
    const results = await this.prisma.$queryRawUnsafe<RawChunkRow[]>(
      `SELECT c.id, c.content, c."chunkIndex", c."documentId", d.name as "documentName",
              (c.embedding <=> $1::vector) as distance
       FROM "Chunk" c
       JOIN "Document" d ON c."documentId" = d.id
       ORDER BY distance ASC
       LIMIT $2`,
      vectorString,
      k
    );

    // Map query results to match the Chunk interface structure
    return results.map((row) => ({
      id: row.id,
      content: row.content,
      chunkIndex: row.chunkIndex,
      documentId: row.documentId,
      document: {
        id: row.documentId,
        name: row.documentName,
        status: 'PROCESSED',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      distance: Number(row.distance),
    }));
  }
}
