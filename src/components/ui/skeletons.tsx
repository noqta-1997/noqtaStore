import { Container } from "@/components/ui/container";
import { cn } from "@/lib/utils";

/** Neutral placeholder block — the only animated surface in the system. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("animate-pulse rounded-md bg-surface-low", className)}
    />
  );
}

function CardSkeleton() {
  return (
    <div className="flex flex-col rounded-xl border border-line-divider bg-card p-3">
      {/* Mirrors the card: the jacket sits on its own tinted plate. */}
      <div className="rounded-lg bg-surface-low p-3 sm:p-4">
        <Skeleton className="aspect-[2/3] w-full" />
      </div>
      <div className="space-y-2 pt-3">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex items-center justify-between gap-2 pt-2">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="size-9 rounded-full" />
        </div>
      </div>
    </div>
  );
}

/** Listing pages: header band, toolbar and a grid of cards. */
export function CatalogueSkeleton({ count = 8 }: { count?: number }) {
  return (
    <>
      <div className="border-b border-line-divider bg-surface-low">
        <Container className="space-y-3 py-8 lg:py-10">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </Container>
      </div>

      <Container className="grid gap-6 py-8 lg:grid-cols-12 lg:gap-8 lg:py-12">
        <div className="hidden lg:col-span-3 lg:block">
          <Skeleton className="h-[28rem] w-full rounded-xl" />
        </div>

        <div className="space-y-6 lg:col-span-9">
          <Skeleton className="h-14 w-full rounded-xl" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: count }, (_, index) => (
              <CardSkeleton key={index} />
            ))}
          </div>
        </div>
      </Container>
    </>
  );
}

/** Account pages render inside the account shell, so only the body is faked. */
export function PanelListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-4">
      <Skeleton className="h-7 w-48" />
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="space-y-3 rounded-xl border border-line bg-card p-5">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  );
}

/** Admin pages: stat tiles above a table. */
export function AdminSkeleton() {
  return (
    <>
      <div className="space-y-2 border-b border-line-divider pb-5">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-32 border border-line" />
        ))}
      </div>

      <div className="rounded-xl border border-line bg-card">
        <Skeleton className="h-12 w-full border-b border-line" />
        <div className="divide-y divide-line-divider">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="flex items-center gap-4 p-4">
              <Skeleton className="size-9 shrink-0" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="hidden h-4 w-24 sm:block" />
              <Skeleton className="hidden h-4 w-20 md:block" />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
