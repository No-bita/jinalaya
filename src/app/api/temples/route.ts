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

function extractCoordsFromUrl(url?: string): { lat: number; lng: number } | null {
  if (!url) return null;
  const atMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (atMatch) {
    return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };
  }
  const qMatch = url.match(/[?&](?:q|query)=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (qMatch) {
    return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) };
  }
  return null;
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

    let latitude = body.latitude;
    let longitude = body.longitude;

    if ((!latitude || !longitude) && body.google_maps_url) {
      const extracted = extractCoordsFromUrl(body.google_maps_url);
      if (extracted) {
        latitude = extracted.lat;
        longitude = extracted.lng;
      }
    }

    // Auto-geocode city & state if coordinates are still missing
    if (!latitude || !longitude) {
      try {
        const query = `${body.city.trim()}, ${body.state.trim()}, ${body.country || 'India'}`;
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`, {
          headers: { 'User-Agent': 'JinalayaApp/1.0' }
        });
        const data = await res.json();
        if (data && data.length > 0) {
          latitude = parseFloat(data[0].lat);
          longitude = parseFloat(data[0].lon);
        }
      } catch (err) {
        console.error('Fallback geocoding failed:', err);
      }
    }

    const temple = await templeRepo.create({
      ...body,
      latitude,
      longitude,
    });

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
