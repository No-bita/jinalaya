'use client';

import { useState, useEffect } from 'react';
import {
  Landmark,
  MapPin,
  Image as ImageIcon,
  Film,
  Users,
  TrendingUp,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import type { TempleStats } from '@/lib/types';

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sublabel?: string;
  index: number;
}

function StatCard({ icon: Icon, label, value, sublabel, index }: StatCardProps) {
  return (
    <div
      className={`animate-fade-in opacity-0 stagger-${Math.min(index + 1, 6)} rounded-2xl bg-card border border-border p-5 transition-all hover:shadow-md hover:shadow-primary/5`}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
      </div>
      <p className="text-3xl font-heading font-bold tracking-tight">{value}</p>
      {sublabel && (
        <p className="text-xs text-muted-foreground mt-1">{sublabel}</p>
      )}
    </div>
  );
}

export default function StatsPage() {
  const [stats, setStats] = useState<TempleStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/temples/stats')
      .then((res) => res.json())
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6">
        <Skeleton className="h-8 w-40 mb-8" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="mb-8 animate-fade-in">
        <h1 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight">
          Statistics
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your pilgrimage journey at a glance
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-10">
        <StatCard
          icon={Landmark}
          label="Temples Visited"
          value={stats.total_temples}
          index={0}
        />
        <StatCard
          icon={MapPin}
          label="States Covered"
          value={stats.states_covered.length}
          sublabel={`out of 28 states`}
          index={1}
        />
        <StatCard
          icon={Users}
          label="Unique Deities"
          value={stats.unique_deities.length}
          index={2}
        />
        <StatCard
          icon={ImageIcon}
          label="Photos"
          value={stats.total_images}
          index={3}
        />
        <StatCard
          icon={Film}
          label="Videos"
          value={stats.total_videos}
          index={4}
        />
        <StatCard
          icon={TrendingUp}
          label="Years Active"
          value={Object.keys(stats.yearly_breakdown).length}
          index={5}
        />
      </div>

      {/* Details sections */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* States */}
        {stats.states_covered.length > 0 && (
          <div className="rounded-2xl bg-card border border-border p-5 animate-fade-in">
            <h3 className="text-sm font-medium mb-4">States Covered</h3>
            <div className="flex flex-wrap gap-2">
              {stats.states_covered.map((state) => (
                <Badge key={state} variant="secondary" className="font-normal">
                  {state}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Sects */}
        {Object.keys(stats.sects_breakdown).length > 0 && (
          <div className="rounded-2xl bg-card border border-border p-5 animate-fade-in">
            <h3 className="text-sm font-medium mb-4">Sect Breakdown</h3>
            <div className="space-y-3">
              {Object.entries(stats.sects_breakdown).map(([sect, count]) => {
                const percentage = stats.total_temples > 0
                  ? Math.round((count / stats.total_temples) * 100)
                  : 0;
                return (
                  <div key={sect}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">{sect}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary/60 transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Yearly */}
        {Object.keys(stats.yearly_breakdown).length > 0 && (
          <div className="rounded-2xl bg-card border border-border p-5 animate-fade-in">
            <h3 className="text-sm font-medium mb-4">Temples per Year</h3>
            <div className="space-y-3">
              {Object.entries(stats.yearly_breakdown).map(([year, count]) => {
                const maxCount = Math.max(...Object.values(stats.yearly_breakdown));
                const percentage = maxCount > 0 ? Math.round((count / maxCount) * 100) : 0;
                return (
                  <div key={year}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">{year}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary/40 transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Deities */}
        {stats.unique_deities.length > 0 && (
          <div className="rounded-2xl bg-card border border-border p-5 animate-fade-in">
            <h3 className="text-sm font-medium mb-4">Deities Encountered</h3>
            <div className="flex flex-wrap gap-2">
              {stats.unique_deities.map((deity) => (
                <Badge key={deity} variant="outline" className="font-normal">
                  {deity}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Export */}
      <div className="mt-10 text-center animate-fade-in">
        <a
          href="/api/export"
          download
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          Export all data as JSON →
        </a>
      </div>
    </div>
  );
}
