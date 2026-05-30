/**
 * Lightweight skeleton placeholders using the global `.skeleton` shimmer
 * defined in styles.css.  Avoid heavy animation libraries — keeps bundle
 * minimal.
 */
export function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`skeleton rounded ${className}`} />;
}

/** Alias kept for readability where the call-site doesn't care about variants. */
export const Skeleton = SkeletonBlock;

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

/** Single line of text shimmer (for loading lists, paragraphs). */
export function SkeletonText({
  lines = 3, className = ""
}: { lines?: number; className?: string }) {
  return (
    <div aria-hidden="true" className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBlock
          key={i}
          className={`h-3 ${i === lines - 1 ? "w-2/3" : "w-full"}`}
        />
      ))}
    </div>
  );
}
