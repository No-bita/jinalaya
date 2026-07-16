import { NextResponse } from 'next/server';
import { SQLiteTempleRepository } from '@/lib/db/sqlite-repository';
import { getMediaUrl } from '@/lib/utils';

const templeRepo = new SQLiteTempleRepository();

export async function GET() {
  try {
    const temples = await templeRepo.getAll({ limit: 10000 });

    const exportData = {
      exported_at: new Date().toISOString(),
      total_temples: temples.length,
      temples: temples.map(t => ({
        ...t,
        media: t.media.map(m => ({
          ...m,
          // Don't include internal storage keys in export
          url: getMediaUrl(m.storage_key),
        })),
      })),
    };

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="jinalaya-export-${new Date().toISOString().split('T')[0]}.json"`,
      },
    });
  } catch (error) {
    console.error('Error exporting data:', error);
    return NextResponse.json({ error: 'Failed to export data' }, { status: 500 });
  }
}
