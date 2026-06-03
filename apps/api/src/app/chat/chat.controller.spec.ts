import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { ChatModule } from './chat.module';
import { PrismaService } from '../prisma.service';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma.module';
import * as authUtils from '../auth/utils';
import { EmbeddingService } from '@echodocs/ai';
import { GeminiService } from './gemini.service';

jest.mock('../auth/utils');

describe('ChatController (Integration)', () => {
  let app: INestApplication;
  
  const mockPrisma = {
    $queryRawUnsafe: jest.fn().mockImplementation(() => {
      return Promise.resolve([
        {
          id: 'chunk-123',
          content: 'Prisma is a Next-Generation ORM for Node.js and TypeScript.',
          chunkIndex: 0,
          documentId: 'doc-456',
          documentName: 'prisma-intro.md',
          distance: 0.1, // highly relevant
        },
      ]);
    }),
  };

  const mockEmbeddingService = {
    embedText: jest.fn().mockResolvedValue(Array(768).fill(0.1)),
  };

  const mockGeminiService = {
    generateContent: jest.fn().mockResolvedValue('Prisma is a Next-Generation ORM for Node.js and TypeScript. It is used to query databases.'),
  };

  beforeAll(async () => {
    // Setup Custom Auth mock behavior
    (authUtils.verifyAccessToken as jest.Mock).mockImplementation((token) => {
      if (token === 'admin-token') {
        return {
          id: 'admin_user',
          email: 'admin@echodocs.com',
          role: 'admin',
        };
      }
      if (token === 'viewer-token') {
        return {
          id: 'viewer_user',
          email: 'viewer@echodocs.com',
          role: 'viewer',
        };
      }
      throw new Error('Invalid token');
    });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule, AuthModule, ChatModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrisma)
      .overrideProvider(EmbeddingService)
      .useValue(mockEmbeddingService)
      .overrideProvider(GeminiService)
      .useValue(mockGeminiService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('POST /api/v1/chat/query - should return 200 with answer and citations when user is admin', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/chat/query')
      .set('Authorization', 'Bearer admin-token')
      .send({ query: 'What is Prisma?', sessionId: 'session-123' });

    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body).toHaveProperty('answer');
    expect(response.body.answer).toContain('Prisma is a Next-Generation ORM');
    expect(response.body.citations).toHaveLength(1);
    expect(response.body.citations[0]).toEqual({
      documentId: 'doc-456',
      documentName: 'prisma-intro.md',
      chunkIndex: 0,
      excerpt: 'Prisma is a Next-Generation ORM for Node.js and TypeScript.',
    });
  });

  it('POST /api/v1/chat/query - should return 200 with answer and citations when user is viewer', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/chat/query')
      .set('Authorization', 'Bearer viewer-token')
      .send({ query: 'What is Prisma?' });

    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body).toHaveProperty('answer');
    expect(response.body.citations).toHaveLength(1);
  });

  it('POST /api/v1/chat/query - should return 401 Unauthorized if token is missing', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/chat/query')
      .send({ query: 'What is Prisma?' });

    expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('POST /api/v1/chat/query - should return 400 Bad Request if query is empty', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/chat/query')
      .set('Authorization', 'Bearer admin-token')
      .send({ query: '' });

    expect(response.status).toBe(HttpStatus.BAD_REQUEST);
  });
});
