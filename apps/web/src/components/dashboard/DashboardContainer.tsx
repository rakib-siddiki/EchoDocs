'use client';

import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { FileUpload } from './Forms/FileUpload';
import { DocumentList } from './components/DocumentList';
import { DeleteConfirmDialog } from './Dialogs/DeleteConfirmDialog';
import { useDocuments, DocumentItem } from '../../hooks/useDocuments';
import { DOCUMENT_STATUS } from '@/constants';
import { 
  FileText, 
  Layers, 
  Sparkles, 
  Activity, 
  Database,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';

export default function DashboardContainer() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const limit = 10;

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

  // Compute stat values dynamically
  const totalFiles = documents?.length || 0;
  const totalChunks = documents?.reduce((acc, doc) => {
    return acc + (doc.status === DOCUMENT_STATUS.PROCESSED ? (doc.chunkCount || 0) : 0);
  }, 0) || 0;

  const activeWorkerCount = documents?.filter(
    (doc) => doc.status === DOCUMENT_STATUS.PROCESSING
  ).length || 0;

  return (
    <>
      <main className="flex-1 w-full max-w-6xl mx-auto px-6 py-10 flex flex-col gap-8 relative z-10 selection:bg-purple-500/30 selection:text-white">
        
        {/* Decorative background glows */}
        <div className="absolute top-[10%] left-[-15%] w-[350px] h-[350px] bg-purple-500/5 rounded-full blur-[100px] pointer-events-none animate-pulse-glow" />
        <div className="absolute bottom-[20%] right-[-15%] w-[350px] h-[350px] bg-sky-500/5 rounded-full blur-[100px] pointer-events-none animate-pulse-glow" style={{ animationDelay: '3s' }} />

        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-white/[0.03] border border-white/10 rounded-full px-3 py-1 mb-3">
              <Sparkles className="w-3 h-3 text-sky-400 animate-pulse" />
              <span className="text-[10px] font-semibold tracking-wider text-slate-300 uppercase">
                WORKSPACE ACTIVE
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight bg-linear-to-r from-slate-50 via-slate-200 to-slate-400 bg-clip-text text-transparent">
              Document Management
            </h1>
            <p className="text-slate-400 text-sm font-light mt-1">
              Upload, monitor, and manage your source materials. Documents are chunked and embedded for RAG query context.
            </p>
          </div>
          
          {user && (
            <div className="flex items-center gap-3 bg-white/[0.01] border border-white/5 rounded-2xl px-4 py-2 shrink-0">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
              <div className="text-left">
                <p className="text-[10px] text-slate-500 font-bold uppercase">Account ID</p>
                <p className="text-xs font-semibold text-slate-200">{user.email}</p>
              </div>
            </div>
          )}
        </div>

        {/* Dashboard Statistics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Stat 1 */}
          <div className="bg-white/[0.01] backdrop-blur-md border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all duration-300 flex items-center justify-between group">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Ingested Materials</span>
              <p className="text-2xl font-black text-slate-100 group-hover:text-sky-400 transition-colors">
                {isLoading ? '...' : totalFiles} files
              </p>
              <p className="text-[10px] text-slate-400 font-light">Supported formats: PDF, MD</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/15 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileText className="w-5 h-5 text-sky-400" />
            </div>
          </div>

          {/* Stat 2 */}
          <div className="bg-white/[0.01] backdrop-blur-md border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all duration-300 flex items-center justify-between group">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Semantic Vectors</span>
              <p className="text-2xl font-black text-slate-100 group-hover:text-purple-400 transition-colors">
                {isLoading ? '...' : totalChunks.toLocaleString()} chunks
              </p>
              <p className="text-[10px] text-slate-400 font-light">Available for AI query context</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/15 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Layers className="w-5 h-5 text-purple-400" />
            </div>
          </div>

          {/* Stat 3 */}
          <div className="bg-white/[0.01] backdrop-blur-md border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all duration-300 flex items-center justify-between group">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Worker Engine</span>
              <p className="text-2xl font-black text-slate-100 group-hover:text-pink-400 transition-colors">
                {activeWorkerCount > 0 ? `${activeWorkerCount} active` : 'Idle'}
              </p>
              <p className="text-[10px] text-slate-400 font-light">BullMQ worker queue connected</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/15 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Activity className="w-5 h-5 text-pink-400 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Upload Zone */}
        <div className="bg-white/[0.01] backdrop-blur-md border border-white/5 rounded-2xl p-6">
          <h2 className="text-base font-bold text-slate-200 mb-4 flex items-center gap-2">
            <Database className="w-4 h-4 text-sky-400" />
            <span>Upload New Materials</span>
          </h2>
          <FileUpload onUpload={uploadFile} />
        </div>

        {/* Documents Table Container */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-base font-bold text-slate-200">
              Ingested Source Base
            </h2>
            <span className="text-[10px] font-mono text-slate-500 bg-white/5 border border-white/5 px-2 py-0.5 rounded-md">
              PAGE {page}
            </span>
          </div>

          <DocumentList
            documents={documents}
            isLoading={isLoading}
            onDeleteRequest={handleDeleteRequest}
          />

          {/* Pagination Controls */}
          {(documents.length > 0 || page > 1) && (
            <div className="flex justify-between items-center mt-2 px-1">
              <button
                type="button"
                disabled={page === 1 || isLoading}
                onClick={() => handlePageChange(page - 1)}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-white/5 border border-white/10 hover:border-white/20 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Previous Page</span>
              </button>
              <span className="text-xs text-slate-400 font-semibold font-mono">
                {page}
              </span>
              <button
                type="button"
                disabled={documents.length < limit || isLoading}
                onClick={() => handlePageChange(page + 1)}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-white/5 border border-white/10 hover:border-white/20 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              >
                <span>Next Page</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
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
    </>
  );
}

