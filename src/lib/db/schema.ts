export const schemaSql = `
-- Jinalaya Database Schema
-- SQLite-compatible, designed for easy migration to PostgreSQL

CREATE TABLE IF NOT EXISTS temples (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  deity_name TEXT NOT NULL,
  sect TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'India',
  latitude REAL,
  longitude REAL,
  google_maps_url TEXT,
  visit_date TEXT NOT NULL,
  notes TEXT,
  status TEXT DEFAULT 'active',
  tags TEXT, -- JSON array stored as text
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS media (
  id TEXT PRIMARY KEY,
  temple_id TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  storage_key TEXT NOT NULL,
  thumbnail_key TEXT,
  original_filename TEXT,
  mime_type TEXT,
  size_bytes INTEGER,
  width INTEGER,
  height INTEGER,
  exif_data TEXT, -- JSON stored as text
  uploaded_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (temple_id) REFERENCES temples(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_temples_visit_date ON temples(visit_date);
CREATE INDEX IF NOT EXISTS idx_temples_state ON temples(state);
CREATE INDEX IF NOT EXISTS idx_temples_sect ON temples(sect);
CREATE INDEX IF NOT EXISTS idx_temples_city ON temples(city);
CREATE INDEX IF NOT EXISTS idx_media_temple_id ON media(temple_id);
`;
