import { createClient, type Client } from '@libsql/client';
import path from 'path';
import fs from 'fs';
import { schemaSql } from './schema';

let db: Client | null = null;

// Allow TURSO_DATABASE_URL to be a remote URL or a local file
const DB_URL = process.env.TURSO_DATABASE_URL || 'file:./data/jinalaya.db';
const AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN;

export async function getDb(): Promise<Client> {
  if (db) return db;

  // If using local file, ensure directory exists
  if (DB_URL.startsWith('file:')) {
    const dbPath = DB_URL.replace('file:', '');
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
  }

  db = createClient({
    url: DB_URL,
    authToken: AUTH_TOKEN,
  });

  await initializeSchema(db);

  return db;
}

async function initializeSchema(client: Client): Promise<void> {
  const statements = schemaSql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  // We run each schema statement
  // For Turso, we use executeMultiple or individual execute
  try {
    for (const stmt of statements) {
      await client.execute(stmt);
    }
  } catch (error) {
    console.error('Failed to initialize schema:', error);
  }
}

