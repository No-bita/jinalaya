import { NextResponse } from 'next/server';
import { SQLiteTempleRepository } from '@/lib/db/sqlite-repository';

const templeRepo = new SQLiteTempleRepository();

export async function GET() {
  try {
    const stats = await templeRepo.getStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 });
  }
}
