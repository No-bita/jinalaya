'use client';

import { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Film, ImageIcon, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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

const getFileType = (file: File): 'image' | 'video' => {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';
  
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'heic', 'heif', 'bmp', 'tiff', 'avif'].includes(ext)) {
    return 'image';
  }
  if (['mp4', 'mov', 'avi', 'webm', 'mkv', 'm4v', '3gp', 'ogv'].includes(ext)) {
    return 'video';
  }
  return 'image';
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export function MediaUploader({ files, onFilesChange, maxFiles = 20 }: MediaUploaderProps) {
  const [previews, setPreviews] = useState<FilePreview[]>([]);
  const [activePreview, setActivePreview] = useState<FilePreview | null>(null);

  useEffect(() => {
    setPreviews((prevPreviews) => {
      const existingMap = new Map<File, FilePreview>();
      prevPreviews.forEach((item) => existingMap.set(item.file, item));

      const nextPreviews: FilePreview[] = files.map((file) => {
        if (existingMap.has(file)) {
          return existingMap.get(file)!;
        }
        return {
          file,
          preview: URL.createObjectURL(file),
          type: getFileType(file),
        };
      });

      // Cleanup object URLs for removed files
      prevPreviews.forEach((item) => {
        if (!files.includes(item.file)) {
          URL.revokeObjectURL(item.preview);
        }
      });

      return nextPreviews;
    });
  }, [files]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const validFiles: File[] = [];
      const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

      for (const file of acceptedFiles) {
        const type = getFileType(file);
        if (type === 'image' && file.size > MAX_IMAGE_SIZE) {
          alert(`Image "${file.name}" is too large. Images must be under 10MB.`);
          continue;
        }
        validFiles.push(file);
      }

      if (validFiles.length === 0) return;

      const newFiles = [...files, ...validFiles].slice(0, maxFiles);
      onFilesChange(newFiles);
    },
    [files, onFilesChange, maxFiles]
  );

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    onFilesChange(newFiles);
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
              onClick={() => setActivePreview(item)}
              className="group relative aspect-square rounded-xl overflow-hidden bg-muted animate-fade-in-scale cursor-pointer ring-1 ring-border/50 hover:ring-primary/50 transition-all"
            >
              {item.type === 'image' ? (
                <img
                  src={item.preview}
                  alt={item.file.name || `Upload ${index + 1}`}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <video
                  src={`${item.preview}#t=0.001`}
                  className="h-full w-full object-cover"
                  preload="metadata"
                  muted
                  playsInline
                />
              )}

              {/* Type indicator */}
              <div className="absolute bottom-1.5 left-1.5 z-10 flex items-center justify-center rounded-md bg-black/60 p-1 backdrop-blur-xs">
                {item.type === 'image' ? (
                  <ImageIcon className="h-3.5 w-3.5 text-white" />
                ) : (
                  <Film className="h-3.5 w-3.5 text-white" />
                )}
              </div>

              {/* Hover Overlay with Preview Eye */}
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                <Eye className="h-5 w-5 text-white drop-shadow-md" />
              </div>

              {/* Remove button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(index);
                }}
                aria-label="Remove media"
                className="absolute top-1.5 right-1.5 z-20 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white opacity-90 sm:opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/90 hover:scale-110"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Counter */}
      {files.length > 0 && (
        <p className="text-xs text-muted-foreground text-center font-medium">
          {files.length} of {maxFiles} files selected
        </p>
      )}

      {/* Full preview lightbox modal */}
      <Dialog open={!!activePreview} onOpenChange={(open) => !open && setActivePreview(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] p-4 flex flex-col items-center">
          <DialogHeader className="w-full text-left mb-2">
            <DialogTitle className="text-sm font-medium truncate pr-6">
              {activePreview?.file.name}
            </DialogTitle>
            <p className="text-xs text-muted-foreground">
              {activePreview && formatFileSize(activePreview.file.size)}
            </p>
          </DialogHeader>
          <div className="relative w-full max-h-[70vh] flex items-center justify-center overflow-hidden rounded-lg bg-black/90">
            {activePreview?.type === 'image' ? (
              <img
                src={activePreview.preview}
                alt={activePreview.file.name}
                className="max-h-[70vh] w-auto max-w-full object-contain"
              />
            ) : activePreview?.type === 'video' ? (
              <video
                src={activePreview.preview}
                controls
                autoPlay
                className="max-h-[70vh] w-full object-contain"
              />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

