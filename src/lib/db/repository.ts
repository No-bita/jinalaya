import type {
  Temple,
  TempleWithMedia,
  CreateTempleInput,
  UpdateTempleInput,
  TempleSearchParams,
  TempleStats,
  Media,
} from '@/lib/types';

// Repository interfaces — swap implementations to change databases

export interface TempleRepository {
  create(input: CreateTempleInput): Promise<Temple>;
  getById(id: string): Promise<TempleWithMedia | null>;
  getAll(params?: TempleSearchParams): Promise<TempleWithMedia[]>;
  update(input: UpdateTempleInput): Promise<Temple>;
  delete(id: string): Promise<void>;
  getStats(): Promise<TempleStats>;
  getAllStates(): Promise<string[]>;
  getAllSects(): Promise<string[]>;
  getAllYears(): Promise<number[]>;
}

export interface MediaRepository {
  create(media: {
    temple_id: string;
    media_type: 'image' | 'video';
    storage_key: string;
    thumbnail_key?: string;
    original_filename?: string;
    mime_type?: string;
    size_bytes?: number;
    width?: number;
    height?: number;
    exif_data?: Record<string, unknown>;
  }): Promise<Media>;
  getByTempleId(templeId: string): Promise<Media[]>;
  delete(id: string): Promise<Media | null>;
  deleteByTempleId(templeId: string): Promise<Media[]>;
}
