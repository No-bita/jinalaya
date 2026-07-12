import fs from 'fs/promises';
import path from 'path';
import type { StorageProvider } from './provider';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './public/uploads';

export class LocalStorageProvider implements StorageProvider {
  private baseDir: string;

  constructor() {
    this.baseDir = UPLOAD_DIR;
  }

  async upload(key: string, buffer: Buffer, _contentType: string): Promise<string> {
    const filePath = path.join(this.baseDir, key);
    const dir = path.dirname(filePath);

    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filePath, buffer);

    return key;
  }

  getUrl(key: string): string {
    // Serve from Next.js public directory
    return `/uploads/${key}`;
  }

  async delete(key: string): Promise<void> {
    const filePath = path.join(this.baseDir, key);
    try {
      await fs.unlink(filePath);
    } catch {
      // File might not exist, that's ok
    }
  }

  async exists(key: string): Promise<boolean> {
    const filePath = path.join(this.baseDir, key);
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}
