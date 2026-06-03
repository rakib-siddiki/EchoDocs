import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { DocsModule } from './docs.module';
import { PrismaService } from '../prisma.service';
import { QueueService } from '../queue/queue.service';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma.module';
import * as clerkBackend from '@clerk/backend';

jest.mock('@clerk/backend');

describe('DocsController (Integration)', () => {
  let app: INestApplication;

  const mockPrisma = {
    document: {
      create: jest.fn().mockImplementation((args) => {
        return Promise.resolve({
          id: 'doc-123',
          name: args.data.name,
          status: args.data.status,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }),
      findMany: jest.fn().mockImplementation((args) => {
        const mockDocs = [
          {
            id: 'doc-1',
            name: 'test1.pdf',
            status: 'PROCESSED',
            sourceUrl: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            _count: { chunks: 3 }
          },
          {
            id: 'doc-2',
            name: 'test2.md',
            status: 'PROCESSING',
            sourceUrl: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            _count: { chunks: 0 }
          }
        ];
        return Promise.resolve(mockDocs.slice(0, args.take));
      }),
      findUnique: jest.fn().mockImplementation((args) => {
        if (args.where.id === 'doc-exist') {
          return Promise.resolve({
            id: 'doc-exist',
            name: 'test.pdf',
            status: 'PROCESSED',
            sourceUrl: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
        return Promise.resolve(null);
      }),
      delete: jest.fn().mockImplementation((args) => {
        return Promise.resolve({ id: args.where.id });
      }),
    },
  };

  const mockQueueService = {
    enqueueIngestionJob: jest.fn().mockResolvedValue({ id: 'job-123' }),
  };

  beforeAll(async () => {
    // Setup Clerk Auth mock behavior
    (clerkBackend.verifyToken as jest.Mock).mockImplementation(async (token) => {
      if (token === 'admin-token') {
        return {
          sub: 'admin_user',
          metadata: { role: 'admin' },
          publicMetadata: { role: 'admin' },
        };
      }
      if (token === 'viewer-token') {
        return {
          sub: 'viewer_user',
          metadata: { role: 'viewer' },
          publicMetadata: { role: 'viewer' },
        };
      }
      throw new Error('Invalid token');
    });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule, AuthModule, DocsModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrisma)
      .overrideProvider(QueueService)
      .useValue(mockQueueService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('POST /api/v1/docs/upload - should upload a valid PDF and return 201 with status PENDING', async () => {
    const pdfBuffer = Buffer.from('%PDF-1.4 ... mock pdf content ...');

    const response = await request(app.getHttpServer())
      .post('/api/v1/docs/upload')
      .set('Authorization', 'Bearer admin-token')
      .attach('file', pdfBuffer, 'test.pdf');

    expect(response.status).toBe(HttpStatus.CREATED);
    expect(response.body).toEqual({
      documentId: 'doc-123',
      status: 'PENDING',
    });

    expect(mockPrisma.document.create).toHaveBeenCalledWith({
      data: {
        name: 'test.pdf',
        status: 'PENDING',
      },
    });

    expect(mockQueueService.enqueueIngestionJob).toHaveBeenCalledWith(
      'doc-123',
      expect.any(String),
      'pdf'
    );
  });

  it('POST /api/v1/docs/upload - should upload a valid Markdown and return 201 with status PENDING', async () => {
    const mdBuffer = Buffer.from('# Mock Markdown Content');

    const response = await request(app.getHttpServer())
      .post('/api/v1/docs/upload')
      .set('Authorization', 'Bearer admin-token')
      .attach('file', mdBuffer, 'test.md');

    expect(response.status).toBe(HttpStatus.CREATED);
    expect(response.body).toEqual({
      documentId: 'doc-123',
      status: 'PENDING',
    });

    expect(mockPrisma.document.create).toHaveBeenCalledWith({
      data: {
        name: 'test.md',
        status: 'PENDING',
      },
    });

    expect(mockQueueService.enqueueIngestionJob).toHaveBeenCalledWith(
      'doc-123',
      expect.any(String),
      'md'
    );
  });

  it('POST /api/v1/docs/upload - should return 400 Bad Request for invalid file type (.txt)', async () => {
    const txtBuffer = Buffer.from('plain text content');

    const response = await request(app.getHttpServer())
      .post('/api/v1/docs/upload')
      .set('Authorization', 'Bearer admin-token')
      .attach('file', txtBuffer, 'test.txt');

    expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    expect(response.body.message).toContain('Only PDF and Markdown files are supported');
  });

  it('POST /api/v1/docs/upload - should return 413 Payload Too Large for file > 20 MB', async () => {
    // 21 MB buffer to trigger size limit
    const largeBuffer = Buffer.alloc(21 * 1024 * 1024);

    const response = await request(app.getHttpServer())
      .post('/api/v1/docs/upload')
      .set('Authorization', 'Bearer admin-token')
      .attach('file', largeBuffer, 'large.pdf');

    expect(response.status).toBe(HttpStatus.PAYLOAD_TOO_LARGE);
    expect(response.body.message).toMatch(/File too large|File size exceeds 20 MB limit/);
  });

  it('POST /api/v1/docs/upload - should return 401 Unauthorized if token is missing', async () => {
    const pdfBuffer = Buffer.from('%PDF-1.4 ...');

    const response = await request(app.getHttpServer())
      .post('/api/v1/docs/upload')
      .attach('file', pdfBuffer, 'test.pdf');

    expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('POST /api/v1/docs/upload - should return 403 Forbidden if user is not an admin', async () => {
    const pdfBuffer = Buffer.from('%PDF-1.4 ...');

    const response = await request(app.getHttpServer())
      .post('/api/v1/docs/upload')
      .set('Authorization', 'Bearer viewer-token')
      .attach('file', pdfBuffer, 'test.pdf');

    expect(response.status).toBe(HttpStatus.FORBIDDEN);
  });

  // GET /api/v1/docs tests
  it('GET /api/v1/docs - should return 200 with list of documents for admin', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/docs')
      .set('Authorization', 'Bearer admin-token');

    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body).toBeInstanceOf(Array);
    expect(response.body.length).toBe(2);
    expect(response.body[0]).toHaveProperty('chunkCount', 3);
  });

  it('GET /api/v1/docs - should return 200 with list of documents for viewer', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/docs')
      .set('Authorization', 'Bearer viewer-token');

    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body).toBeInstanceOf(Array);
  });

  it('GET /api/v1/docs - should support pagination with limit', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/docs?page=1&limit=1')
      .set('Authorization', 'Bearer admin-token');

    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body.length).toBe(1);
  });

  it('GET /api/v1/docs - should return 401 if unauthorized', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/docs');

    expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  // DELETE /api/v1/docs/:id tests
  it('DELETE /api/v1/docs/:id - should return 204 when successfully deleted by admin', async () => {
    const response = await request(app.getHttpServer())
      .delete('/api/v1/docs/doc-exist')
      .set('Authorization', 'Bearer admin-token');

    expect(response.status).toBe(HttpStatus.NO_CONTENT);
    expect(mockPrisma.document.delete).toHaveBeenCalledWith({
      where: { id: 'doc-exist' }
    });
  });

  it('DELETE /api/v1/docs/:id - should return 403 Forbidden for viewer', async () => {
    const response = await request(app.getHttpServer())
      .delete('/api/v1/docs/doc-exist')
      .set('Authorization', 'Bearer viewer-token');

    expect(response.status).toBe(HttpStatus.FORBIDDEN);
  });

  it('DELETE /api/v1/docs/:id - should return 404 NotFound if document does not exist', async () => {
    const response = await request(app.getHttpServer())
      .delete('/api/v1/docs/non-existent-id')
      .set('Authorization', 'Bearer admin-token');

    expect(response.status).toBe(HttpStatus.NOT_FOUND);
  });

  it('DELETE /api/v1/docs/:id - should return 401 if unauthorized', async () => {
    const response = await request(app.getHttpServer())
      .delete('/api/v1/docs/doc-exist');

    expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
  });
});
