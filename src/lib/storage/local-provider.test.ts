import test from 'node:test';
import assert from 'node:assert';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import type { LocalStorageProvider } from './local-provider';

test('LocalStorageProvider', async (t) => {
  let provider: LocalStorageProvider;
  const tempDir = path.join(os.tmpdir(), 'jinalaya-test-uploads');

  // Set the environment variable for UPLOAD_DIR before importing/instantiating
  process.env.UPLOAD_DIR = tempDir;

  await t.test('setup', async () => {
    const module = await import('./local-provider');
    provider = new module.LocalStorageProvider();
    await fs.mkdir(tempDir, { recursive: true });
  });

  await t.test('should upload a file', async () => {
    const key = 'test-image.jpg';
    const buffer = Buffer.from('fake-image-content');
    const resultKey = await provider.upload(key, buffer, 'image/jpeg');

    assert.strictEqual(resultKey, key);

    // Verify file exists on disk
    const fileContent = await fs.readFile(path.join(tempDir, key));
    assert.strictEqual(fileContent.toString(), 'fake-image-content');
  });

  await t.test('should check if file exists', async () => {
    const exists = await provider.exists('test-image.jpg');
    assert.strictEqual(exists, true);

    const notExists = await provider.exists('non-existent.jpg');
    assert.strictEqual(notExists, false);
  });

  await t.test('should return correct public URL', () => {
    const url = provider.getUrl('test-image.jpg');
    assert.strictEqual(url, '/uploads/test-image.jpg');
  });

  await t.test('should delete a file', async () => {
    await provider.delete('test-image.jpg');
    const exists = await provider.exists('test-image.jpg');
    assert.strictEqual(exists, false);
  });

  await t.test('cleanup', async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });
});
