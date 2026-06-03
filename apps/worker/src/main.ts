import { PrismaClient } from '@prisma/client';
import { IngestionService, EmbeddingService } from '@echodocs/ai';
import { IngestionProcessor } from './app/ingestion.processor';
import { QUEUE_CONFIG, WORKER_CONFIG } from './app/constants';
import { Worker } from 'bullmq';
import Redis from 'ioredis';

async function bootstrap() {
  console.log('[Worker] Initializing worker...');

  // Initialize DB and Redis clients
  const prisma = new PrismaClient();
  await prisma.$connect();

  const redisUrl = process.env.REDIS_URL || WORKER_CONFIG.DEFAULT_REDIS_URL;
  const redisConnection = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
  });

  // Initialize IngestionService dependencies
  const apiKey = process.env.GEMINI_API_KEY || '';
  const embeddingService = new EmbeddingService(apiKey);
  const ingestionService = new IngestionService(prisma, embeddingService);
  const ingestionProcessor = new IngestionProcessor(ingestionService);

  const concurrency = parseInt(process.env.CONCURRENCY || String(WORKER_CONFIG.DEFAULT_CONCURRENCY), 10);

  // Initialize BullMQ Worker
  const worker = new Worker(
    QUEUE_CONFIG.NAME,
    async (job) => {
      await ingestionProcessor.process(job);
    },

    {
      connection: redisConnection,
      concurrency,
    }
  );

  worker.on('active', (job) => {
    console.log(`[Worker] Job ${job.id} has started processing.`);
  });

  worker.on('completed', (job) => {
    console.log(`[Worker] Job ${job.id} has completed successfully.`);
  });

  worker.on('failed', (job, error) => {
    console.error(`[Worker] Job ${job?.id} failed with error: ${error.message}`);
  });

  console.log(`[Worker] Ingestion worker successfully started and listening to 'ingestion' queue.`);
  console.log(`[Worker] Configured concurrency limit: ${concurrency}`);

  // Graceful shutdown handler
  const shutdown = async (signal: string) => {
    console.log(`[Worker] Received ${signal}. Initiating graceful shutdown...`);
    
    // Close BullMQ worker to stop accepting new jobs
    await worker.close();
    
    // Quit Redis connection
    await redisConnection.quit();
    
    // Disconnect Prisma
    await prisma.$disconnect();
    
    console.log('[Worker] Graceful shutdown complete. Exiting.');
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((error) => {
  console.error('[Worker] Fatal error during bootstrap:', error);
  process.exit(1);
});
