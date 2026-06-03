export const DOCS_CONFIG = {
  MAX_FILE_SIZE: 20 * 1024 * 1024, // 20 MB limit
  SUPPORTED_FILE_EXTENSIONS: ['.pdf', '.md'],
  UPLOAD_DESTINATION: 'tmp/uploads',
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
} as const;
