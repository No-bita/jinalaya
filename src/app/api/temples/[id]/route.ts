import { NextRequest, NextResponse } from 'next/server';
import { SQLiteTempleRepository } from '@/lib/db/sqlite-repository';
import { SQLiteMediaRepository } from '@/lib/db/sqlite-repository';
import { getStorage } from '@/lib/storage';
import type { UpdateTempleInput } from '@/lib/types';

const templeRepo = new SQLiteTempleRepository();
const mediaRepo = new SQLiteMediaRepository();

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const temple = await templeRepo.getById(id);

    if (!temple) {
      return NextResponse.json({ error: 'Temple not found' }, { status: 404 });
    }

    return NextResponse.json(temple);
  } catch (error) {
    console.error('Error fetching temple:', error);
    return NextResponse.json({ error: 'Failed to fetch temple' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const input: UpdateTempleInput = { ...body, id };
    const temple = await templeRepo.update(input);

    return NextResponse.json(temple);
  } catch (error) {
    console.error('Error updating temple:', error);
    return NextResponse.json({ error: 'Failed to update temple' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const temple = await templeRepo.getById(id);

    if (!temple) {
      return NextResponse.json({ error: 'Temple not found' }, { status: 404 });
    }

    // Delete all associated media files from storage
    const storage = getStorage();
    const mediaFiles = await mediaRepo.deleteByTempleId(id);

    for (const media of mediaFiles) {
      await storage.delete(media.storage_key);
      if (media.thumbnail_key) {
        await storage.delete(media.thumbnail_key);
      }
    }

    // Delete the temple record
    await templeRepo.delete(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting temple:', error);
    return NextResponse.json({ error: 'Failed to delete temple' }, { status: 500 });
  }
}
