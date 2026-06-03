import { IngestionProcessor } from './ingestion.processor';
import { IngestionService } from '@echodocs/ai';
import { Job } from 'bullmq';

describe('IngestionProcessor', () => {
  let mockIngestionService: jest.Mocked<IngestionService>;
  let processor: IngestionProcessor;

  beforeEach(() => {
    mockIngestionService = {
      run: jest.fn(),
    } as unknown as jest.Mocked<IngestionService>;

    processor = new IngestionProcessor(mockIngestionService);
  });

  it('should successfully delegate job processing to IngestionService with correct arguments', async () => {
    const mockJob = {
      id: 'job-1',
      data: {
        documentId: 'doc-123',
        filePath: 'uploads/sample.pdf',
        fileType: 'pdf',
      },
    } as unknown as Job;

    await processor.process(mockJob);

    expect(mockIngestionService.run).toHaveBeenCalledWith(
      'doc-123',
      'uploads/sample.pdf',
      'pdf'
    );
  });

  it('should re-throw errors thrown by IngestionService', async () => {
    const mockJob = {
      id: 'job-1',
      data: {
        documentId: 'doc-123',
        filePath: 'uploads/sample.pdf',
        fileType: 'pdf',
      },
    } as unknown as Job;

    mockIngestionService.run.mockRejectedValue(new Error('Ingestion pipeline failed'));

    await expect(processor.process(mockJob)).rejects.toThrow('Ingestion pipeline failed');

    expect(mockIngestionService.run).toHaveBeenCalledWith(
      'doc-123',
      'uploads/sample.pdf',
      'pdf'
    );
  });

  it('should throw an error if job data is missing required fields', async () => {
    const mockJob = {
      id: 'job-1',
      data: {
        documentId: 'doc-123',
        // filePath and fileType are missing
      },
    } as unknown as Job;

    await expect(processor.process(mockJob)).rejects.toThrow(
      'Invalid job payload. Must contain documentId, filePath, and fileType.'
    );

    expect(mockIngestionService.run).not.toHaveBeenCalled();
  });
});
