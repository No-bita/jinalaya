import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import { getStorage } from '@/lib/storage';
import { SQLiteMediaRepository } from '@/lib/db/sqlite-repository';

const mediaRepo = new SQLiteMediaRepository();

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
const THUMBNAIL_WIDTH = 400;
const THUMBNAIL_QUALITY = 80;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const templeId = formData.get('temple_id') as string;

    if (!templeId) {
      return NextResponse.json({ error: 'temple_id is required' }, { status: 400 });
    }

    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    const storage = getStorage();
    const uploadedMedia = [];

    for (const file of files) {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');

      if (!isImage && !isVideo) {
        continue; // Skip unsupported file types
      }

      // Size validation
      if (isImage && file.size > MAX_IMAGE_SIZE) {
        continue;
      }
      if (isVideo && file.size > MAX_VIDEO_SIZE) {
        continue;
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const fileId = uuidv4();
      const ext = file.name.split('.').pop() || (isImage ? 'jpg' : 'mp4');
      const storageKey = `${isImage ? 'images' : 'videos'}/${fileId}.${ext}`;

      // Upload original file
      await storage.upload(storageKey, buffer, file.type);

      let thumbnailKey: string | null = null;
      let width: number | null = null;
      let height: number | null = null;
      let exifData: Record<string, unknown> | null = null;

      // Process images: generate thumbnail, extract metadata
      if (isImage) {
        try {
          const image = sharp(buffer);
          const metadata = await image.metadata();
          width = metadata.width || null;
          height = metadata.height || null;

          // Generate thumbnail
          const thumbnailBuffer = await image
            .resize(THUMBNAIL_WIDTH, null, { withoutEnlargement: true })
            .webp({ quality: THUMBNAIL_QUALITY })
            .toBuffer();

          thumbnailKey = `thumbnails/${fileId}.webp`;
          await storage.upload(thumbnailKey, thumbnailBuffer, 'image/webp');

          // Extract EXIF data
          try {
            const exifr = await import('exifr');
            const exif = await exifr.parse(buffer);
            if (exif) {
              exifData = {
                make: exif.Make,
                model: exif.Model,
                dateTime: exif.DateTimeOriginal,
                gps: exif.latitude && exif.longitude ? {
                  latitude: exif.latitude,
                  longitude: exif.longitude,
                } : undefined,
                focalLength: exif.FocalLength,
                exposureTime: exif.ExposureTime,
                fNumber: exif.FNumber,
                iso: exif.ISO,
              };
            }
          } catch {
            // EXIF extraction is best-effort
          }
        } catch {
          // Image processing failed — store original without thumbnail
        }
      }

      // Save media record
      const media = await mediaRepo.create({
        temple_id: templeId,
        media_type: isImage ? 'image' : 'video',
        storage_key: storageKey,
        thumbnail_key: thumbnailKey || undefined,
        original_filename: file.name,
        mime_type: file.type,
        size_bytes: file.size,
        width: width || undefined,
        height: height || undefined,
        exif_data: exifData || undefined,
      });

      uploadedMedia.push(media);
    }

    return NextResponse.json({ media: uploadedMedia }, { status: 201 });
  } catch (error) {
    console.error('Error uploading files:', error);
    return NextResponse.json({ error: 'Failed to upload files' }, { status: 500 });
  }
}
