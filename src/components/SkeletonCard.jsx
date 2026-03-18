export default function SkeletonCard() {
  return (
    <div className="rounded-2xl overflow-hidden bg-surface border border-border">
      <div className="aspect-[2/3] skeleton" />
    </div>
  )
}

export function SkeletonGrid({ count = 24 }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-3 sm:gap-4">
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}
