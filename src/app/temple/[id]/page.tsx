'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeft,
  MapPin,
  Calendar,
  Landmark,
  ExternalLink,
  Trash2,
  Tag,
  Info,
  Film,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ImageGallery } from '@/components/temple/ImageGallery';
import { MapView } from '@/components/map/MapView';
import type { TempleWithMedia } from '@/lib/types';
import { format, parseISO } from 'date-fns';

export default function TempleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [temple, setTemple] = useState<TempleWithMedia | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch(`/api/temples/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then(setTemple)
      .catch(() => router.push('/'))
      .finally(() => setLoading(false));
  }, [id, router]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/temples/${id}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/');
      }
    } catch (error) {
      console.error('Failed to delete temple:', error);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6 space-y-6">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="aspect-[16/9] rounded-2xl" />
        <div className="space-y-3">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-4 w-1/3" />
        </div>
      </div>
    );
  }

  if (!temple) return null;

  const visitDate = (() => {
    try {
      return format(parseISO(temple.visit_date), 'EEEE, MMMM d, yyyy');
    } catch {
      return temple.visit_date;
    }
  })();

  const images = temple.media.filter(m => m.media_type === 'image');
  const videos = temple.media.filter(m => m.media_type === 'video');

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6">
      {/* Back navigation */}
      <div className="flex items-center justify-between mb-6 animate-fade-in">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Gallery
        </Link>

        <Dialog>
          <DialogTrigger>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Temple</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete &ldquo;{temple.name}&rdquo;? This will also remove all photos and videos. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Deleting…' : 'Delete'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Image Gallery */}
      {images.length > 0 && (
        <div className="mb-8 animate-fade-in stagger-1 opacity-0">
          <ImageGallery media={temple.media} />
        </div>
      )}

      {/* Temple Header */}
      <div className="mb-8 animate-fade-in stagger-2 opacity-0">
        <div className="flex items-start gap-3">
          {temple.status && temple.status !== 'active' && (
            <Badge variant="outline" className="mt-1.5 text-xs shrink-0">
              {temple.status.replace('_', ' ')}
            </Badge>
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight mt-1">
          {temple.name}
        </h1>

        <p className="mt-2 text-lg text-muted-foreground">
          {temple.deity_name}
        </p>

        {temple.sect && (
          <Badge variant="secondary" className="mt-3">
            {temple.sect}
          </Badge>
        )}
      </div>

      <Separator className="mb-8" />

      {/* Info Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8 animate-fade-in stagger-3 opacity-0">
        {/* Location */}
        <div className="flex gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium">Location</p>
            <p className="text-sm text-muted-foreground">
              {temple.city}, {temple.state}, {temple.country}
            </p>
            {temple.google_maps_url && (
              <a
                href={temple.google_maps_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-1 text-xs text-primary hover:underline"
              >
                Open in Google Maps
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>

        {/* Visit Date */}
        <div className="flex gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium">Visited</p>
            <p className="text-sm text-muted-foreground">{visitDate}</p>
          </div>
        </div>

        {/* Temple Info */}
        <div className="flex gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Landmark className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium">Deity (Moolnayak)</p>
            <p className="text-sm text-muted-foreground">{temple.deity_name}</p>
          </div>
        </div>

        {/* Media count */}
        <div className="flex gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Info className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium">Media</p>
            <p className="text-sm text-muted-foreground">
              {images.length} photo{images.length !== 1 ? 's' : ''}
              {videos.length > 0 && `, ${videos.length} video${videos.length !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>
      </div>

      {/* Tags */}
      {temple.tags && temple.tags.length > 0 && (
        <div className="mb-8 animate-fade-in stagger-4 opacity-0">
          <div className="flex items-center gap-2 mb-3">
            <Tag className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-medium">Tags</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {temple.tags.map((tag) => (
              <Badge key={tag} variant="outline">{tag}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {temple.notes && (
        <div className="mb-8 animate-fade-in stagger-4 opacity-0">
          <h2 className="text-sm font-medium mb-3">Notes</h2>
          <div className="rounded-xl bg-muted/50 p-4">
            <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {temple.notes}
            </p>
          </div>
        </div>
      )}

      {/* Videos */}
      {videos.length > 0 && (
        <div className="mb-8 animate-fade-in stagger-5 opacity-0">
          <div className="flex items-center gap-2 mb-3">
            <Film className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-medium">Videos</h2>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {videos.map((video) => (
              <video
                key={video.id}
                controls
                className="w-full rounded-xl bg-black"
                preload="metadata"
              >
                <source src={`/uploads/${video.storage_key}`} type={video.mime_type || 'video/mp4'} />
              </video>
            ))}
          </div>
        </div>
      )}

      {/* Map */}
      {temple.latitude && temple.longitude && (
        <div className="mb-8 animate-fade-in stagger-5 opacity-0">
          <h2 className="text-sm font-medium mb-3">Location Map</h2>
          <MapView
            temples={[temple]}
            singleMarker
            className="h-[300px] sm:h-[400px] w-full"
          />
        </div>
      )}

      {/* GPS Coordinates */}
      {temple.latitude && temple.longitude && (
        <div className="text-xs text-muted-foreground text-center pb-4">
          {temple.latitude.toFixed(6)}°N, {temple.longitude.toFixed(6)}°E
        </div>
      )}
    </div>
  );
}
