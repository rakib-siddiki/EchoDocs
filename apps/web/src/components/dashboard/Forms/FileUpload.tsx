'use client';

import React, { useState, useRef } from 'react';

interface FileUploadProps {
  onUpload: (file: File) => Promise<any>;
}

interface UploadingFile {
  id: string;
  name: string;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  errorMsg?: string;
}

export function FileUpload({ onUpload }: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndUpload = async (files: FileList) => {
    setGlobalError(null);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      
      // Validation: File type
      if (ext !== '.pdf' && ext !== '.md') {
        setGlobalError('Only PDF and Markdown files are supported');
        continue;
      }

      // Validation: File size (20 MB limit)
      const maxBytes = 20 * 1024 * 1024;
      if (file.size > maxBytes) {
        setGlobalError(`File "${file.name}" is too large. Max size is 20 MB.`);
        continue;
      }

      const fileId = `${file.name}-${Date.now()}-${i}`;
      const newUpload: UploadingFile = {
        id: fileId,
        name: file.name,
        progress: 10,
        status: 'uploading',
      };

      setUploadingFiles((prev) => [newUpload, ...prev]);

      try {
        // Mock progress steps
        const interval = setInterval(() => {
          setUploadingFiles((prev) =>
            prev.map((f) =>
              f.id === fileId && f.progress < 90
                ? { ...f, progress: f.progress + 20 }
                : f
            )
          );
        }, 150);

        await onUpload(file);
        
        clearInterval(interval);
        setUploadingFiles((prev) =>
          prev.map((f) =>
            f.id === fileId
              ? { ...f, progress: 100, status: 'success' }
              : f
          )
        );
      } catch (err: any) {
        setUploadingFiles((prev) =>
          prev.map((f) =>
            f.id === fileId
              ? { ...f, status: 'error', errorMsg: err.message || 'Upload failed' }
              : f
          )
        );
      }
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndUpload(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndUpload(e.target.files);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full max-w-2xl mx-auto mb-8">
      {/* Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={triggerFileInput}
        className={`relative flex flex-col items-center justify-center p-10 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300 backdrop-blur-md ${
          dragActive
            ? 'border-sky-400 bg-sky-500/10 scale-[1.01] shadow-[0_0_20px_rgba(56,189,248,0.15)]'
            : 'border-white/10 bg-slate-900/40 hover:border-white/25 hover:bg-slate-900/60'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.md"
          onChange={handleChange}
          className="hidden"
        />

        {/* Upload Icon */}
        <div className="flex items-center justify-center w-14 h-14 rounded-full bg-slate-800 border border-white/5 mb-4 group-hover:scale-110 transition-transform">
          <svg
            className="w-6 h-6 text-slate-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
        </div>

        <h3 className="text-lg font-semibold text-slate-100 mb-1">
          Drag & Drop your documents
        </h3>
        <p className="text-sm text-slate-400 mb-3">
          Supports <span className="text-sky-400 font-medium">PDF</span> and{' '}
          <span className="text-purple-400 font-medium">Markdown</span> files (up to 20MB)
        </p>
        <button
          type="button"
          className="text-xs font-semibold px-4 py-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-all"
        >
          Browse Files
        </button>
      </div>

      {/* Global Error message */}
      {globalError && (
        <div className="flex items-center gap-2 mt-4 px-4 py-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-sm transition-all duration-300">
          <svg
            className="w-4 h-4 shrink-0"
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
          <span>{globalError}</span>
        </div>
      )}

      {/* Uploading File Items */}
      {uploadingFiles.length > 0 && (
        <div className="mt-6 space-y-3">
          {uploadingFiles.map((file) => (
            <div
              key={file.id}
              className="bg-slate-900/60 border border-white/5 rounded-xl p-4 flex flex-col gap-2 transition-all duration-300"
            >
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-200 truncate max-w-md font-medium">
                  {file.name}
                </span>
                {file.status === 'success' && (
                  <span className="text-xs text-emerald-400 flex items-center gap-1 font-semibold">
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Ready
                  </span>
                )}
                {file.status === 'error' && (
                  <span className="text-xs text-rose-400 font-semibold">
                    Upload Failed
                  </span>
                )}
                {file.status === 'uploading' && (
                  <span className="text-xs text-slate-400">
                    {file.progress}%
                  </span>
                )}
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    file.status === 'success'
                      ? 'bg-emerald-500'
                      : file.status === 'error'
                      ? 'bg-rose-500'
                      : 'bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.5)]'
                  }`}
                  style={{ width: `${file.progress}%` }}
                />
              </div>

              {file.status === 'error' && file.errorMsg && (
                <span className="text-xs text-rose-400/90 leading-tight">
                  {file.errorMsg}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
