import { cn } from '@/lib/cn'

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-lg bg-neutral-100', className)} />
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-2xl border border-neutral-200/70 bg-white p-5 shadow-soft">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="size-9 rounded-xl" />
      </div>
      <Skeleton className="mt-4 h-7 w-20" />
    </div>
  )
}

export function StatCardSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-2xl border border-neutral-200/70 bg-white p-6 shadow-soft', className)}>
      <Skeleton className="h-4 w-32" />
      <Skeleton className="mt-2 h-3 w-48" />
      <Skeleton className="mt-6 h-40 w-full" />
    </div>
  )
}
