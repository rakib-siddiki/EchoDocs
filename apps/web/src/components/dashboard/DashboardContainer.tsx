'use client';

import React, { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { DashboardHeader } from './components/DashboardHeader';
import { FileUpload } from './Forms/FileUpload';
import { DocumentList } from './components/DocumentList';
import { DeleteConfirmDialog } from './Dialogs/DeleteConfirmDialog';
import { useDocuments, DocumentItem } from '../../hooks/useDocuments';

export default function DashboardContainer() {
  const { user } = useUser();
  const [page, setPage] = useState(1);
  const limit = 10;

  // Retrieve user role from Clerk public metadata
  const userRole = (user?.publicMetadata?.role || 'viewer') as 'admin' | 'viewer';
  const isAdmin = userRole === 'admin';

  // TanStack Query custom hook for documents
  const {
    documents,
    isLoading,
    uploadFile,
    deleteDocument,
    isDeleting,
  } = useDocuments(page, limit);

  // Dialog State
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);

  const handleDeleteRequest = (doc: DocumentItem) => {
    setSelectedDoc(doc);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (selectedDoc) {
      try {
        await deleteDocument(selectedDoc.id);
        setIsDeleteDialogOpen(false);
        setSelectedDoc(null);
      } catch (err) {
        console.error('Failed to delete document:', err);
      }
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1) {
      setPage(newPage);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 font-sans">
      <DashboardHeader />

      <main className="flex-1 w-full max-w-6xl mx-auto px-6 py-10 flex flex-col gap-8">
        {/* Welcome Section */}
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-slate-50 via-slate-200 to-slate-400 bg-clip-text text-transparent mb-2">
            Document Management
          </h1>
          <p className="text-slate-400 text-sm">
            Upload, monitor, and manage your source materials. Documents are parsed and embedded for RAG query context.
          </p>
        </div>

        {/* Upload Zone (Only visible to Admins) */}
        {isAdmin ? (
          <div>
            <h2 className="text-lg font-semibold text-slate-300 mb-3">Upload New Materials</h2>
            <FileUpload onUpload={uploadFile} />
          </div>
        ) : (
          <div className="bg-slate-900/35 border border-white/5 rounded-2xl p-4 flex items-center gap-3">
            <span className="w-2.5 h-2.5 bg-purple-500 rounded-full shadow-[0_0_8px_#a855f7]" />
            <span className="text-xs font-semibold text-purple-300 uppercase tracking-wider">
              Viewer Account
            </span>
            <span className="text-xs text-slate-400 border-l border-white/10 pl-3">
              You are signed in as a viewer. Contact your administrator to upload or delete documents.
            </span>
          </div>
        )}

        {/* Documents Table */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-300">Ingested Documents</h2>
            <span className="text-xs text-slate-500 font-mono">
              Page {page}
            </span>
          </div>

          <DocumentList
            documents={documents}
            isLoading={isLoading}
            userRole={userRole}
            onDeleteRequest={handleDeleteRequest}
          />

          {/* Pagination Controls */}
          {documents.length > 0 || page > 1 ? (
            <div className="flex justify-between items-center mt-2">
              <button
                type="button"
                disabled={page === 1 || isLoading}
                onClick={() => handlePageChange(page - 1)}
                className="px-4 py-2 text-xs font-semibold bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition-all disabled:opacity-30 disabled:pointer-events-none"
              >
                Previous Page
              </button>
              <span className="text-xs text-slate-400 font-medium">
                Page {page}
              </span>
              <button
                type="button"
                disabled={documents.length < limit || isLoading}
                onClick={() => handlePageChange(page + 1)}
                className="px-4 py-2 text-xs font-semibold bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition-all disabled:opacity-30 disabled:pointer-events-none"
              >
                Next Page
              </button>
            </div>
          ) : null}
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {selectedDoc && (
        <DeleteConfirmDialog
          isOpen={isDeleteDialogOpen}
          documentName={selectedDoc.name}
          isDeleting={isDeleting}
          onConfirm={handleDeleteConfirm}
          onCancel={() => {
            setIsDeleteDialogOpen(false);
            setSelectedDoc(null);
          }}
        />
      )}
    </div>
  );
}
