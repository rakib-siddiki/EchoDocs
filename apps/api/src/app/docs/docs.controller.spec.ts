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
});
