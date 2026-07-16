'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  MapPin,
  Loader2,
  ChevronLeft,
  Navigation,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MediaUploader } from '@/components/temple/MediaUploader';
import type { TempleStatus } from '@/lib/types';
import Link from 'next/link';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya',
  'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim',
  'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand',
  'West Bengal', 'Delhi', 'Jammu & Kashmir', 'Ladakh',
  'Chandigarh', 'Puducherry', 'Dadra & Nagar Haveli', 'Lakshadweep',
  'Andaman & Nicobar Islands',
];

const JAIN_SECTS = [
  'Digambar',
  'Shwetambar',
  'Shwetambar Murtipujak',
  'Shwetambar Sthanakvasi',
  'Shwetambar Terapanthi',
];

const TEMPLE_STATUSES: { value: TempleStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'under_renovation', label: 'Under Renovation' },
  { value: 'closed', label: 'Closed' },
  { value: 'special_pilgrimage', label: 'Special Pilgrimage' },
];

export default function AddTemplePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  // Form state
  const [name, setName] = useState('');
  const [deityName, setDeityName] = useState('');
  const [sect, setSect] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country] = useState('India');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<TempleStatus>('active');
  const [tagsInput, setTagsInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  const detectLocation = async () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setDetectingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setLatitude(lat.toFixed(6));
        setLongitude(lng.toFixed(6));

        // Reverse geocode
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=12`
          );
          const data = await res.json();
          if (data.address) {
            if (data.address.city || data.address.town || data.address.village) {
              setCity(data.address.city || data.address.town || data.address.village || '');
            }
            if (data.address.state) {
              // Try to match the state to our list
              const matchedState = INDIAN_STATES.find(
                s => s.toLowerCase() === data.address.state.toLowerCase()
              );
              if (matchedState) setState(matchedState);
            }
          }
        } catch {
          // Reverse geocoding is best-effort
        }

        setDetectingLocation(false);
      },
      (error) => {
        let errorMessage = 'Unable to detect location.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access was denied. Please check your browser or OS location permissions.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable on this device right now.';
            break;
          case error.TIMEOUT:
            errorMessage = 'The location request timed out. Please try again.';
            break;
        }
        console.warn('Geolocation error:', error.message);
        alert(errorMessage + '\\n\\nPlease enter coordinates manually or use a Google Maps URL.');
        setDetectingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
    }
    setTagsInput('');
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !deityName || !city || !state || !visitDate) {
      alert('Please fill in all required fields');
      return;
    }

    if (!(latitude && longitude) && !googleMapsUrl) {
      alert('Please provide either Auto-detected coordinates or a Google Maps URL.');
      return;
    }

    setLoading(true);

    try {
      // 1. Create temple record
      const finalGoogleMapsUrl = googleMapsUrl || (latitude && longitude
        ? `https://www.google.com/maps?q=${latitude},${longitude}`
        : undefined);

      const templeRes = await fetch('/api/temples', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          deity_name: deityName,
          sect: sect || undefined,
          city,
          state,
          country,
          latitude: latitude ? parseFloat(latitude) : undefined,
          longitude: longitude ? parseFloat(longitude) : undefined,
          google_maps_url: finalGoogleMapsUrl,
          visit_date: visitDate,
          notes: notes || undefined,
          status,
          tags: tags.length > 0 ? tags : undefined,
        }),
      });

      if (!templeRes.ok) {
        const errData = await templeRes.json().catch(() => null);
        throw new Error(errData?.error || 'Failed to create temple');
      }
      const temple = await templeRes.json();

      // 2. Upload media if any
      if (files.length > 0) {
        const formData = new FormData();
        formData.set('temple_id', temple.id);
        for (const file of files) {
          formData.append('files', file);
        }

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!uploadRes.ok) {
          console.error('Media upload failed, but temple was created');
        }
      }

      router.push(`/temple/${temple.id}`);
    } catch (error: any) {
      console.error('Error creating temple:', error);
      alert(error?.message || 'Failed to create temple. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="mb-8 animate-fade-in">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </Link>
        <h1 className="text-2xl font-heading font-bold tracking-tight">
          Record a Temple Visit
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Capture the details of your darshan
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Media Upload */}
        <section className="animate-fade-in stagger-1 opacity-0">
          <label className="text-sm font-medium mb-3 block">Photos & Videos</label>
          <MediaUploader files={files} onFilesChange={setFiles} />
        </section>

        {/* Temple Info */}
        <section className="space-y-4 animate-fade-in stagger-2 opacity-0">
          <h2 className="text-sm font-medium text-foreground">Temple Information</h2>

          <div className="space-y-3">
            <Input
              placeholder="Temple Name *"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="h-12 rounded-xl bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary/30"
            />
            <Input
              placeholder="Moolnayak / Deity Name *"
              value={deityName}
              onChange={(e) => setDeityName(e.target.value)}
              required
              className="h-12 rounded-xl bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary/30"
            />
            <Select value={sect} onValueChange={(v) => setSect(v ?? '')}>
              <SelectTrigger className="h-12 rounded-xl bg-muted/50 border-0">
                <SelectValue placeholder="Jain Sect (optional)" />
              </SelectTrigger>
              <SelectContent>
                {JAIN_SECTS.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </section>

        {/* Location */}
        <section className="space-y-4 animate-fade-in stagger-3 opacity-0">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-sm font-medium text-foreground">Location</h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                * Required: Auto-detect, manual coordinates, or Google Maps URL
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={detectLocation}
              disabled={detectingLocation}
              className="rounded-lg h-8 text-xs"
            >
              {detectingLocation ? (
                <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
              ) : (
                <Navigation className="mr-1.5 h-3 w-3" />
              )}
              {detectingLocation ? 'Detecting…' : 'Auto-detect'}
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              placeholder="City *"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
              className="h-12 rounded-xl bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary/30"
            />
            <Select value={state} onValueChange={(v) => setState(v ?? '')}>
              <SelectTrigger className="h-12 rounded-xl bg-muted/50 border-0">
                <SelectValue placeholder="State *" />
              </SelectTrigger>
              <SelectContent>
                {INDIAN_STATES.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              placeholder="Latitude"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              type="number"
              step="any"
              className="h-12 rounded-xl bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary/30"
            />
            <Input
              placeholder="Longitude"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              type="number"
              step="any"
              className="h-12 rounded-xl bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary/30"
            />
          </div>

          <Input
            placeholder="Google Maps URL (optional)"
            value={googleMapsUrl}
            onChange={(e) => {
              const url = e.target.value;
              setGoogleMapsUrl(url);
              // Attempt to extract lat/lng if pasted a maps URL
              const match = url.match(/@(-?\\d+\\.\\d+),(-?\\d+\\.\\d+)/);
              if (match) {
                setLatitude(match[1]);
                setLongitude(match[2]);
              }
            }}
            type="url"
            className="h-12 rounded-xl bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary/30"
          />

          {latitude && longitude && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <a
                href={`https://www.google.com/maps?q=${latitude},${longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors"
              >
                View on Google Maps →
              </a>
            </div>
          )}
        </section>

        {/* Visit Details */}
        <section className="space-y-4 animate-fade-in stagger-4 opacity-0">
          <h2 className="text-sm font-medium text-foreground">Visit Details</h2>

          <Input
            type="date"
            value={visitDate}
            onChange={(e) => setVisitDate(e.target.value)}
            required
            className="h-12 rounded-xl bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary/30"
          />

          <Select value={status} onValueChange={(v) => setStatus((v ?? 'active') as TempleStatus)}>
            <SelectTrigger className="h-12 rounded-xl bg-muted/50 border-0">
              <SelectValue placeholder="Temple Status" />
            </SelectTrigger>
            <SelectContent>
              {TEMPLE_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Textarea
            placeholder="Notes about your visit… (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="rounded-xl bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary/30 resize-none"
          />
        </section>

        {/* Tags */}
        <section className="space-y-3 animate-fade-in stagger-5 opacity-0">
          <h2 className="text-sm font-medium text-foreground">Tags (optional)</h2>

          <div className="flex gap-2">
            <Input
              placeholder="Add a tag…"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addTag(tagsInput);
                }
              }}
              className="h-10 rounded-xl bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary/30"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addTag(tagsInput)}
              className="rounded-lg h-10"
            >
              Add
            </Button>
          </div>

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="gap-1 cursor-pointer hover:bg-destructive/10 transition-colors"
                  onClick={() => removeTag(tag)}
                >
                  {tag}
                  <span className="text-muted-foreground">×</span>
                </Badge>
              ))}
            </div>
          )}
        </section>

        {/* Submit */}
        <div className="pt-4 animate-fade-in stagger-6 opacity-0">
          <Button
            type="submit"
            disabled={loading || !name || !deityName || !city || !state || (!(latitude && longitude) && !googleMapsUrl)}
            className="w-full h-12 rounded-xl text-base font-medium shadow-lg shadow-primary/20"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Saving…
              </>
            ) : (
              'Save Temple Visit'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
