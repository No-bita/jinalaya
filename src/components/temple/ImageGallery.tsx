'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Media } from '@/lib/types';

interface ImageGalleryProps {
  media: Media[];
}

export function ImageGallery({ media }: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const images = media.filter(m => m.media_type === 'image');

  if (images.length === 0) return null;

  const openLightbox = (index: number) => setSelectedIndex(index);
  const closeLightbox = () => setSelectedIndex(null);

  const goNext = () => {
    if (selectedIndex !== null) {
      setSelectedIndex((selectedIndex + 1) % images.length);
    }
  };

  const goPrev = () => {
    if (selectedIndex !== null) {
      setSelectedIndex((selectedIndex - 1 + images.length) % images.length);
    }
  };

  return (
    <>
      {/* Thumbnail grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {images.map((img, index) => {
          const isFirst = index === 0;
          return (
            <button
              key={img.id}
              onClick={() => openLightbox(index)}
              className={cn(
                'relative overflow-hidden rounded-xl bg-muted transition-all hover:opacity-90 active:scale-[0.98]',
                isFirst && images.length > 2 ? 'col-span-2 row-span-2 aspect-[4/3]' : 'aspect-square'
              )}
            >
              <Image
                src={`/uploads/${img.thumbnail_key || img.storage_key}`}
                alt={`Photo ${index + 1}`}
                fill
                className="object-cover"
                sizes={isFirst ? '(max-width: 640px) 100vw, 66vw' : '(max-width: 640px) 50vw, 33vw'}
              />
            </button>
          );
        })}
      </div>

      {/* Lightbox */}
      {selectedIndex !== null && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 animate-fade-in-scale"
          onClick={closeLightbox}
        >
          {/* Close button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Navigation */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); goPrev(); }}
                className="absolute left-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); goNext(); }}
                className="absolute right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}

          {/* Image */}
          <div
            className="relative max-h-[85vh] max-w-[90vw]"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={`/uploads/${images[selectedIndex].storage_key}`}
              alt={`Photo ${selectedIndex + 1}`}
              width={images[selectedIndex].width || 1200}
              height={images[selectedIndex].height || 800}
              className="max-h-[85vh] w-auto object-contain rounded-lg"
              priority
            />
          </div>

          {/* Counter */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-4 py-1.5 text-sm text-white backdrop-blur-sm">
            {selectedIndex + 1} / {images.length}
          </div>
        </div>
      )}
    </>
  );
}
