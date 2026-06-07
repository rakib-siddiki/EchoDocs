'use client';

import React from 'react';

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  documentName: string;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteConfirmDialog({
  isOpen,
  documentName,
  isDeleting,
  onConfirm,
  onCancel,
}: DeleteConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
        onClick={onCancel}
      />

      {/* Modal Content */}
      <div className="relative bg-slate-900/90 border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl z-10 transition-all transform scale-100 backdrop-blur-lg">
        <div className="flex items-start gap-4 mb-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 shrink-0 animate-pulse">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100">
              Delete Document
            </h3>
            <p className="text-sm text-slate-400 mt-1 leading-relaxed font-light">
              Are you sure you want to delete <span className="text-slate-200 font-semibold">{documentName}</span>? 
              This action is permanent and will cascade to delete all associated vector chunks.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            disabled={isDeleting}
            onClick={onCancel}
            className="px-4 py-2 text-sm font-semibold bg-white/5 border border-white/10 hover:border-white/20 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition-all disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded-xl shadow-[0_5px_15px_-3px_rgba(225,29,72,0.4)] transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer hover:scale-102"
          >
            {isDeleting ? (
              <>
                <svg
                  className="animate-spin h-3.5 w-3.5 text-white"
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
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
