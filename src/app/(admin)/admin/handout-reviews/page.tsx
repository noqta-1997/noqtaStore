import { MessageSquareQuote } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { SortableTh, Table, Tbody, Td, Th, Thead, Tr } from "@/components/admin/data-table";
import { TableToolbar, type ToolbarTab } from "@/components/admin/table-toolbar";
import { HandoutReviewModeration } from "@/components/admin/handout-review-moderation";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { Rating } from "@/components/ui/rating";
import { getAdminHandoutReviews, getHandoutReviewCounts } from "@/data";
import { defaultLocale } from "@/i18n/config";
import { getAdminDictionary, getDictionary } from "@/i18n/get-dictionary";
import { formatDate } from "@/lib/format";
import {
  buildQueryString,
  readNumberParam,
  readParam,
  type SearchParamsRecord,
} from "@/lib/search-params";
import { cn } from "@/lib/utils";
import type { ReviewStatus } from "@/types";

interface AdminHandoutReviewsPageProps {
  searchParams: Promise<SearchParamsRecord>;
}

export async function generateMetadata(): Promise<Metadata> {
  const admin = await getAdminDictionary(defaultLocale);

  return { title: `${admin.handoutReviews.title} — ${admin.brand.panel}` };
}

const statuses: ReviewStatus[] = ["pending", "published", "rejected"];

const statusTones: Record<ReviewStatus, string> = {
  pending: "border-line bg-primary-fixed text-on-primary-fixed",
  published: "border-line bg-success text-on-success",
  rejected: "border-line bg-error-container text-on-error-container",
};

/** The moderation queue for handout reviews — the book queue over the other table. */
export default async function AdminHandoutReviewsPage({
  searchParams,
}: AdminHandoutReviewsPageProps) {
  const locale = defaultLocale;

  const raw = await searchParams;
  const term = readParam(raw, "q");
  const rawStatus = readParam(raw, "status");
  const sort = readParam(raw, "sort");
  const status = statuses.includes(rawStatus as ReviewStatus) ? rawStatus! : "all";
  const page = readNumberParam(raw, "page") ?? 1;

  const [dictionary, admin, result, counts] = await Promise.all([
    getDictionary(locale),
    getAdminDictionary(locale),
    getAdminHandoutReviews({ q: term, status, page, sort, perPage: 10 }),
    getHandoutReviewCounts(),
  ]);

  const t = admin.handoutReviews;
  const base = `/admin/handout-reviews`;

  /* Sorting rides in the query string, so a sorted table is a shareable URL. */
  const sortHref = (next: string) =>
    `${base}${buildQueryString({ q: term, status, sort: next })}`;

  const tabs: ToolbarTab[] = [
    { value: "all", label: admin.common.all, count: counts.all },
    { value: "pending", label: t.statuses.pending, count: counts.pending },
    { value: "published", label: t.statuses.published, count: counts.published },
    { value: "rejected", label: t.statuses.rejected, count: counts.rejected },
  ].map((tab) => ({
    ...tab,
    href: `${base}${buildQueryString({
      q: term,
      status: tab.value === "all" ? undefined : tab.value,
      sort,
    })}`,
    active: status === tab.value,
  }));

  return (
    <>
      <AdminPageHeader title={t.title} subtitle={t.subtitle} />

      <TableToolbar
        action={base}
        searchLabel={admin.common.search}
        searchPlaceholder={t.searchPlaceholder}
        defaultValue={term}
        hiddenFields={{ status: status === "all" ? undefined : status }}
        tabs={tabs}
      />

      {result.items.length ? (
        <>
          <Table minWidth="62rem">
            <Thead>
              <Tr>
                <Th>{t.table.handout}</Th>
                <Th>{t.table.reviewer}</Th>
                <SortableTh
                  column="rating"
                  current={sort}
                  buildHref={sortHref}
                  defaultDirection="desc"
                >
                  {t.table.rating}
                </SortableTh>
                <Th>{t.table.review}</Th>
                <SortableTh
                  column="created"
                  current={sort}
                  buildHref={sortHref}
                  defaultDirection="desc"
                >
                  {t.table.date}
                </SortableTh>
                <Th>{admin.common.status}</Th>
                <Th className="text-end">{admin.common.actions}</Th>
              </Tr>
            </Thead>
            <Tbody>
              {result.items.map((review) => (
                <Tr key={review.id}>
                  <Td>
                    <Link
                      href={`/admin/handouts/${review.handoutId}`}
                      className="block max-w-44 truncate font-semibold underline-offset-4 hover:underline"
                    >
                      {review.handoutTitle[locale]}
                    </Link>
                  </Td>
                  <Td className="whitespace-nowrap text-on-surface-variant">
                    {review.authorName}
                  </Td>
                  <Td>
                    <Rating value={review.rating} locale={locale} />
                  </Td>
                  <Td>
                    <span className="block font-semibold text-on-surface">
                      {review.title[locale]}
                    </span>
                    <span className="block max-w-72 truncate text-label-md text-muted">
                      {review.body[locale]}
                    </span>
                  </Td>
                  <Td className="whitespace-nowrap text-on-surface-variant" data-numeric>
                    {formatDate(review.createdAt, locale)}
                  </Td>
                  <Td>
                    <span
                      className={cn(
                        "inline-flex rounded-full border px-2.5 py-0.5 text-label-md font-semibold",
                        statusTones[review.status],
                      )}
                    >
                      {t.statuses[review.status]}
                    </span>
                  </Td>
                  <Td>
                    <HandoutReviewModeration
                      reviewId={review.id}
                      status={review.status}
                      handoutTitle={review.handoutTitle[locale]}
                      labels={{
                        approve: t.approve,
                        reject: t.reject,
                        published: dictionary.common.toast.reviewPublished,
                        rejected: dictionary.common.toast.reviewRejected,
                        failure: dictionary.common.toast.actionFailed,
                      }}
                    />
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>

          <Pagination
            page={result.page}
            pageCount={result.pageCount}
            buildHref={(next) =>
              `${base}${buildQueryString({
                q: term,
                status: status === "all" ? undefined : status,
                page: next > 1 ? next : undefined,
                sort,
              })}`
            }
            labels={{
              previous: dictionary.common.previous,
              next: dictionary.common.next,
              page: dictionary.common.page,
            }}
          />
        </>
      ) : (
        <EmptyState
          icon={MessageSquareQuote}
          title={t.empty.title}
          description={t.empty.description}
          actionLabel={admin.common.all}
          actionHref={base}
        />
      )}
    </>
  );
}
