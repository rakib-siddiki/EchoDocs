import { IngestionService } from '@echodocs/ai';
import { Job } from 'bullmq';

export class IngestionProcessor {
  constructor(private ingestionService: IngestionService) {}

  /**
   * Processes an incoming BullMQ ingestion job.
   * Extracts parameters from the job payload and delegates to IngestionService.
   * 
   * @param job The BullMQ job instance.
   */
  async process(job: Job): Promise<void> {
    const { documentId, filePath, fileType } = job.data || {};
    
    if (!documentId || !filePath || !fileType) {
      throw new Error('Invalid job payload. Must contain documentId, filePath, and fileType.');
    }

    await this.ingestionService.run(documentId, filePath, fileType);
  }
}
