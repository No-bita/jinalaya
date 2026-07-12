'use client';

import { useState, useEffect } from 'react';
import { MapView } from '@/components/map/MapView';
import { Skeleton } from '@/components/ui/skeleton';
import type { TempleWithMedia } from '@/lib/types';

export default function MapPage() {
  const [temples, setTemples] = useState<TempleWithMedia[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/temples?limit=10000')
      .then((res) => res.json())
      .then((data) => setTemples(data.temples))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const templesWithCoords = temples.filter(t => t.latitude && t.longitude);

  return (
    <div className="flex flex-col h-[calc(100dvh-4rem)] md:h-[calc(100dvh-4rem)]">
      {/* Header */}
      <div className="px-4 sm:px-6 py-4 animate-fade-in">
        <h1 className="text-2xl font-heading font-bold tracking-tight">
          Temple Map
        </h1>
        <p className="text-sm text-muted-foreground">
          {templesWithCoords.length} temple{templesWithCoords.length !== 1 ? 's' : ''} on the map
        </p>
      </div>

      {/* Map */}
      <div className="flex-1 px-4 sm:px-6 pb-4">
        {loading ? (
          <Skeleton className="h-full w-full rounded-xl" />
        ) : (
          <MapView
            temples={temples}
            className="h-full w-full"
            zoom={5}
            center={[22.5, 79.0]}
          />
        )}
      </div>
    </div>
  );
}
