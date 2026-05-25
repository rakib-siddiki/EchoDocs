import { Injectable, BadRequestException } from '@nestjs/common';
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
}
