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
import { PurchaseControls } from "@/components/commerce/purchase-controls";
import { WishlistButton } from "@/components/commerce/wishlist-button";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Container } from "@/components/ui/container";
import { Rating } from "@/components/ui/rating";
import { Surface } from "@/components/ui/surface";
import { Tabs } from "@/components/ui/tabs";
import {
  getBookBySlug,
  getBookSlugs,
  getRelatedBooks,
  getReviewsByBook,
} from "@/data";
import { defaultLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { formatDiscount, formatNumber } from "@/lib/format";
import { readSlug } from "@/lib/slug";

interface BookPageProps {
  params: Promise<{ slug: string }>;
}

/** Catalogue content is re-fetched at most every five minutes. */
export const revalidate = 300;

export async function generateStaticParams() {
  const slugs = await getBookSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: BookPageProps): Promise<Metadata> {
  const slug = readSlug((await params).slug);
  const book = await getBookBySlug(slug);
  if (!book) return {};

  const resolved = defaultLocale;

  return {
    title: book.title[resolved],
    description: book.description[resolved],
  };
}

export default async function BookPage({ params }: BookPageProps) {
  const slug = readSlug((await params).slug);
  const locale = defaultLocale;

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
              { label: dictionary.common.home, href: "/" },
              { label: dictionary.books.title, href: `/books` },
              {
                label: book.category.name[locale],
                href: `/categories/${book.category.slug}`,
              },
              { label: book.title[locale] },
            ]}
          />
        </Container>
      </div>

      <Container className="grid gap-8 py-8 lg:grid-cols-12 lg:gap-12 lg:py-12">
        <div className="lg:col-span-5">
          <div className="mx-auto max-w-xs lg:sticky lg:top-35 lg:max-w-sm">
            {/* The jacket sits on a tinted plate, the same way it does on
                every shelf card — the detail page is the shelf card enlarged. */}
            <div className="relative rounded-2xl bg-surface-low p-5 sm:p-7">
              <BookCover
                title={book.title[locale]}
                author={book.author.name[locale]}
                seed={book.slug}
                src={book.coverUrl}
                priority
                sizes="(min-width: 1024px) 24rem, 18rem"
                className="rounded-lg elevation-lg"
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
              href={`/categories/${book.category.slug}`}
              className="text-label-md font-semibold text-primary underline-offset-4 hover:underline"
            >
              {book.category.name[locale]}
            </Link>
            <h1 className="text-headline-lg sm:text-headline-xl">
              {book.title[locale]}
            </h1>
            <p className="text-body-lg text-on-surface-variant">
              {dictionary.common.by}{" "}
              <Link
                href={`/authors/${book.author.slug}`}
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

          <Surface className="space-y-4 p-5 elevation-sm">
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
                  <PackageCheck aria-hidden className="size-4" strokeWidth={1.75} />
                  <span data-numeric>{formatNumber(book.stock, locale)}</span>{" "}
                  {t.stockLeft}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* One number for both: what the stepper shows is what the
                  button adds. */}
              <PurchaseControls
                kind="book"
                id={book.id}
                stock={book.stock}
                disabled={isSoldOut}
                labels={{
                  quantity: dictionary.common.quantity,
                  increase: dictionary.common.increase,
                  decrease: dictionary.common.decrease,
                  addToCart: dictionary.common.addToCart,
                  toastTitle: dictionary.common.toast.addedToCart,
                  toastNote: dictionary.common.toast.addedToCartNote,
                  signIn: dictionary.common.toast.signInRequired,
                  outOfStock: dictionary.common.outOfStock,
                  failure: dictionary.common.toast.actionFailed,
                }}
                className="flex-1"
              />
              <WishlistButton
                bookId={book.id}
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
                    strokeWidth={1.75}
                  />
                  {item.text}
                </li>
              ))}
            </ul>
          </Surface>

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
                        href={`/authors/${book.author.slug}`}
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
            actionHref={`/categories/${book.category.slug}`}
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
