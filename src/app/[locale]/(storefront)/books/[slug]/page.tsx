import { PackageCheck, RotateCcw, Truck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BookCover } from "@/components/book/book-cover";
import { BookReviews } from "@/components/book/book-reviews";
import { BookShelf } from "@/components/book/book-shelf";
import { BookSpecs } from "@/components/book/book-specs";
import { AddToCartButton } from "@/components/commerce/add-to-cart-button";
import { PriceTag } from "@/components/commerce/price-tag";
import { WishlistButton } from "@/components/commerce/wishlist-button";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Container } from "@/components/ui/container";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { Rating } from "@/components/ui/rating";
import { Tabs } from "@/components/ui/tabs";
import {
  getBookBySlug,
  getBookSlugs,
  getRelatedBooks,
  getReviewsByBook,
} from "@/data";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { formatDiscount, formatNumber } from "@/lib/format";

interface BookPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

/** Catalogue content is re-fetched at most every five minutes. */
export const revalidate = 300;

export async function generateStaticParams() {
  const slugs = await getBookSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: BookPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const book = await getBookBySlug(slug);
  if (!book) return {};

  const resolved = isLocale(locale) ? locale : "ar";

  return {
    title: book.title[resolved],
    description: book.description[resolved],
  };
}

export default async function BookPage({ params }: BookPageProps) {
  const { locale, slug } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const book = await getBookBySlug(slug);

  if (!book) {
    notFound();
  }

  const [dictionary, reviews, related] = await Promise.all([
    getDictionary(locale),
    getReviewsByBook(book.id),
    getRelatedBooks(book, 5),
  ]);

  const t = dictionary.bookDetails;
  const isSoldOut = book.stock === 0;

  const highlights = [
    { icon: Truck, text: t.deliveryNote },
    { icon: RotateCcw, text: t.returnsNote },
  ];

  return (
    <>
      <div className="border-b border-line-divider bg-surface-low">
        <Container className="py-4">
          <Breadcrumb
            label={dictionary.common.menu}
            items={[
              { label: dictionary.common.home, href: `/${locale}` },
              { label: dictionary.books.title, href: `/${locale}/books` },
              {
                label: book.category.name[locale],
                href: `/${locale}/categories/${book.category.slug}`,
              },
              { label: book.title[locale] },
            ]}
          />
        </Container>
      </div>

      <Container className="grid gap-8 py-8 lg:grid-cols-12 lg:gap-12 lg:py-12">
        <div className="lg:col-span-5">
          <div className="mx-auto max-w-xs lg:sticky lg:top-44 lg:max-w-sm">
            <div className="relative">
              <BookCover
                title={book.title[locale]}
                author={book.author.name[locale]}
                seed={book.slug}
                src={book.coverUrl}
                priority
                sizes="(min-width: 1024px) 24rem, 18rem"
                className="border border-line elevation-md"
              />
              <div className="absolute start-3 top-3 flex flex-col items-start gap-2">
                {book.compareAtPrice ? (
                  <Badge tone="primary">
                    {formatDiscount(book.price, book.compareAtPrice, locale)}{" "}
                    {dictionary.common.off}
                  </Badge>
                ) : null}
                {book.tags[0] ? (
                  <Badge tone="ink">{dictionary.common.tags[book.tags[0]]}</Badge>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6 lg:col-span-7">
          <div className="space-y-3">
            <Link
              href={`/${locale}/categories/${book.category.slug}`}
              className="label-mono text-primary underline-offset-4 hover:underline"
            >
              {book.category.name[locale]}
            </Link>
            <h1 className="text-headline-lg sm:text-[2.5rem] sm:leading-tight">
              {book.title[locale]}
            </h1>
            <p className="text-body-lg text-on-surface-variant">
              {dictionary.common.by}{" "}
              <Link
                href={`/${locale}/authors/${book.author.slug}`}
                className="font-semibold text-on-surface underline-offset-4 hover:underline"
              >
                {book.author.name[locale]}
              </Link>
            </p>
            <Rating
              value={book.rating}
              count={book.reviewsCount}
              locale={locale}
              size="md"
            />
          </div>

          <div className="space-y-4 rounded-md border border-line bg-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <PriceTag
                price={book.price}
                compareAtPrice={book.compareAtPrice}
                locale={locale}
                size="lg"
              />
              {isSoldOut ? (
                <Badge tone="muted">{dictionary.common.outOfStock}</Badge>
              ) : (
                <span className="flex items-center gap-1.5 text-label-md text-success-fg">
                  <PackageCheck aria-hidden className="size-4" strokeWidth={2} />
                  <span data-numeric>{formatNumber(book.stock, locale)}</span>{" "}
                  {t.stockLeft}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <QuantityStepper
                max={Math.max(book.stock, 1)}
                labels={{
                  quantity: dictionary.common.quantity,
                  increase: dictionary.common.increase,
                  decrease: dictionary.common.decrease,
                }}
              />
              <AddToCartButton
                bookId={book.id}
                locale={locale}
                size="lg"
                disabled={isSoldOut}
                label={dictionary.common.addToCart}
                toastTitle={dictionary.common.toast.addedToCart}
                toastNote={dictionary.common.toast.addedToCartNote}
                signInMessage={dictionary.common.toast.signInRequired}
                outOfStockMessage={dictionary.common.outOfStock}
                failureMessage={dictionary.common.toast.actionFailed}
                className="flex-1"
              />
              <WishlistButton
                bookId={book.id}
                locale={locale}
                label={t.addToWishlist}
                addedTitle={dictionary.common.toast.addedToWishlist}
                removedTitle={dictionary.common.toast.removedFromWishlist}
                signInMessage={dictionary.common.toast.signInRequired}
                bookTitle={book.title[locale]}
                className="size-12"
              />
            </div>

            <ul className="space-y-2 border-t border-line-divider pt-4">
              {highlights.map((item) => (
                <li
                  key={item.text}
                  className="flex items-start gap-2 text-body-md text-on-surface-variant"
                >
                  <item.icon
                    aria-hidden
                    className="mt-0.5 size-4 shrink-0 text-primary"
                    strokeWidth={2}
                  />
                  {item.text}
                </li>
              ))}
            </ul>
          </div>

          <Tabs
            items={[
              {
                id: "description",
                label: t.tabs.description,
                content: (
                  <div className="space-y-4">
                    <p className="text-body-lg leading-relaxed text-on-surface-variant">
                      {book.description[locale]}
                    </p>
                    <div className="border-t border-line-divider pt-4">
                      <h2 className="mb-2 font-display text-base font-bold">
                        {t.aboutAuthor}
                      </h2>
                      <p className="text-body-md leading-relaxed text-on-surface-variant">
                        {book.author.bio[locale]}
                      </p>
                      <Link
                        href={`/${locale}/authors/${book.author.slug}`}
                        className="mt-3 inline-block text-label-md text-primary underline-offset-4 hover:underline"
                      >
                        {dictionary.authorsPage.viewProfile}
                      </Link>
                    </div>
                  </div>
                ),
              },
              {
                id: "specs",
                label: t.tabs.specs,
                content: (
                  <BookSpecs book={book} locale={locale} dictionary={dictionary} />
                ),
              },
              {
                id: "reviews",
                label: t.tabs.reviews,
                content: (
                  <BookReviews
                    book={book}
                    reviews={reviews}
                    locale={locale}
                    dictionary={dictionary}
                  />
                ),
              },
            ]}
          />
        </div>
      </Container>

      {related.length ? (
        <div className="border-t border-line-divider bg-surface-low">
          <BookShelf
            title={t.related}
            subtitle={t.relatedSubtitle}
            books={related}
            locale={locale}
            dictionary={dictionary.common}
            actionHref={`/${locale}/categories/${book.category.slug}`}
          />
        </div>
      ) : null}

      {/* Persistent action bar on small screens */}
      <div className="sticky bottom-0 z-30 border-t border-line-divider bg-card lg:hidden">
        <Container className="flex items-center justify-between gap-3 py-3">
          <PriceTag
            price={book.price}
            compareAtPrice={book.compareAtPrice}
            locale={locale}
          />
          <AddToCartButton
            bookId={book.id}
            locale={locale}
            disabled={isSoldOut}
            label={dictionary.common.addToCart}
            toastTitle={dictionary.common.toast.addedToCart}
            toastNote={dictionary.common.toast.addedToCartNote}
            signInMessage={dictionary.common.toast.signInRequired}
            outOfStockMessage={dictionary.common.outOfStock}
            failureMessage={dictionary.common.toast.actionFailed}
            className="max-w-48 flex-1"
          />
        </Container>
      </div>
    </>
  );
}
