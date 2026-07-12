import { v4 as uuidv4 } from 'uuid';
import { getDb } from './index';
import type { TempleRepository, MediaRepository } from './repository';
import type {
  Temple,
  TempleWithMedia,
  CreateTempleInput,
  UpdateTempleInput,
  TempleSearchParams,
  TempleStats,
  Media,
} from '@/lib/types';
import type { Row } from '@libsql/client';

// ─── Helpers ───────────────────────────────────────────────

function parseTags(tags: string | null): string[] {
  if (!tags) return [];
  try {
    return JSON.parse(tags);
  } catch {
    return [];
  }
}

function parseExif(exif: string | null): Record<string, unknown> | null {
  if (!exif) return null;
  try {
    return JSON.parse(exif);
  } catch {
    return null;
  }
}

function rowToTemple(row: Row): Temple {
  return {
    id: row.id as string,
    name: row.name as string,
    deity_name: row.deity_name as string,
    sect: (row.sect as string) || null,
    city: row.city as string,
    state: row.state as string,
    country: row.country as string,
    latitude: (row.latitude as number) || null,
    longitude: (row.longitude as number) || null,
    google_maps_url: (row.google_maps_url as string) || null,
    visit_date: row.visit_date as string,
    notes: (row.notes as string) || null,
    status: row.status as Temple['status'],
    tags: parseTags((row.tags as string) || null),
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

function rowToMedia(row: Row): Media {
  return {
    id: row.id as string,
    temple_id: row.temple_id as string,
    media_type: row.media_type as Media['media_type'],
    storage_key: row.storage_key as string,
    thumbnail_key: (row.thumbnail_key as string) || null,
    original_filename: (row.original_filename as string) || null,
    mime_type: (row.mime_type as string) || null,
    size_bytes: (row.size_bytes as number) || null,
    width: (row.width as number) || null,
    height: (row.height as number) || null,
    exif_data: parseExif((row.exif_data as string) || null),
    uploaded_at: row.uploaded_at as string,
  };
}

// ─── SQLite Temple Repository ──────────────────────────────

export class SQLiteTempleRepository implements TempleRepository {
  async create(input: CreateTempleInput): Promise<Temple> {
    const db = await getDb();
    const id = uuidv4();
    const now = new Date().toISOString();

    await db.execute({
      sql: `
        INSERT INTO temples (id, name, deity_name, sect, city, state, country, latitude, longitude, google_maps_url, visit_date, notes, status, tags, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        id,
        input.name,
        input.deity_name,
        input.sect || null,
        input.city,
        input.state,
        input.country || 'India',
        input.latitude || null,
        input.longitude || null,
        input.google_maps_url || null,
        input.visit_date,
        input.notes || null,
        input.status || 'active',
        input.tags ? JSON.stringify(input.tags) : null,
        now,
        now,
      ],
    });

    return (await this.getById(id))! as Temple;
  }

  async getById(id: string): Promise<TempleWithMedia | null> {
    const db = await getDb();
    const result = await db.execute({
      sql: 'SELECT * FROM temples WHERE id = ?',
      args: [id],
    });
    
    if (result.rows.length === 0) return null;

    const temple = rowToTemple(result.rows[0]);
    
    const mediaResult = await db.execute({
      sql: 'SELECT * FROM media WHERE temple_id = ? ORDER BY uploaded_at ASC',
      args: [id],
    });
    
    const media = mediaResult.rows.map(rowToMedia);
    const cover_image = media.find(m => m.media_type === 'image') || null;

    return { ...temple, media, cover_image };
  }

  async getAll(params?: TempleSearchParams): Promise<TempleWithMedia[]> {
    const db = await getDb();
    const conditions: string[] = [];
    const values: unknown[] = [];

    if (params?.query) {
      conditions.push('(t.name LIKE ? OR t.deity_name LIKE ? OR t.city LIKE ? OR t.state LIKE ?)');
      const q = `%${params.query}%`;
      values.push(q, q, q, q);
    }

    if (params?.state) {
      conditions.push('t.state = ?');
      values.push(params.state);
    }

    if (params?.sect) {
      conditions.push('t.sect = ?');
      values.push(params.sect);
    }

    if (params?.year) {
      conditions.push("strftime('%Y', t.visit_date) = ?");
      values.push(String(params.year));
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const limit = params?.limit || 100;
    const offset = ((params?.page || 1) - 1) * limit;

    const result = await db.execute({
      sql: `
        SELECT t.* FROM temples t
        ${where}
        ORDER BY t.visit_date DESC, t.created_at DESC
        LIMIT ? OFFSET ?
      `,
      args: [...values, limit, offset] as any[],
    });

    const templesWithMedia: TempleWithMedia[] = [];

    for (const row of result.rows) {
      const temple = rowToTemple(row);
      const mediaResult = await db.execute({
        sql: 'SELECT * FROM media WHERE temple_id = ? ORDER BY uploaded_at ASC',
        args: [temple.id],
      });
      const media = mediaResult.rows.map(rowToMedia);
      const cover_image = media.find(m => m.media_type === 'image') || null;
      templesWithMedia.push({ ...temple, media, cover_image });
    }

    return templesWithMedia;
  }

  async update(input: UpdateTempleInput): Promise<Temple> {
    const db = await getDb();
    const existing = await this.getById(input.id);
    if (!existing) throw new Error(`Temple ${input.id} not found`);

    const fields: string[] = [];
    const values: unknown[] = [];

    const updatable = ['name', 'deity_name', 'sect', 'city', 'state', 'country', 'latitude', 'longitude', 'google_maps_url', 'visit_date', 'notes', 'status'] as const;

    for (const field of updatable) {
      if (input[field] !== undefined) {
        fields.push(`${field} = ?`);
        values.push(input[field]);
      }
    }

    if (input.tags !== undefined) {
      fields.push('tags = ?');
      values.push(JSON.stringify(input.tags));
    }

    if (fields.length === 0) return existing;

    fields.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(input.id);

    await db.execute({
      sql: `UPDATE temples SET ${fields.join(', ')} WHERE id = ?`,
      args: values as any[],
    });

    return (await this.getById(input.id))! as Temple;
  }

  async delete(id: string): Promise<void> {
    const db = await getDb();
    await db.execute({
      sql: 'DELETE FROM temples WHERE id = ?',
      args: [id],
    });
  }

  async getStats(): Promise<TempleStats> {
    const db = await getDb();

    const [totalTemplesRes, statesRes, deitiesRes, totalImagesRes, totalVideosRes, sectRowsRes, yearRowsRes] = await Promise.all([
      db.execute('SELECT COUNT(*) as count FROM temples'),
      db.execute('SELECT DISTINCT state FROM temples ORDER BY state'),
      db.execute('SELECT DISTINCT deity_name FROM temples ORDER BY deity_name'),
      db.execute("SELECT COUNT(*) as count FROM media WHERE media_type = 'image'"),
      db.execute("SELECT COUNT(*) as count FROM media WHERE media_type = 'video'"),
      db.execute("SELECT COALESCE(sect, 'Unknown') as sect, COUNT(*) as count FROM temples GROUP BY sect ORDER BY count DESC"),
      db.execute("SELECT strftime('%Y', visit_date) as year, COUNT(*) as count FROM temples GROUP BY year ORDER BY year DESC")
    ]);

    const sects_breakdown: Record<string, number> = {};
    for (const row of sectRowsRes.rows) {
      sects_breakdown[row.sect as string] = row.count as number;
    }

    const yearly_breakdown: Record<string, number> = {};
    for (const row of yearRowsRes.rows) {
      yearly_breakdown[row.year as string] = row.count as number;
    }

    return {
      total_temples: totalTemplesRes.rows[0]?.count as number || 0,
      states_covered: statesRes.rows.map(r => r.state as string).filter(Boolean),
      unique_deities: deitiesRes.rows.map(r => r.deity_name as string).filter(Boolean),
      total_images: totalImagesRes.rows[0]?.count as number || 0,
      total_videos: totalVideosRes.rows[0]?.count as number || 0,
      sects_breakdown,
      yearly_breakdown,
    };
  }

  async getAllStates(): Promise<string[]> {
    const db = await getDb();
    const result = await db.execute('SELECT DISTINCT state FROM temples ORDER BY state');
    return result.rows.map(r => r.state as string).filter(Boolean);
  }

  async getAllSects(): Promise<string[]> {
    const db = await getDb();
    const result = await db.execute("SELECT DISTINCT sect FROM temples WHERE sect IS NOT NULL AND sect != '' ORDER BY sect");
    return result.rows.map(r => r.sect as string).filter(Boolean);
  }

  async getAllYears(): Promise<number[]> {
    const db = await getDb();
    const result = await db.execute("SELECT DISTINCT CAST(strftime('%Y', visit_date) AS INTEGER) as year FROM temples ORDER BY year DESC");
    return result.rows.map(r => r.year as number).filter(Boolean);
  }
}

// ─── SQLite Media Repository ───────────────────────────────

export class SQLiteMediaRepository implements MediaRepository {
  async create(media: {
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
  }): Promise<Media> {
    const db = await getDb();
    const id = uuidv4();
    const now = new Date().toISOString();

    await db.execute({
      sql: `
        INSERT INTO media (id, temple_id, media_type, storage_key, thumbnail_key, original_filename, mime_type, size_bytes, width, height, exif_data, uploaded_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        id,
        media.temple_id,
        media.media_type,
        media.storage_key,
        media.thumbnail_key || null,
        media.original_filename || null,
        media.mime_type || null,
        media.size_bytes || null,
        media.width || null,
        media.height || null,
        media.exif_data ? JSON.stringify(media.exif_data) : null,
        now,
      ],
    });

    const result = await db.execute({
      sql: 'SELECT * FROM media WHERE id = ?',
      args: [id]
    });
    return rowToMedia(result.rows[0]);
  }

  async getByTempleId(templeId: string): Promise<Media[]> {
    const db = await getDb();
    const result = await db.execute({
      sql: 'SELECT * FROM media WHERE temple_id = ? ORDER BY uploaded_at ASC',
      args: [templeId]
    });
    return result.rows.map(rowToMedia);
  }

  async delete(id: string): Promise<Media | null> {
    const db = await getDb();
    const result = await db.execute({
      sql: 'SELECT * FROM media WHERE id = ?',
      args: [id]
    });
    if (result.rows.length === 0) return null;
    
    await db.execute({
      sql: 'DELETE FROM media WHERE id = ?',
      args: [id]
    });
    return rowToMedia(result.rows[0]);
  }

  async deleteByTempleId(templeId: string): Promise<Media[]> {
    const db = await getDb();
    const result = await db.execute({
      sql: 'SELECT * FROM media WHERE temple_id = ?',
      args: [templeId]
    });
    
    await db.execute({
      sql: 'DELETE FROM media WHERE temple_id = ?',
      args: [templeId]
    });
    return result.rows.map(rowToMedia);
  }
}
