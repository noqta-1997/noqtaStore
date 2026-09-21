import { Container } from "@/components/ui/container";
import { cn } from "@/lib/utils";

/**
 * Neutral placeholder block — the only animated surface in the system.
 *
 * `raised` is for a block drawn on a low-surface ground — the page-header
 * band, a jacket's plate, the basket's meter — where the default tone is the
 * ground's own and the block would vanish into it.
 */
export function Skeleton({ raised = false, className }: { raised?: boolean; className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "animate-pulse rounded-md",
        raised ? "bg-surface-high" : "bg-surface-low",
        className,
      )}
    />
  );
}

function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col rounded-xl border border-line-divider bg-card p-3", className)}>
      {/* Mirrors the card: the jacket sits on its own tinted plate. */}
      <div className="rounded-lg bg-surface-low p-3 sm:p-4">
        <Skeleton raised className="aspect-[2/3] w-full" />
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

/** The band every inner page opens with: a crumb line, the title, a subtitle. */
function PageHeaderSkeleton() {
  return (
    <div className="border-b border-line-divider bg-surface-low">
      <Container className="space-y-4 py-8 lg:py-10">
        <Skeleton raised className="h-3 w-40" />
        <div className="space-y-2">
          <Skeleton raised className="h-9 w-64 max-w-full" />
          <Skeleton raised className="h-4 w-80 max-w-full" />
        </div>
      </Container>
    </div>
  );
}

