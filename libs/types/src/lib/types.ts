export type DocumentStatus = 'PENDING' | 'PROCESSING' | 'PROCESSED' | 'FAILED';

export interface Document {
  id: string;
  name: string;
  sourceUrl?: string | null;
  status: DocumentStatus;
  createdAt: Date | string;
  updatedAt: Date | string;
  chunks?: Chunk[];
}

export interface Chunk {
  id: string;
  content: string;
  embedding?: number[];
  chunkIndex: number;
  documentId: string;
  document?: Document;
}

export type UserRole = 'system' | 'user' | 'assistant';

export interface ChatMessage {
  id?: string;
  role: UserRole;
  content: string;
  createdAt?: Date | string;
}

export interface Citation {
  chunkId: string;
  documentId: string;
  documentName: string;
  content: string;
  chunkIndex: number;
}

export interface QueryResult {
  answer: string;
  citations: Citation[];
}
