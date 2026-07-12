'use client';

import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Calendar, Landmark } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { TempleWithMedia } from '@/lib/types';
import { format, parseISO } from 'date-fns';

interface TempleCardProps {
  temple: TempleWithMedia;
  index?: number;
}

export function TempleCard({ temple, index = 0 }: TempleCardProps) {
  const coverUrl = temple.cover_image
    ? `/uploads/${temple.cover_image.thumbnail_key || temple.cover_image.storage_key}`
    : null;

  const visitDate = (() => {
    try {
      return format(parseISO(temple.visit_date), 'MMM d, yyyy');
    } catch {
      return temple.visit_date;
    }
  })();

  return (
    <Link
      href={`/temple/${temple.id}`}
      className={`group block animate-fade-in opacity-0 stagger-${Math.min(index + 1, 6)}`}
    >
      <article className="overflow-hidden rounded-2xl bg-card border border-border shadow-sm transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1">
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          {coverUrl ? (
            <Image
              src={coverUrl}
              alt={temple.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Landmark className="h-12 w-12 text-muted-foreground/30" />
            </div>
          )}

          {/* Status badge */}
          {temple.status && temple.status !== 'active' && (
            <div className="absolute top-3 left-3">
              <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm text-xs font-medium">
                {temple.status.replace('_', ' ')}
              </Badge>
            </div>
          )}

          {/* Media count */}
          {temple.media.length > 1 && (
            <div className="absolute top-3 right-3">
              <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm text-xs font-medium">
                {temple.media.filter(m => m.media_type === 'image').length} photos
              </Badge>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-heading font-semibold text-base leading-tight truncate">
            {temple.name}
          </h3>

          <p className="mt-1 text-sm text-muted-foreground truncate">
            {temple.deity_name}
          </p>

          <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {temple.city}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {visitDate}
            </span>
          </div>

          {/* Tags */}
          {temple.tags && temple.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {temple.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" className="text-[10px] px-1.5 py-0 font-normal">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </article>
    </Link>
  );
}