/** Listing pages: header band, toolbar and a grid of cards. */
export function CatalogueSkeleton({ count = 8 }: { count?: number }) {
  return (
    <>
      <PageHeaderSkeleton />

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

/**
 * A detail page: the crumb band, the jacket on its plate beside the title
 * block and the buy box. The catalogue skeleton used to cover `books/[slug]`
 * too (its `loading.tsx` sat one level up, before the catalogue moved into
 * its own route group), so a single title loaded behind a grid of eight
 * cards — the wrong shape, briefly, on every jacket a reader opened.
 */
export function DetailSkeleton() {
  return (
    <>
      <div className="border-b border-line-divider bg-surface-low">
        <Container className="py-4">
          <Skeleton raised className="h-3 w-64 max-w-full" />
        </Container>
      </div>

      <Container className="grid gap-8 py-8 lg:grid-cols-12 lg:gap-12 lg:py-12">
        <div className="lg:col-span-5">
          <div className="mx-auto max-w-xs rounded-2xl bg-surface-low p-5 sm:p-7 lg:max-w-sm">
            <Skeleton raised className="aspect-[2/3] w-full rounded-lg" />
          </div>
        </div>

        <div className="space-y-6 lg:col-span-7">
          <div className="space-y-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-9 w-3/4" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-32" />
          </div>

          <div className="space-y-4 rounded-xl border border-line bg-card p-5">
            <Skeleton className="h-7 w-32" />
            <div className="flex flex-wrap items-center gap-3">
              <Skeleton className="h-9 w-28" />
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="size-12 rounded-full" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>

          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </Container>
    </>
  );
}

/**
 * The home page: the hero's copy beside its jacket, the features strip and
 * the first shelf. The panel can switch any section off, so the count is a
 * guess; the outline — a tall band, a strip, a shelf — is what every
 * arrangement shares, and it is the outline that stops the swap from jumping.
 */
export function HomeSkeleton() {
  return (
    <>
      <div className="bg-surface py-12 sm:py-16 lg:py-24">
        <Container className="grid grid-cols-1 gap-6 gap-y-12 md:gap-y-16 lg:grid-cols-5">
          <div className="flex flex-col justify-center gap-5 max-lg:items-center lg:col-span-3 lg:min-h-108">
            <Skeleton className="h-7 w-56 max-w-full rounded-full" />
            <div className="w-full space-y-3 max-lg:flex max-lg:flex-col max-lg:items-center">
              <Skeleton className="h-12 w-full max-w-lg" />
              <Skeleton className="h-12 w-3/4 max-w-md" />
            </div>
            <div className="w-full space-y-2 max-lg:flex max-lg:flex-col max-lg:items-center">
              <Skeleton className="h-5 w-full max-w-xl" />
              <Skeleton className="h-5 w-2/3 max-w-md" />
            </div>
            <div className="flex flex-wrap justify-center gap-4 lg:justify-start">
              <Skeleton className="h-12 w-44 rounded-full" />
              <Skeleton className="h-12 w-40 rounded-full" />
            </div>
          </div>
          <div className="flex items-center justify-center lg:col-span-2">
            <Skeleton className="aspect-[2/3] w-52 rounded-lg sm:w-60 lg:w-72" />
          </div>
        </Container>
      </div>

      <div className="border-y border-line-divider bg-card py-10">
        <Container className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="flex items-center gap-4">
              <Skeleton className="size-12 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          ))}
        </Container>
      </div>

      <div className="py-14 lg:py-20">
        <Container>
          <div className="mb-6 flex items-end justify-between gap-6">
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64 max-w-full" />
            </div>
            <Skeleton className="h-6 w-20" />
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 xl:grid-cols-5 xl:gap-6">
            {Array.from({ length: 5 }, (_, index) => (
              <CardSkeleton key={index} className={index === 4 ? "max-xl:hidden" : undefined} />
            ))}
          </div>
        </Container>
      </div>
    </>
  );
}

/**
 * The two category directories: a card per top-level branch, each with its
 * icon plate, a title, the grades listed under a rule and three jackets.
 */
export function BranchGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <>
      <PageHeaderSkeleton />

      <Container className="py-8 lg:py-12">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: count }, (_, index) => (
            <div
              key={index}
              className="flex flex-col gap-4 rounded-xl border border-line bg-card p-5"
            >
              <div className="flex items-start gap-3">
                <Skeleton className="size-12 shrink-0 rounded-full" />
                <div className="min-w-0 flex-1 space-y-2 pt-1">
                  <Skeleton className="h-5 w-1/2" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
              </div>
              <div className="space-y-2 border-t border-line-divider pt-3">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-3/5" />
              </div>
              <div className="flex gap-2">
                {Array.from({ length: 3 }, (_, jacket) => (
                  <Skeleton key={jacket} className="aspect-[2/3] w-16 rounded-md" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </Container>
    </>
  );
}

/** The teachers' directory: a pill per name — a round portrait and two lines. */
export function AuthorGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <>
      <PageHeaderSkeleton />

      <Container className="py-8 lg:py-12">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: count }, (_, index) => (
            <div
              key={index}
              className="flex items-center gap-3 rounded-full border border-line bg-card p-2 pe-4"
            >
              <Skeleton className="size-11 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </Container>
    </>
  );
}

/** The presses' directory: a tile per house — a round mark, the name, a count. */
export function PublisherGridSkeleton({ count = 10 }: { count?: number }) {
  return (
    <>
      <PageHeaderSkeleton />

      <Container className="py-8 lg:py-12">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: count }, (_, index) => (
            <div key={index} className="flex flex-col gap-2 rounded-xl border border-line bg-card p-5">
              <Skeleton className="size-11 rounded-full" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="mt-auto h-3 w-1/3 pt-2" />
            </div>
          ))}
        </div>
      </Container>
    </>
  );
}

/**
 * The basket: the free-shipping meter over the lines on the wide side, the
 * summary on the narrow one. Drawn as though it holds something — a reader
 * who opens an empty basket gets one short swap instead of a page that
 * fills and then empties.
 */
