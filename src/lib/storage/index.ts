import type { StorageProvider } from './provider';
import { LocalStorageProvider } from './local-provider';
import { S3StorageProvider } from './s3-provider';

let storageInstance: StorageProvider | null = null;

/**
 * Get the configured storage provider.
 * Currently supports: 'local' (default), 's3' (AWS S3, Cloudflare R2, etc.)
 */
export function getStorage(): StorageProvider {
  if (storageInstance) return storageInstance;

  const provider = process.env.STORAGE_PROVIDER || 'local';

  switch (provider) {
    case 'local':
      storageInstance = new LocalStorageProvider();
      break;
    case 's3':
      storageInstance = new S3StorageProvider();
      break;
    default:
      throw new Error(`Unknown storage provider: ${provider}`);
  }

  return storageInstance;
}

export type { StorageProvider } from './provider';
