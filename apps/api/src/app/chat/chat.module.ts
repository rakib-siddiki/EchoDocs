import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { GeminiService } from './gemini.service';
import { EmbeddingService, VectorSearchService } from '@echodocs/ai';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [ChatController],
  providers: [
    ChatService,
    GeminiService,
    {
      provide: EmbeddingService,
      useFactory: () => {
        return new EmbeddingService(process.env['GEMINI_API_KEY']);
      },
    },
    {
      provide: VectorSearchService,
      useFactory: (prisma: PrismaService) => {
        return new VectorSearchService(prisma);
      },
      inject: [PrismaService],
    },
  ],
  exports: [ChatService],
})
export class ChatModule {}