export function CartSkeleton({ rows = 2 }: { rows?: number }) {
  return (
    <>
      <PageHeaderSkeleton />

      <Container className="py-8 lg:py-12">
        <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
          <div className="min-w-0 space-y-4 lg:col-span-8">
            <div className="flex items-center gap-3 rounded-xl border border-line bg-surface-low p-4">
              <Skeleton raised className="size-5 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton raised className="h-4 w-1/2" />
                <Skeleton raised className="h-2 w-full rounded-sm" />
              </div>
            </div>

            <div className="divide-y divide-line-divider overflow-hidden rounded-xl border border-line bg-card">
              {Array.from({ length: rows }, (_, index) => (
                <div key={index} className="flex gap-4 p-4 sm:p-5">
                  <Skeleton className="aspect-[2/3] w-20 shrink-0 rounded-lg sm:w-24" />
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-5 w-2/3" />
                    <Skeleton className="h-4 w-1/3" />
                    <div className="mt-auto flex items-center justify-between gap-3 pt-2">
                      <Skeleton className="h-9 w-28" />
                      <Skeleton className="h-5 w-20" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Skeleton className="h-4 w-32" />
          </div>

          <div className="min-w-0 lg:col-span-4">
            <SummarySkeleton />
          </div>
        </div>
      </Container>
    </>
  );
}

/** The order summary panel the basket and the till share. */
function SummarySkeleton() {
  return (
    <div className="rounded-xl border border-line bg-card">
      <div className="border-b border-line px-5 py-4">
        <Skeleton className="h-6 w-32" />
      </div>
      <div className="space-y-3 px-5 py-4">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="flex items-baseline justify-between gap-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
      <div className="flex items-baseline justify-between gap-3 border-t border-line px-5 py-4">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-7 w-28" />
      </div>
      <div className="px-5 pb-5">
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  );
}

/**
 * The till: the title over the three steps, then the numbered sections of
 * the form beside the summary. Only the first section is drawn with fields;
 * the others are their headings, which is what the reader scrolls past.
 */
export function CheckoutSkeleton() {
  return (
    <>
      <div className="border-b border-line-divider bg-surface-low">
        <Container className="space-y-5 py-8 lg:py-10">
          <Skeleton raised className="h-9 w-48" />
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="flex items-center gap-2 sm:gap-4">
                <div className="flex items-center gap-2">
                  <Skeleton raised className="size-8 rounded-full" />
                  <Skeleton raised className="h-4 w-20" />
                </div>
                {index < 2 ? <Skeleton raised className="hidden h-px w-8 sm:block" /> : null}
              </div>
            ))}
          </div>
        </Container>
      </div>

      <Container className="grid gap-6 py-8 lg:grid-cols-12 lg:gap-8 lg:py-12">
        <div className="min-w-0 space-y-6 lg:col-span-7 xl:col-span-8">
          <div className="rounded-xl border border-line bg-card">
            <div className="flex items-center gap-3 border-b border-line px-5 py-4">
              <Skeleton className="size-9 shrink-0 rounded-full" />
              <Skeleton className="h-6 w-40" />
            </div>
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              {Array.from({ length: 6 }, (_, index) => (
                <div key={index} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          </div>

          {Array.from({ length: 2 }, (_, index) => (
            <div
              key={index}
              className="flex items-center gap-3 rounded-xl border border-line bg-card px-5 py-4"
            >
              <Skeleton className="size-9 shrink-0 rounded-full" />
              <Skeleton className="h-6 w-40" />
            </div>
          ))}
        </div>

        <div className="min-w-0 lg:col-span-5 xl:col-span-4">
          <SummarySkeleton />
        </div>
      </Container>
    </>
  );
}

/**
 * A notice page — the order confirmation: one centred card with a mark, a
 * title, a line of copy and a grid of facts, and the next steps under it.
 */
export function NoticeSkeleton() {
  return (
    <Container className="py-12 lg:py-20">
      <div className="mx-auto max-w-2xl space-y-8">
        <div className="space-y-4 rounded-xl border border-line bg-card p-8 elevation-md">
          <Skeleton className="mx-auto size-16 rounded-full" />
          <Skeleton className="mx-auto h-9 w-64 max-w-full" />
          <Skeleton className="mx-auto h-4 w-80 max-w-full" />
          <div className="grid gap-px border border-line bg-outline-variant sm:grid-cols-2">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="space-y-2 bg-card p-4">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-5 w-32" />
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-center">
            <Skeleton className="h-12 w-full sm:w-44" />
            <Skeleton className="h-12 w-full sm:w-44" />
          </div>
        </div>

        <div className="rounded-xl border border-line bg-card">
          <div className="border-b border-line px-5 py-4">
            <Skeleton className="h-6 w-32" />
          </div>
          <div className="divide-y divide-line-divider">
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="flex items-center gap-4 p-5">
                <Skeleton className="size-9 shrink-0 rounded-full" />
                <Skeleton className="size-5 shrink-0 rounded-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </Container>
  );
}
