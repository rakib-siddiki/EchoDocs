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
    generateContentStream: jest.fn().mockImplementation(async function* () {
      yield 'Prisma ';
      yield 'is ';
      yield 'a ';
      yield 'Next-Generation ';
      yield 'ORM.';
    }),
  };

  beforeAll(async () => {
    // Setup Custom Auth mock behavior
    (authUtils.verifyAccessToken as jest.Mock).mockImplementation((token) => {
      if (token === 'admin-token') {
        return {
          id: 'admin_user',
          email: 'admin@echodocs.com',
        };
      }
      if (token === 'viewer-token') {
        return {
          id: 'viewer_user',
          email: 'viewer@echodocs.com',
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



  it('POST /api/v1/chat/query/stream - should stream chunks and citations when user is authorized', (done) => {
    request(app.getHttpServer())
      .post('/api/v1/chat/query/stream')
      .set('Authorization', 'Bearer admin-token')
      .send({ query: 'What is Prisma?', sessionId: 'session-123' })
      .expect('Content-Type', /text\/event-stream/)
      .expect(HttpStatus.OK)
      .end((err, res) => {
        if (err) return done(err);
        const body = res.text;
        expect(body).toContain('data: {"type":"token","content":"Prisma "}');
        expect(body).toContain('data: {"type":"citations"');
        expect(body).toContain('data: {"type":"done"}');
        done();
      });
  });

  it('POST /api/v1/chat/query/stream - should return 401 if token is missing', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/chat/query/stream')
      .send({ query: 'What is Prisma?' });

    expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('POST /api/v1/chat/query/stream - should return 400 if query is empty', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/chat/query/stream')
      .set('Authorization', 'Bearer admin-token')
      .send({ query: '' });

    expect(response.status).toBe(HttpStatus.BAD_REQUEST);
  });
});
