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

    // Validate location requirement
    if (!(body.latitude && body.longitude) && !body.google_maps_url) {
      return NextResponse.json(
        { error: 'Please provide either exact coordinates or a Google Maps URL.' },
        { status: 400 }
      );
    }

    const temple = await templeRepo.create(body);

    return NextResponse.json(temple, { status: 201 });
  } catch (error: any) {
    console.error('Error creating temple:', error);
    
    // Handle SQLite unique constraint violations
    if (error?.message?.includes('UNIQUE constraint failed')) {
      return NextResponse.json(
        { error: 'You have already recorded a visit to this temple on this date.' },
        { status: 409 }
      );
    }
    
    return NextResponse.json({ error: 'Failed to create temple' }, { status: 500 });
  }
}
