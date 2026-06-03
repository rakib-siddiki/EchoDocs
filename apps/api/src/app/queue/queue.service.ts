import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Queue } from 'bullmq';
import Redis from 'ioredis';

@Injectable()
export class QueueService implements OnModuleDestroy {
  private readonly redisConnection: Redis;
  private readonly ingestionQueue: Queue;
  constructor() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    const attempts = parseInt(process.env.JOB_RETRIES || '3', 10);
    const backoffDelay = parseInt(process.env.JOB_BACKOFF_DELAY || '1000', 10);

    // BullMQ requires maxRetriesPerRequest to be null
    this.redisConnection = new Redis(redisUrl, {
      maxRetriesPerRequest: null,
    });

    this.ingestionQueue = new Queue('ingestion', {
      connection: this.redisConnection,
      defaultJobOptions: {
        attempts,
        backoff: {
          type: 'exponential',
          delay: backoffDelay,
        },
      },
    });
  }

  async enqueueIngestionJob(
    documentId: string,
    filePath: string,
    fileType: string
  ): Promise<any> {
    return this.ingestionQueue.add('process', {
      documentId,
      filePath,
      fileType,
    });
  }

  // Helper method for testing or checking queue/job status
  getQueue(): Queue {
    return this.ingestionQueue;
  }

  async onModuleDestroy() {
    await this.ingestionQueue.close();
    await this.redisConnection.quit();
  }
}
