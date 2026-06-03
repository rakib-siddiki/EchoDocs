import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { QueueService } from '../queue/queue.service';
import { extname } from 'path';

@Injectable()
export class DocsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queueService: QueueService
  ) {}

  async uploadFile(
    file: Express.Multer.File
  ): Promise<{ documentId: string; status: string }> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const name = file.originalname;
    const ext = extname(name).toLowerCase();

    if (ext !== '.pdf' && ext !== '.md') {
      throw new BadRequestException('Only PDF and Markdown files are supported');
    }

    const fileType = ext === '.pdf' ? 'pdf' : 'md';

    // 1. Create a Document row in the database with status = PENDING
    const document = await this.prisma.document.create({
      data: {
        name,
        status: 'PENDING',
      },
    });

    // 2. Queue the BullMQ job with documentId, filePath, and fileType
    await this.queueService.enqueueIngestionJob(
      document.id,
      file.path,
      fileType
    );

    // 3. Return the document details
    return {
      documentId: document.id,
      status: 'PENDING',
    };
  }

  /**
   * Returns a paginated list of documents.
   * Supports page and limit query params.
   */
  async listDocuments(page = 1, limit = 10) {
    const pageNum = Math.max(1, page);
    const limitNum = Math.max(1, limit);
    const skip = (pageNum - 1) * limitNum;

    const documents = await this.prisma.document.findMany({
      skip,
      take: limitNum,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { chunks: true },
        },
      },
    });

    return documents.map((doc) => ({
      id: doc.id,
      name: doc.name,
      status: doc.status,
      sourceUrl: doc.sourceUrl,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      chunkCount: doc._count.chunks,
    }));
  }

  /**
   * Deletes a document by ID.
   * Chunks are deleted cascade style.
   */
  async deleteDocument(id: string): Promise<void> {
    const document = await this.prisma.document.findUnique({
      where: { id },
    });

    if (!document) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    await this.prisma.document.delete({
      where: { id },
    });
  }
}

