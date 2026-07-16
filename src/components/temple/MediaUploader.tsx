'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Film, ImageIcon } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface MediaUploaderProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  maxFiles?: number;
}

interface FilePreview {
  file: File;
  preview: string;
  type: 'image' | 'video';
}

export function MediaUploader({ files, onFilesChange, maxFiles = 20 }: MediaUploaderProps) {
  const [previews, setPreviews] = useState<FilePreview[]>([]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const validFiles: File[] = [];
      const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

      for (const file of acceptedFiles) {
        if (file.type.startsWith('image/') && file.size > MAX_IMAGE_SIZE) {
          alert(`Image "${file.name}" is too large. Images must be under 10MB.`);
          continue;
        }
        validFiles.push(file);
      }

      if (validFiles.length === 0) return;

      const newFiles = [...files, ...validFiles].slice(0, maxFiles);
      onFilesChange(newFiles);

      const newPreviews = validFiles.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
        type: (file.type.startsWith('image/') ? 'image' : 'video') as 'image' | 'video',
      }));

      setPreviews((prev) => [...prev, ...newPreviews].slice(0, maxFiles));
    },
    [files, onFilesChange, maxFiles]
  );

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    onFilesChange(newFiles);

    // Revoke the preview URL to free memory
    URL.revokeObjectURL(previews[index].preview);
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif'],
      'video/*': ['.mp4', '.mov', '.avi', '.webm'],
    },
    maxFiles: maxFiles - files.length,
    disabled: files.length >= maxFiles,
  });

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={cn(
          'relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 transition-all cursor-pointer',
          isDragActive
            ? 'border-primary bg-primary/5 scale-[1.02]'
            : 'border-border hover:border-primary/50 hover:bg-muted/50',
          files.length >= maxFiles && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Upload className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium">
              {isDragActive ? 'Drop files here' : 'Upload photos & videos'}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Drag & drop or tap to select · JPG, PNG, WebP, MP4, MOV
            </p>
          </div>
        </div>
      </div>

      {/* Previews */}
      {previews.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {previews.map((item, index) => (
            <div
              key={item.preview}
              className="group relative aspect-square rounded-xl overflow-hidden bg-muted animate-fade-in-scale"
            >
              {item.type === 'image' ? (
                <Image
                  src={item.preview}
                  alt={`Upload ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="120px"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-muted">
                  <Film className="h-8 w-8 text-muted-foreground" />
                </div>
              )}

              {/* Type indicator */}
              <div className="absolute bottom-1.5 left-1.5">
                {item.type === 'image' ? (
                  <ImageIcon className="h-3.5 w-3.5 text-white drop-shadow-md" />
                ) : (
                  <Film className="h-3.5 w-3.5 text-white drop-shadow-md" />
                )}
              </div>

              {/* Remove button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(index);
                }}
                className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/80"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Counter */}
      {files.length > 0 && (
        <p className="text-xs text-muted-foreground text-center">
          {files.length} of {maxFiles} files selected
        </p>
      )}
    </div>
  );
}
