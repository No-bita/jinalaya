'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, Landmark, MapPin } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { TempleWithMedia } from '@/lib/types';
import { getMediaUrl } from '@/lib/utils';
import { format, parseISO } from 'date-fns';

interface GroupedTimeline {
  [year: string]: {
    [month: string]: TempleWithMedia[];
  };
}

export default function TimelinePage() {
  const [temples, setTemples] = useState<TempleWithMedia[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/temples?limit=10000')
      .then((res) => res.json())
      .then((data) => setTemples(data.temples))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Group by year → month
  const grouped: GroupedTimeline = {};
  for (const temple of temples) {
    try {
      const date = parseISO(temple.visit_date);
      const year = format(date, 'yyyy');
      const month = format(date, 'MMMM');

      if (!grouped[year]) grouped[year] = {};
      if (!grouped[year][month]) grouped[year][month] = [];
      grouped[year][month].push(temple);
    } catch {
      // Skip invalid dates
    }
  }

  const years = Object.keys(grouped).sort((a, b) => Number(b) - Number(a));

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6 space-y-8">
        <Skeleton className="h-8 w-40" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  let absoluteIndex = 0;

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="mb-8 animate-fade-in">
        <h1 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight">
          Timeline
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your temple visits through time
        </p>
      </div>

      {temples.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-muted mb-6">
            <Calendar className="h-10 w-10 text-muted-foreground/50" />
          </div>
          <h2 className="text-lg font-heading font-semibold">No visits yet</h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm">
            Your temple visits will appear here organized by date.
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {years.map((year) => (
            <div key={year} className="animate-fade-in">
              {/* Year header */}
              <div className="sticky top-16 z-10 py-2 bg-background/80 backdrop-blur-sm mb-6">
                <h2 className="text-xl font-heading font-bold text-primary">
                  {year}
                </h2>
              </div>

              <div className="space-y-8">
                {Object.keys(grouped[year])
                  .sort((a, b) => {
                    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                    return months.indexOf(b) - months.indexOf(a);
                  })
                  .map((month) => (
                    <div key={month}>
                      {/* Month header */}
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                        {month}
                      </h3>

                      {/* Temple entries */}
                      <div className="relative pl-6 border-l-2 border-border space-y-4">
                        {grouped[year][month].map((temple) => {
                          const coverUrl = temple.cover_image
                            ? getMediaUrl(temple.cover_image.thumbnail_key || temple.cover_image.storage_key)
                            : null;
                          const isPriority = absoluteIndex < 3;
                          absoluteIndex++;

                          return (
                            <Link
                              key={temple.id}
                              href={`/temple/${temple.id}`}
                              className="group block"
                            >
                              {/* Timeline dot */}
                              <div className="absolute -left-[7px] mt-3.5 h-3 w-3 rounded-full bg-primary/60 border-2 border-background group-hover:bg-primary transition-colors" />

                              <div className="flex gap-4 rounded-xl p-3 -ml-1 transition-colors hover:bg-muted/50">
                                {/* Thumbnail */}
                                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                                  {coverUrl ? (
                                    <Image
                                      src={coverUrl}
                                      alt={temple.name}
                                      fill
                                      className="object-cover"
                                      sizes="64px"
                                      priority={isPriority}
                                    />
                                  ) : (
                                    <div className="flex h-full items-center justify-center">
                                      <Landmark className="h-6 w-6 text-muted-foreground/30" />
                                    </div>
                                  )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                                    {temple.name}
                                  </h4>
                                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                                    {temple.deity_name}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                                    <MapPin className="h-3 w-3" />
                                    <span>{temple.city}, {temple.state}</span>
                                  </div>
                                </div>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
