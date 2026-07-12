import { NextRequest, NextResponse } from 'next/server';
import { SQLiteTempleRepository } from '@/lib/db/sqlite-repository';
import type { CreateTempleInput, TempleSearchParams } from '@/lib/types';

const templeRepo = new SQLiteTempleRepository();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const params: TempleSearchParams = {
      query: searchParams.get('query') || undefined,
      state: searchParams.get('state') || undefined,
      sect: searchParams.get('sect') || undefined,
      year: searchParams.get('year') ? Number(searchParams.get('year')) : undefined,
      page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : 100,
    };

    const [temples, states, sects, years] = await Promise.all([
      templeRepo.getAll(params),
      templeRepo.getAllStates(),
      templeRepo.getAllSects(),
      templeRepo.getAllYears(),
    ]);

    return NextResponse.json({
      temples,
      filters: { states, sects, years },
    });
  } catch (error) {
    console.error('Error fetching temples:', error);
    return NextResponse.json({ error: 'Failed to fetch temples' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as CreateTempleInput;

    // Validate required fields
    if (!body.name || !body.deity_name || !body.city || !body.state || !body.visit_date) {
      return NextResponse.json(
        { error: 'Missing required fields: name, deity_name, city, state, visit_date' },
        { status: 400 }
      );
    }

    const temple = await templeRepo.create(body);

    return NextResponse.json(temple, { status: 201 });
  } catch (error) {
    console.error('Error creating temple:', error);
    return NextResponse.json({ error: 'Failed to create temple' }, { status: 500 });
  }
}
