'use client';

import React from 'react';
import { DocumentItem } from '../../../hooks/useDocuments';
import { DOCUMENT_STATUS } from '@/constants';

interface DocumentListProps {
  documents: DocumentItem[];
  isLoading: boolean;
  userRole: 'admin' | 'viewer';
  onDeleteRequest: (doc: DocumentItem) => void;
}

export function DocumentList({
  documents,
  isLoading,
  userRole,
  onDeleteRequest,
}: DocumentListProps) {
  const isAdmin = userRole === 'admin';

  const getStatusBadge = (status: DocumentItem['status']) => {
    switch (status) {
      case DOCUMENT_STATUS.PENDING:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-800 text-slate-400 border border-slate-700">
            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-pulse" />
            Pending
          </span>
        );
      case DOCUMENT_STATUS.PROCESSING:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/25">
            <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-bounce" />
            Processing
          </span>
        );
      case DOCUMENT_STATUS.PROCESSED:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            Processed
          </span>
        );
      case DOCUMENT_STATUS.FAILED:
        return (
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/25 group relative cursor-help"
            title="Retry by uploading the file again"
          >
            <span className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
            Failed
          </span>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch (_) {
      return dateStr;
    }
  };

  if (isLoading) {
    return (
      <div className="w-full bg-slate-900/40 border border-white/10 rounded-2xl p-8 text-center backdrop-blur-md">
        <div className="flex flex-col items-center gap-3">
          <svg
            className="animate-spin h-8 w-8 text-sky-400"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span className="text-sm text-slate-400 font-medium">
            Loading documents...
          </span>
        </div>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="w-full bg-slate-900/40 border border-white/10 rounded-2xl p-12 text-center backdrop-blur-md">
        <svg
          className="w-12 h-12 text-slate-600 mx-auto mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <h3 className="text-lg font-semibold text-slate-200 mb-1">
          No documents found
        </h3>
        <p className="text-sm text-slate-500 max-w-sm mx-auto">
          Upload PDF or Markdown files above to start parsing and embedding them in the database.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full bg-slate-900/40 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 bg-slate-950/20 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <th className="py-4 px-6">Document Name</th>
              <th className="py-4 px-6">Status</th>
              <th className="py-4 px-6">Date Uploaded</th>
              <th className="py-4 px-6 text-center">Chunks</th>
              {isAdmin && <th className="py-4 px-6 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-sm text-slate-300">
            {documents.map((doc) => (
              <tr
                key={doc.id}
                className="hover:bg-white/3 transition-colors duration-150"
              >
                <td className="py-4 px-6 font-medium text-slate-200 truncate max-w-xs md:max-w-md">
                  {doc.name}
                </td>
                <td className="py-4 px-6">{getStatusBadge(doc.status)}</td>
                <td className="py-4 px-6 text-xs text-slate-400">
                  {formatDate(doc.createdAt)}
                </td>
                <td className="py-4 px-6 text-center font-mono font-medium">
                  {doc.status === DOCUMENT_STATUS.PROCESSED ? doc.chunkCount : '-'}
                </td>
                {isAdmin && (
                  <td className="py-4 px-6 text-right">
                    <button
                      type="button"
                      onClick={() => onDeleteRequest(doc)}
                      className="p-2 text-slate-400 hover:text-rose-400 bg-slate-800/40 hover:bg-rose-500/10 border border-white/5 hover:border-rose-500/20 rounded-xl transition-all"
                      title="Delete document"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
