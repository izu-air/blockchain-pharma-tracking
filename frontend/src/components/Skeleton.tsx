/**
 * Lightweight skeleton placeholders.  No animation libraries — uses Tailwind's
 * `animate-pulse` + slate background to keep bundle size minimal.
 */
export function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded bg-slate-700/50 ${className}`}
    />
  );
}

export function MetricSkeleton() {
  return (
    <div className="panel" aria-busy="true" aria-live="polite">
      <SkeletonBlock className="h-3 w-24" />
      <SkeletonBlock className="mt-3 h-8 w-16" />
    </div>
  );
}

export function MetricGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-busy="true">
      {Array.from({ length: count }).map((_, i) => (
        <MetricSkeleton key={i} />
      ))}
    </section>
  );
}
