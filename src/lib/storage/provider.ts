// Abstract storage provider interface
// Implement this interface to add new storage backends (e.g., Cloudflare R2, S3)

export interface StorageProvider {
  /**
   * Upload a file to storage.
   * @returns The storage key used to retrieve the file later.
   */
  upload(key: string, buffer: Buffer, contentType: string): Promise<string>;

  /**
   * Get a publicly accessible URL for a stored file.
   */
  getUrl(key: string): string;

  /**
   * Delete a file from storage.
   */
  delete(key: string): Promise<void>;

  /**
   * Check if a file exists in storage.
   */
  exists(key: string): Promise<boolean>;
}
