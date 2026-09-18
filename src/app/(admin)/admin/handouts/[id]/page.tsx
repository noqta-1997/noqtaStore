import { Coins, ExternalLink, Pencil, ShoppingBag, Star } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ArchiveButton } from "@/components/admin/archive-button";
import { Panel } from "@/components/admin/panel";
import { StatCard } from "@/components/admin/stat-card";
import { BookCover } from "@/components/book/book-cover";
import { PriceTag } from "@/components/commerce/price-tag";
import { HandoutSpecs } from "@/components/handout/handout-specs";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { Rating } from "@/components/ui/rating";
import { getHandoutById, getHandoutSales, getReviewsByHandout } from "@/data";
import { defaultLocale } from "@/i18n/config";
import { getAdminDictionary, getDictionary } from "@/i18n/get-dictionary";
import { formatCompactPrice, formatDate, formatNumber } from "@/lib/format";

interface AdminHandoutPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: AdminHandoutPageProps): Promise<Metadata> {
  const { id } = await params;
  const [admin, handout] = await Promise.all([
    getAdminDictionary(defaultLocale),
    getHandoutById(id),
  ]);

  return {
    title: `${handout?.title[defaultLocale] ?? admin.handoutDetails.title} — ${admin.brand.panel}`,
  };
}

export default async function AdminHandoutPage({ params }: AdminHandoutPageProps) {
  const { id } = await params;
  const locale = defaultLocale;

  const handout = await getHandoutById(id);

  if (!handout) {
    notFound();
  }

  const [dictionary, admin, reviews, sales] = await Promise.all([
    getDictionary(locale),
    getAdminDictionary(locale),
    getReviewsByHandout(handout.id),
    getHandoutSales(handout.id),
  ]);

  const t = admin.handoutDetails;
  const { sold, revenue } = sales;

  return (
    <>
      <AdminPageHeader
        title={handout.title[locale]}
        subtitle={`${dictionary.common.by} ${handout.author.name[locale]}`}
        actions={
          <>
            <ArchiveButton
              kind="handout"
              id={handout.id}
              archived={Boolean(handout.archived)}
              withText
              labels={{
                archive: admin.handouts.archive.archive,
                restore: admin.handouts.archive.restore,
                archived: admin.handouts.archive.archived,
                restored: admin.handouts.archive.restored,
                failure: dictionary.common.toast.actionFailed,
              }}
              errorMessages={{
                forbidden: dictionary.common.actionErrors.forbidden,
                notFound: dictionary.common.actionErrors.notFound,
                saveFailed: dictionary.common.actionErrors.saveFailed,
              }}
            />
            {/* An archived handout has no store page to open. */}
            {handout.archived ? null : (
              <Link
                href={`/handouts/${handout.slug}`}
                className={buttonStyles({ variant: "secondary", size: "md" })}
              >
                <ExternalLink aria-hidden className="size-4 rtl:-scale-x-100" strokeWidth={1.75} />
                {t.viewInStore}
              </Link>
            )}
            <Link
              href={`/admin/handouts/${handout.id}/edit`}
              className={buttonStyles({ size: "md" })}
            >
              <Pencil aria-hidden className="size-4" strokeWidth={1.75} />
              {admin.common.edit}
            </Link>
          </>
        }
      />

      {handout.archived ? (
        <p
          role="status"
          className="rounded-md border border-line bg-surface-low px-4 py-3 text-body-md text-on-surface"
        >
          {admin.handouts.archive.notice}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={ShoppingBag}
          label={t.stats.sold}
          value={formatNumber(sold, locale)}
        />
        <StatCard
          icon={Coins}
          label={t.stats.revenue}
          value={formatCompactPrice(revenue, locale)}
        />
        <StatCard
          icon={Star}
          label={t.stats.rating}
          value={handout.rating.toFixed(1)}
        />
        <StatCard
          icon={Star}
          label={t.stats.reviews}
          value={formatNumber(handout.reviewsCount, locale)}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <Panel title={t.overview} className="min-w-0 lg:col-span-8">
          <div className="flex flex-col gap-5 sm:flex-row">
            <div className="w-32 shrink-0">
              <BookCover
                title={handout.title[locale]}
                author={handout.author.name[locale]}
                seed={handout.slug}
                src={handout.coverUrl}
                sizes="8rem"
                className="rounded-md elevation-sm"
              />
            </div>

            <div className="min-w-0 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="outline">{handout.category.name[locale]}</Badge>
                {handout.tags.map((tag) => (
                  <Badge key={tag} tone="primary">
                    {dictionary.common.tags[tag]}
                  </Badge>
                ))}
              </div>

              <PriceTag
                price={handout.price}
                compareAtPrice={handout.compareAtPrice}
                locale={locale}
                size="lg"
              />
              <Rating value={handout.rating} count={handout.reviewsCount} locale={locale} size="md" />

              <p className="text-body-md leading-relaxed text-on-surface-variant">
                {handout.description[locale]}
              </p>
            </div>
          </div>
        </Panel>

        <Panel title={t.specs} className="min-w-0 lg:col-span-4">
          <HandoutSpecs handout={handout} locale={locale} dictionary={dictionary} />
        </Panel>
      </div>

      <Panel title={t.recentReviews} flush>
        {reviews.length ? (
          <ul className="divide-y divide-line-divider">
            {reviews.map((review) => (
              <li key={review.id} className="space-y-1.5 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-on-surface">
                    {review.authorName}
                  </span>
                  <div className="flex items-center gap-3">
                    <Rating value={review.rating} locale={locale} />
                    <span className="text-label-md text-muted" data-numeric>
                      {formatDate(review.createdAt, locale)}
                    </span>
                  </div>
                </div>
                <p className="font-display text-base font-bold">{review.title[locale]}</p>
                <p className="text-body-md text-on-surface-variant">{review.body[locale]}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="p-5 text-body-md text-muted">
            {dictionary.handoutDetails.reviewsSection.empty}
          </p>
        )}
      </Panel>
    </>
  );
}
