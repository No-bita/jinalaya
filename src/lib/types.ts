// Core domain types for Jinalaya

export interface Temple {
  id: string;
  name: string;
  deity_name: string;
  sect: string | null;
  city: string;
  state: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  google_maps_url: string | null;
  visit_date: string;
  notes: string | null;
  status: TempleStatus;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface Media {
  id: string;
  temple_id: string;
  media_type: 'image' | 'video';
  storage_key: string;
  thumbnail_key: string | null;
  original_filename: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  width: number | null;
  height: number | null;
  exif_data: Record<string, unknown> | null;
  uploaded_at: string;
}

export type TempleStatus = 'active' | 'under_renovation' | 'closed' | 'special_pilgrimage';

export interface TempleWithMedia extends Temple {
  media: Media[];
  cover_image: Media | null;
}

export interface CreateTempleInput {
  name: string;
  deity_name: string;
  sect?: string;
  city: string;
  state: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  google_maps_url?: string;
  visit_date: string;
  notes?: string;
  status?: TempleStatus;
  tags?: string[];
}

export interface UpdateTempleInput extends Partial<CreateTempleInput> {
  id: string;
}

export interface TempleSearchParams {
  query?: string;
  state?: string;
  sect?: string;
  year?: number;
  page?: number;
  limit?: number;
}

export interface TempleStats {
  total_temples: number;
  states_covered: string[];
  unique_deities: string[];
  total_images: number;
  total_videos: number;
  sects_breakdown: Record<string, number>;
  yearly_breakdown: Record<string, number>;
}

export interface UploadedMedia {
  id: string;
  media_type: 'image' | 'video';
  storage_key: string;
  thumbnail_key: string | null;
  original_filename: string;
  mime_type: string;
  size_bytes: number;
  width: number | null;
  height: number | null;
  exif_data: Record<string, unknown> | null;
}
