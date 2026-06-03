'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useHttpClient } from '@/hooks/useHttpClient';
import { DOCUMENT_STATUS, DocumentStatus } from '@/constants';

export interface DocumentItem {
  id: string;
  name: string;
  status: DocumentStatus;
  sourceUrl: string | null;
  createdAt: string;
  updatedAt: string;
  chunkCount: number;
}

export function useDocuments(page = 1, limit = 10) {
  const api = useHttpClient();
  const queryClient = useQueryClient();

  // 1. Query for paginated list of documents
  const documentsQuery = useQuery<DocumentItem[]>({
    queryKey: ['documents', page, limit],
    queryFn: () => api.get<DocumentItem[]>(`/v1/docs?page=${page}&limit=${limit}`),
    // Smart Polling: only poll every 3 seconds if any document is processing or pending
    refetchInterval: (query) => {
      const data = query.state.data as DocumentItem[];
      if (
        data &&
        data.some(
          (doc) =>
            doc.status === DOCUMENT_STATUS.PENDING ||
            doc.status === DOCUMENT_STATUS.PROCESSING
        )
      ) {
        return 3000;
      }
      return false;
    },
  });

  // 2. Mutation for uploading a file
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);

      return api.post('/v1/docs/upload', formData);
    },
    onSuccess: () => {
      // Invalidate the documents list query to trigger a reload
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });

  // 3. Mutation for deleting a document by ID
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/v1/docs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });

  return {
    documents: documentsQuery.data || [],
    isLoading: documentsQuery.isLoading,
    isError: documentsQuery.isError,
    error: documentsQuery.error,
    refetch: documentsQuery.refetch,
    uploadFile: uploadMutation.mutateAsync,
    isUploading: uploadMutation.isPending,
    deleteDocument: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
}
