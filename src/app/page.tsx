'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, SlidersHorizontal, X, Landmark } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { TempleCard } from '@/components/temple/TempleCard';
import type { TempleWithMedia } from '@/lib/types';

interface FiltersData {
  states: string[];
  sects: string[];
  years: number[];
}

export default function GalleryPage() {
  const [temples, setTemples] = useState<TempleWithMedia[]>([]);
  const [filters, setFilters] = useState<FiltersData>({ states: [], sects: [], years: [] });
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Search & filter state
  const [query, setQuery] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [sectFilter, setSectFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');

  const fetchTemples = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set('query', query);
      if (stateFilter) params.set('state', stateFilter);
      if (sectFilter) params.set('sect', sectFilter);
      if (yearFilter) params.set('year', yearFilter);

      const res = await fetch(`/api/temples?${params.toString()}`);
      const data = await res.json();
      setTemples(data.temples);
      setFilters(data.filters);
    } catch (error) {
      console.error('Failed to fetch temples:', error);
    } finally {
      setLoading(false);
    }
  }, [query, stateFilter, sectFilter, yearFilter]);

  useEffect(() => {
    const timer = setTimeout(fetchTemples, 300);
    return () => clearTimeout(timer);
  }, [fetchTemples]);

  const hasActiveFilters = stateFilter || sectFilter || yearFilter;

  const clearFilters = () => {
    setStateFilter('');
    setSectFilter('');
    setYearFilter('');
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
      {/* Page header */}
      <div className="mb-6 animate-fade-in">
        <h1 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight">
          My Temples
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {temples.length > 0
            ? `${temples.length} temple${temples.length !== 1 ? 's' : ''} visited`
            : 'Start your spiritual journey'}
        </p>
      </div>

      {/* Search & Filters */}
      <div className="mb-6 space-y-3 animate-fade-in stagger-1 opacity-0">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search temples, deities, cities…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 h-11 rounded-xl bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary/30"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button
            variant={showFilters ? 'default' : 'outline'}
            size="icon"
            className="h-11 w-11 rounded-xl shrink-0"
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </div>

        {/* Filter dropdowns */}
        {showFilters && (
          <div className="flex flex-wrap gap-2 animate-fade-in">
            <Select value={stateFilter} onValueChange={(v) => setStateFilter(v ?? '')}>
              <SelectTrigger className="w-[140px] h-9 rounded-lg text-sm">
                <SelectValue placeholder="State" />
              </SelectTrigger>
              <SelectContent>
                {filters.states.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sectFilter} onValueChange={(v) => setSectFilter(v ?? '')}>
              <SelectTrigger className="w-[140px] h-9 rounded-lg text-sm">
                <SelectValue placeholder="Sect" />
              </SelectTrigger>
              <SelectContent>
                {filters.sects.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={yearFilter} onValueChange={(v) => setYearFilter(v ?? '')}>
              <SelectTrigger className="w-[120px] h-9 rounded-lg text-sm">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {filters.years.map((y) => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9 text-xs">
                Clear filters
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl overflow-hidden border border-border">
              <Skeleton className="aspect-[4/3]" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : temples.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-muted mb-6">
            <Landmark className="h-10 w-10 text-muted-foreground/50" />
          </div>
          <h2 className="text-lg font-heading font-semibold">No temples yet</h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm">
            {query || hasActiveFilters
              ? 'No temples match your search. Try adjusting your filters.'
              : 'Start recording your temple visits by tapping the + button below.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {temples.map((temple, index) => (
            <TempleCard key={temple.id} temple={temple} index={index} />
          ))}
        </div>
      )}
    </div>
  );
}
