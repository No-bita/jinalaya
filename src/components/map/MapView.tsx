'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { getMediaUrl } from '@/lib/utils';
import type { TempleWithMedia } from '@/lib/types';

// Dynamic imports to avoid SSR issues with Leaflet
let MapContainer: typeof import('react-leaflet').MapContainer;
let TileLayer: typeof import('react-leaflet').TileLayer;
let Marker: typeof import('react-leaflet').Marker;
let Popup: typeof import('react-leaflet').Popup;
let L: typeof import('leaflet');

interface MapViewProps {
  temples: TempleWithMedia[];
  center?: [number, number];
  zoom?: number;
  className?: string;
  singleMarker?: boolean;
}

export function MapView({
  temples,
  center = [22.5, 73.5], // Center of Gujarat/India
  zoom = 5,
  className = 'h-[500px] w-full',
  singleMarker = false,
}: MapViewProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Dynamically import Leaflet and react-leaflet
    Promise.all([
      import('react-leaflet'),
      import('leaflet'),
      import('leaflet/dist/leaflet.css'),
    ]).then(([rl, leaflet]) => {
      MapContainer = rl.MapContainer;
      TileLayer = rl.TileLayer;
      Marker = rl.Marker;
      Popup = rl.Popup;
      L = leaflet.default || leaflet;

      // Fix default marker icons
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      setIsLoaded(true);
    });
  }, []);

  if (!isLoaded) {
    return (
      <div className={`${className} rounded-xl bg-muted flex items-center justify-center`}>
        <div className="text-muted-foreground text-sm">Loading map…</div>
      </div>
    );
  }

  const templesWithCoords = temples.filter(t => t.latitude && t.longitude);

  // Calculate bounds if we have temples with coordinates
  const bounds = templesWithCoords.length > 0 && !singleMarker
    ? templesWithCoords.map(t => [t.latitude!, t.longitude!] as [number, number])
    : undefined;

  return (
    <div className={`${className} rounded-xl overflow-hidden`}>
      <MapContainer
        center={
          singleMarker && templesWithCoords[0]
            ? [templesWithCoords[0].latitude!, templesWithCoords[0].longitude!]
            : center
        }
        zoom={singleMarker ? 14 : zoom}
        className="h-full w-full z-0"
        bounds={bounds && bounds.length > 1 ? (L!.latLngBounds(bounds) as unknown as undefined) : undefined}
        scrollWheelZoom={!singleMarker}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {templesWithCoords.map((temple) => (
          <Marker
            key={temple.id}
            position={[temple.latitude!, temple.longitude!]}
          >
            <Popup>
              <div className="min-w-[200px] p-0 font-sans">
                {temple.cover_image && (
                  <div className="w-full h-32 overflow-hidden rounded-t-lg -mt-[14px] -mx-[20px] mb-3" style={{ width: 'calc(100% + 40px)' }}>
                    <img
                      src={getMediaUrl(temple.cover_image.thumbnail_key || temple.cover_image.storage_key)}
                      alt={temple.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="px-0.5">
                  <h3 className="font-semibold text-sm">{temple.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{temple.deity_name}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {temple.city}, {temple.state}
                  </p>
                  {!singleMarker && (
                    <a
                      href={`/temple/${temple.id}`}
                      className="inline-block mt-2 text-xs text-blue-600 font-medium hover:underline"
                    >
                      View details →
                    </a>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
