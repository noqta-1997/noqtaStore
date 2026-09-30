# جرد حذف الكتب المدرسية — ملحق سطري

أُنشئ في 2026-09-30 من `git grep` على HEAD (63f7efc). 105 ملفًا نصيًا، 982 سطرًا، + 18 لقطة PNG. النمط: `book` بأي حالة أحرف + «كتاب مدرسي / الكتب المدرسية» وصيغها.

> تنبيه: وجود سطر هنا لا يعني أنه يُحذف — كثير منها في ملفات الملازم التي تستعير مكوّنات باسم Book (BookCover، BookFilters، parseBookQuery، BookTag). التقرير الرئيسي يحدّد مصير كل مجموعة.

## أ. ملفات تحمل اسم book (بعضها مشترك مع الملازم — انظر التقرير)

### `src/app/(admin)/admin/books/[id]/edit/page.tsx` — 12 سطر

```text
    5: import { BookForm } from "@/components/admin/book-form";
    6: import { getAuthors, getBookById, getCategories, getPublishers } from "@/data";
   10: interface EditBookPageProps {
   17: return { title: `${admin.bookForm.editTitle} — ${admin.brand.panel}` };
   20: export default async function EditBookPage({ params }: EditBookPageProps) {
   24: const book = await getBookById(id);
   26: if (!book) {
   41: title={admin.bookForm.editTitle}
   42: subtitle={book.title[locale]}
   45: <BookForm
   52: book={book}
   53: cancelHref={`/admin/books`}
```

### `src/app/(admin)/admin/books/new/page.tsx` — 7 سطر

```text
    4: import { BookForm } from "@/components/admin/book-form";
   12: return { title: `${admin.bookForm.addTitle} — ${admin.brand.panel}` };
   15: export default async function NewBookPage() {
   29: title={admin.bookForm.addTitle}
   30: subtitle={admin.bookForm.addSubtitle}
   33: <BookForm
   40: cancelHref={`/admin/books`}
```

### `src/app/(admin)/admin/books/page.tsx` — 37 سطر

```text
    1: import { BookOpen, Plus } from "lucide-react";
    9: import { deleteBook } from "@/app/actions/admin";
   11: import { BookCover } from "@/components/book/book-cover";
   17: import { getAdminBooks, getStockCounts, LOW_STOCK_THRESHOLD, type StockFilter } from "@/data";
   24: interface AdminBooksPageProps {
   31: return { title: `${admin.books.title} — ${admin.brand.panel}` };
   36: export default async function AdminBooksPage({
   38: }: AdminBooksPageProps) {
   53: getAdminBooks({ q: term, stock, page, sort, perPage: 10 }),
   57: const t = admin.books;
   58: const base = `/admin/books`;
  113: {t.table.book}
  135: {result.items.map((book) => {
  136: const out = book.stock === 0;
  137: const low = !out && book.stock <= LOW_STOCK_THRESHOLD;
  140: <Tr key={book.id}>
  144: <BookCover
  145: title={book.title[locale]}
  146: author={book.author.name[locale]}
  147: seed={book.slug}
  148: src={book.coverUrl}
  156: href={`${base}/${book.id}`}
  159: {book.title[locale]}
  161: {book.archived ? (
  169: <Td className="text-on-surface-variant">{book.author.name[locale]}</Td>
  170: <Td className="text-on-surface-variant">{book.category.name[locale]}</Td>
  172: {formatPrice(book.price, locale)}
  184: {formatNumber(book.stock, locale)}
  188: <Rating value={book.rating} locale={locale} />
  193: kind="book"
  194: id={book.id}
  195: archived={Boolean(book.archived)}
  210: viewHref={`${base}/${book.id}`}
  211: editHref={`${base}/${book.id}/edit`}
  212: itemName={book.title[locale]}
  226: deleteAction={deleteBook.bind(null, book.id)}
  264: icon={BookOpen}
```

### `src/app/(storefront)/books/[slug]/layout.tsx` — 4 سطر

```text
    4: import { getBookBySlug } from "@/data";
    8: * Decides "no such book" before a byte of the page is sent.
   21: export default async function BookLayout({
   29: if (!(await getBookBySlug(slug))) notFound();
```

### `src/components/admin/book-form.tsx` — 39 سطر

```text
    6: import { BookCover } from "@/components/book/book-cover";
   18: BookTag,
   19: BookWithRelations,
   24: import { deleteBook, saveBook } from "@/app/actions/admin";
   28: interface BookFormProps {
   38: book?: BookWithRelations;
   42: const tagOptions: BookTag[] = ["bestseller", "new", "featured", "award"];
   45: * One form serves both "add book" and "edit book". An added book ends on the
   49: export function BookForm({
   56: book,
   58: }: BookFormProps) {
   59: const t = admin.bookForm;
   60: const isEdit = Boolean(book);
   65: action={saveBook}
   67: isEdit ? dictionary.common.toast.saved : dictionary.common.toast.bookPublished
   85: missingTitle: dictionary.common.actionErrors.missingBookTitle,
   93: {book ? <input type="hidden" name="bookId" value={book.id} /> : null}
   97: {book ? <input type="hidden" name="stockWas" value={book.stock} /> : null}
  103: <Input id="titleAr" name="titleAr" defaultValue={book?.title.ar} required />
  121: defaultValue={book?.authorId ?? ""}
  150: defaultValue={book?.categoryId ?? ""}
  174: defaultValue={book?.description.ar}
  198: defaultValue={book?.publisherId ?? ""}
  220: defaultValue={book?.publishedYear ?? storeYear()}
  232: defaultValue={book?.pages}
  243: key={book?.coverUrl ?? "no-cover"}
  244: hasCover={Boolean(book?.coverUrl)}
  248: <BookCover
  249: title={book?.title[locale] ?? admin.books.title}
  250: author={book?.author.name[locale] ?? admin.brand.name}
  251: seed={book?.slug ?? "new-book"}
  252: src={book?.coverUrl}
  270: defaultValue={book?.price}
  287: defaultValue={book?.compareAtPrice}
  296: key={book?.stock}
  303: defaultValue={book?.stock}
  316: defaultChecked={book?.tags.includes(tag)}
  340: action={book ? deleteBook.bind(null, book.id) : undefined}
  349: itemName={book?.title[locale]}
```

### `src/components/book/book-card.tsx` — 27 سطر

```text
    3: import { BookCover } from "@/components/book/book-cover";
   13: import type { BookWithRelations } from "@/types";
   17: interface BookCardProps {
   18: book: BookWithRelations;
   37: export function BookCard({
   38: book,
   43: }: BookCardProps) {
   44: const href = `/books/${book.slug}`;
   45: const isSoldOut = book.stock === 0;
   46: const isLowStock = !isSoldOut && book.stock <= LOW_STOCK_THRESHOLD;
   47: const primaryTag = book.tags[0];
   59: <BookCover
   60: title={book.title[locale]}
   61: author={book.author.name[locale]}
   62: seed={book.slug}
   63: src={book.coverUrl}
   75: {book.compareAtPrice ? (
   77: {formatDiscount(book.price, book.compareAtPrice, locale)}{" "}
   89: <span className="line-clamp-2">{book.title[locale]}</span>
   94: {dictionary.by} {book.author.name[locale]} · {book.category.name[locale]}
  100: value={book.rating}
  112: price={book.price}
  113: compareAtPrice={book.compareAtPrice}
  130: bookId={book.id}
  135: toastNote={book.title[locale]}
  143: bookId={book.id}
  148: bookTitle={book.title[locale]}
```

### `src/components/book/book-catalogue.tsx` — 15 سطر

```text
    3: import { BookFilters, type BookFilterValues } from "@/components/book/book-filters";
    4: import { BookGrid } from "@/components/book/book-grid";
    5: import { FilterSheet } from "@/components/book/filter-sheet";
    6: import { SortSelect } from "@/components/book/sort-select";
   11: import type { BookQueryResult, SortKey } from "@/data";
   18: interface BookCatalogueProps {
   24: result: BookQueryResult;
   25: values: BookFilterValues;
   26: /** Path the filter form posts to, e.g. `/books`. */
   35: export function BookCatalogue({
   45: }: BookCatalogueProps) {
   46: const t = dictionary.books;
   73: <BookFilters
  119: <BookGrid
  120: books={result.items}
```

### `src/components/book/book-cover.tsx` — 3 سطر

```text
    6: interface BookCoverProps {
   31: export function BookCover({
   40: }: BookCoverProps) {
```

### `src/components/book/book-specs.tsx` — 10 سطر

```text
    6: import type { BookWithRelations } from "@/types";
    8: interface BookSpecsProps {
    9: book: BookWithRelations;
   15: export function BookSpecs({ book, locale, dictionary }: BookSpecsProps) {
   16: const t = dictionary.bookDetails.specs;
   26: value: book.publisher.name[locale],
   27: href: `/publishers/${book.publisher.slug}`,
   29: { label: t.publishedYear, value: String(book.publishedYear), numeric: true },
   30: { label: t.pages, value: formatNumber(book.pages, locale), numeric: true },
   31: { label: t.language, value: book.language[locale] },
```

### `src/data/books.ts` — 4 سطر

```text
    1: import type { Book, Localized } from "@/types";
   10: export type SeedBook = Omit<Book, "publisherId"> & { publisher: Localized };
   13: * Mock catalogue — physical books only (stock and shipping apply).
   16: export const books: SeedBook[] = [
```

### `src/lib/book-query.ts` — 9 سطر

```text
    1: import type { BookFilterValues } from "@/components/book/book-filters";
    2: import type { BookQuery, SortKey } from "@/data";
   19: export interface ParsedBookQuery {
   20: values: BookFilterValues;
   25: export function parseBookQuery(params: SearchParamsRecord): ParsedBookQuery {
   45: export function toBookQuery(
   46: { values, page }: ParsedBookQuery,
   47: overrides: Partial<BookQuery> = {},
   48: ): BookQuery {
```

### `src/lib/book-rating.ts` — 6 سطر

```text
    4: * Keeps the denormalised rating on Book in step with its published reviews.
    7: export async function refreshBookRating(
    9: bookId: string,
   12: where: { bookId, status: "published" },
   17: await tx.book.update({
   18: where: { id: bookId },
```

### `src/app/(admin)/admin/books/[id]/page.tsx` — 0 سطر

### `src/app/(storefront)/books/(catalogue)/loading.tsx` — 0 سطر

### `src/app/(storefront)/books/(catalogue)/page.tsx` — 0 سطر

### `src/app/(storefront)/books/[slug]/loading.tsx` — 0 سطر

### `src/app/(storefront)/books/[slug]/page.tsx` — 0 سطر

### `src/components/book/book-filters.tsx` — 0 سطر

### `src/components/book/book-grid.tsx` — 0 سطر

### `src/components/book/book-reviews.tsx` — 0 سطر

### `src/components/book/book-shelf.tsx` — 0 سطر

### `src/components/book/filter-sheet.tsx` — 0 سطر

### `src/components/book/review-form.tsx` — 0 سطر

### `src/components/book/sort-select.tsx` — 0 سطر

### `src/components/book/title-link.tsx` — 0 سطر


## ب. قاعدة البيانات: المخطط والترحيلات والبذر

### `prisma/migrations/20260830070905_init/migration.sql` — 23 سطر

```text
    5: CREATE TYPE "BookTag" AS ENUM ('bestseller', 'new', 'featured', 'award');
   55: CREATE TABLE "books" (
   75: "tags" "BookTag"[] DEFAULT ARRAY[]::"BookTag"[],
   83: CONSTRAINT "books_pkey" PRIMARY KEY ("id")
  146: "bookId" TEXT NOT NULL,
  166: "bookId" TEXT NOT NULL,
  181: "bookId" TEXT NOT NULL,
  184: CONSTRAINT "wishlist_items_pkey" PRIMARY KEY ("customerId","bookId")
  190: "bookId" TEXT NOT NULL,
  194: CONSTRAINT "cart_items_pkey" PRIMARY KEY ("customerId","bookId")
  204: CREATE UNIQUE INDEX "books_slug_key" ON "books"("slug");
  207: CREATE UNIQUE INDEX "books_isbn_key" ON "books"("isbn");
  210: CREATE INDEX "books_categoryId_idx" ON "books"("categoryId");
  213: CREATE INDEX "books_authorId_idx" ON "books"("authorId");
  216: CREATE INDEX "books_createdAt_idx" ON "books"("createdAt");
  243: CREATE INDEX "order_items_bookId_idx" ON "order_items"("bookId");
  252: CREATE UNIQUE INDEX "reviews_bookId_customerId_key" ON "reviews"("bookId", "customerId");
  255: ALTER TABLE "books" ADD CONSTRAINT "books_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "authors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  258: ALTER TABLE "books" ADD CONSTRAINT "books_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  270: ALTER TABLE "order_items" ADD CONSTRAINT "order_items_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "books"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  276: ALTER TABLE "reviews" ADD CONSTRAINT "reviews_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "books"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  285: ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "books"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  291: ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "books"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

### `prisma/migrations/20260901090000_publishers/migration.sql` — 10 سطر

```text
    1: -- Publishers were free text on every book. This promotes them to their own
    2: -- table and rewires the books, keeping every existing value.
   33: FROM "books"
   36: -- AlterTable: link the books before the column is required.
   37: ALTER TABLE "books" ADD COLUMN "publisherId" TEXT;
   39: UPDATE "books" b
   44: ALTER TABLE "books" ALTER COLUMN "publisherId" SET NOT NULL;
   46: ALTER TABLE "books" DROP COLUMN "publisherAr",
   50: CREATE INDEX "books_publisherId_idx" ON "books"("publisherId");
   53: ALTER TABLE "books" ADD CONSTRAINT "books_publisherId_fkey"
```

### `prisma/migrations/20260905000000_drop_english_columns/migration.sql` — 2 سطر

```text
    5: -- held real content, not translations of chrome — English book titles, author
   19: ALTER TABLE "books" DROP COLUMN "descriptionEn",
```

### `prisma/migrations/20260912000000_handouts/migration.sql` — 3 سطر

```text
    3: -- A second table shaped exactly like "books": the two catalogues are browsed
    6: -- "books" only; wiring them to handouts is a later change.
   24: "tags" "BookTag"[] DEFAULT ARRAY[]::"BookTag"[],
```

### `prisma/migrations/20260913000000_handout_commerce/migration.sql` — 1 سطر

```text
    4: -- pointing at "handouts" instead of "books". An order keeps its book lines in
```

### `prisma/migrations/20260915140000_author_subject_category/migration.sql` — 1 سطر

```text
    1: -- The subject a teacher teaches is now a branch of the school-books category
```

### `prisma/migrations/20260915200000_drop_catalogue_fields/migration.sql` — 3 سطر

```text
    3: -- ISBN, cover type and weight on books and handouts, the country on authors
   14: DROP INDEX "books_isbn_key";
   23: ALTER TABLE "books" DROP COLUMN "coverType",
```

### `prisma/migrations/20260917080000_quantity_checks/migration.sql` — 3 سطر

```text
    8: -- status change that puts a cancelled order back on the books, a script.
   13: -- Books and handouts: the shelf.
   14: ALTER TABLE "books" ADD CONSTRAINT "books_stock_check" CHECK ("stock" >= 0);
```

### `prisma/migrations/20260917100000_money_and_rating_checks/migration.sql` — 4 سطر

```text
   16: ALTER TABLE "books" ADD CONSTRAINT "books_price_check" CHECK ("price" >= 0);
   17: ALTER TABLE "books" ADD CONSTRAINT "books_compareAtPrice_check" CHECK ("compareAtPrice" IS NULL OR "compareAtPrice" >= 0);
   18: ALTER TABLE "books" ADD CONSTRAINT "books_rating_check" CHECK ("rating" >= 0 AND "rating" <= 5);
   19: ALTER TABLE "books" ADD CONSTRAINT "books_reviewsCount_check" CHECK ("reviewsCount" >= 0);
```

### `prisma/migrations/20260917150000_foreign_key_indexes/migration.sql` — 4 سطر

```text
    4: -- handout_reviews.customerId sit second in their unique index (bookId or
    5: -- handoutId leads), and bookId/handoutId sit second in the composite keys of
   16: CREATE INDEX "wishlist_items_bookId_idx" ON "wishlist_items"("bookId");
   19: CREATE INDEX "cart_items_bookId_idx" ON "cart_items"("bookId");
```

### `prisma/migrations/20260918110000_lock_public_api/migration.sql` — 1 سطر

```text
   29: ALTER TABLE "books" ENABLE ROW LEVEL SECURITY;
```

### `prisma/migrations/20260919090000_book_archive/migration.sql` — 3 سطر

```text
    1: -- Archiving a book instead of deleting it.
    3: -- A book that appears in an order cannot be deleted: order_items holds it
   10: ALTER TABLE "books" ADD COLUMN "archivedAt" TIMESTAMP(3);
```

### `prisma/migrations/20260919100000_handout_archive/migration.sql` — 1 سطر

```text
    2: -- 20260919090000_book_archive. handout_order_items holds an ordered handout
```

### `prisma/migrations/20260929120000_title_figure_checks/migration.sql` — 4 سطر

```text
    4: -- Each restates a rule saveBook and saveHandout already apply (commits
   19: ALTER TABLE "books" ADD CONSTRAINT "books_compareAtPrice_above_price_check" CHECK ("compareAtPrice" IS NULL OR "compareAtPrice" > "price");
   20: ALTER TABLE "books" ADD CONSTRAINT "books_pages_check" CHECK ("pages" >= 1);
   21: ALTER TABLE "books" ADD CONSTRAINT "books_publishedYear_check" CHECK ("publishedYear" >= 1);
```

### `prisma/schema.prisma` — 34 سطر

```text
    4: // - Editorial content (books, categories, authors) carries one column per
   27: enum BookTag {
   84: /// The school-book catalogue's tree: stages hold grades, grades may hold
  104: books Book[]
  164: books Book[]
  187: books Book[]
  195: model Book {
  216: tags           BookTag[] @default([])
  222: /// Set when the panel takes the title off sale without deleting it. A book
  246: @@map("books")
  249: /// Lecture-note booklets (ملازم). A carbon copy of Book kept in its own
  259: /// Same CHECK as Book.compareAtPrice.
  261: /// Same CHECK and the same `takeFromShelf` as Book.stock.
  263: /// Same CHECKs as Book.pages and Book.publishedYear.
  268: tags           BookTag[] @default([])
  274: /// Same as Book.archivedAt: off sale without being deleted.
  417: bookId    String
  423: book  Book  @relation(fields: [bookId], references: [id])
  426: @@index([bookId])
  466: bookId     String
  475: book     Book     @relation(fields: [bookId], references: [id], onDelete: Cascade)
  478: /// One review per book per reader.
  479: @@unique([bookId, customerId])
  480: /// The unique index above leads with bookId, so it serves a book page but
  489: bookId     String
  493: book     Book     @relation(fields: [bookId], references: [id], onDelete: Cascade)
  495: @@id([customerId, bookId])
  496: /// The key leads with customerId; deleting a book has to find its rows by bookId.
  497: @@index([bookId])
  503: bookId     String
  508: book     Book     @relation(fields: [bookId], references: [id], onDelete: Cascade)
  510: @@id([customerId, bookId])
  511: /// Same as WishlistItem: the cascade from a deleted book looks up bookId.
  512: @@index([bookId])
```

### `prisma/seed.ts` — 39 سطر

```text
    9: wishlistBookIds,
   13: import { books } from "../src/data/books";
   60: await prisma.book.deleteMany();
  131: for (const book of books) publisherNames.set(book.publisher.ar, book.publisher);
  145: await prisma.book.createMany({
  146: data: books.map((book) => ({
  147: id: book.id,
  148: slug: book.slug,
  149: titleAr: book.title.ar,
  150: descriptionAr: book.description.ar,
  151: price: book.price,
  152: compareAtPrice: book.compareAtPrice ?? null,
  153: stock: book.stock,
  154: pages: book.pages,
  155: publisherId: publisherIds.get(book.publisher.ar)!,
  156: publishedYear: book.publishedYear,
  157: languageAr: book.language.ar,
  158: coverUrl: book.coverUrl ?? null,
  159: tags: book.tags,
  160: rating: book.rating,
  161: reviewsCount: book.reviewsCount,
  162: authorId: book.authorId,
  163: categoryId: book.categoryId,
  164: createdAt: new Date(book.createdAt),
  195: books: books.length,
  233: data: wishlistBookIds.map((bookId) => ({ customerId: customer.id, bookId })),
  239: bookId: line.bookId,
  253: items: { bookId: string; quantity: number; unitPrice: number }[];
  338: const book = pick(books);
  340: bookId: book.id,
  342: unitPrice: book.price,
  346: all.findIndex((other) => other.bookId === item.bookId) === index_,
  370: bookId: review.bookId,
  378: bookId: review.bookId,
  386: bookId: review.bookId,
  395: // One review per (book, customer): walk the customer list until a free slot
  401: const owner = customers.find((c) => !taken.has(`${entry.bookId}:${c.id}`));
  404: taken.add(`${entry.bookId}:${owner.id}`);
  407: bookId: entry.bookId,
```


## ج. طبقة البيانات والأنواع والإجراءات

### `src/app/actions/admin.ts` — 88 سطر

```text
    9: searchBookPicks,
   47: import { refreshBookRating } from "@/lib/book-rating";
   75: BookTag,
  100: * A title is not a name: «الرياضيات» is a book for every grade, and each
  165: books?: Prisma.BookWhereInput;
  170: where.books
  171: ? prisma.book.count({ where: { ...where.books, archivedAt: archived ? { not: null } : null } })
  178: ]).then(([books, handouts]) => books + handouts);
  187: /* Books                                                               */
  234: export async function saveBook(formData: FormData): Promise<ActionResult> {
  248: const bookId = text(formData, "bookId");
  252: const dropCover = Boolean(bookId) && !cover.file && checkbox(formData, "removeCover");
  262: * title, changing the book's public URL out from under any link to it.
  272: tags: formData.getAll("tags").filter((tag): tag is string => typeof tag === "string") as BookTag[],
  284: // The struck-through price is what the book cost before the discount, so
  309: coverUrl = await storeCover("books", cover.file);
  311: logActionError("saveBook (cover)", error, { bookId: bookId || null });
  321: if (bookId) {
  323: const current = await prisma.book.findUnique({
  324: where: { id: bookId },
  329: await prisma.book.update({
  330: where: { id: bookId, ...shelf.guard },
  336: * here and never touched again — suffixed when another book already
  340: slugify(titleAr, `book-${Date.now()}`),
  341: "books_slug_key",
  343: prisma.book.findMany({ where: { slug: { startsWith: base } }, select: { slug: true } }),
  344: (slug) => prisma.book.create({ data: { ...data, coverUrl, slug } }),
  353: * while the form was open, and a missing record the book itself — or,
  363: const stillThere = bookId && "stock" in shelf.guard && (await prisma.book.count({ where: { id: bookId } }));
  366: logActionError("saveBook", error, { bookId: bookId || null });
  374: revalidatePath("/admin/books");
  378: export async function deleteBook(bookId: string): Promise<ActionResult> {
  381: // An ordered book stays for the order's sake; archiving is how it leaves.
  382: const ordered = await prisma.orderItem.count({ where: { bookId } });
  385: const deleted = await attemptDelete("deleteBook", { bookId }, () =>
  386: prisma.book.delete({ where: { id: bookId }, select: { coverUrl: true } }),
  392: revalidatePath("/admin/books");
  397: * Takes a book off sale, or puts it back, without deleting it.
  405: export async function setBookArchived(
  406: bookId: string,
  413: prisma.book.update({
  414: where: { id: bookId },
  417: ...(archived ? [prisma.cartItem.deleteMany({ where: { bookId } })] : []),
  421: logActionError("setBookArchived", error, { bookId, archived: String(archived) });
  427: revalidatePath("/admin/books");
  428: revalidatePath(`/admin/books/${bookId}`);
  436: /** `saveBook` over the handouts table — the form and its fields are the same. */
  452: // A cover removed on an edit, unless a new file came with it — as in `saveBook`.
  456: // same reason they are in `saveBook` — an edit must not regenerate them.
  465: tags: formData.getAll("tags").filter((tag): tag is string => typeof tag === "string") as BookTag[],
  482: // Upload first, write second, tidy up whichever one lost — as in `saveBook`.
  511: // Suffixed when another handout carries the same title — as in `saveBook`.
  524: // logged — as in `saveBook`.
  545: // As with books: an ordered handout stays, and archiving is how it leaves.
  559: /** `setBookArchived` over the handouts table and its cart. */
  662: /* The slug left the form; see the note in `saveBook` for why it is absent
  667: icon: text(formData, "icon") || "BookOpen",
  687: is for a book: say so, and let the form draw the page again, rather
  709: const held = await titlesHolding({ books: { categoryId } });
  749: icon: text(formData, "icon") || "BookOpen",
  842: /* A handout's page names its teacher too, and is cached like a book's: a
  854: as the books one, and a teacher with only handouts is the common case. */
  855: const held = await titlesHolding({ books: { authorId }, handouts: { authorId } });
  914: const held = await titlesHolding({ books: { publisherId }, handouts: { publisherId } });
  944: * time a delivery is called off. Once an order ships the books have physically
  971: items: { select: { bookId: true, quantity: true } },
 1015: await takeFromShelf(tx, "book", item.bookId, item.quantity);
 1017: await tx.book.update({
 1018: where: { id: item.bookId },
 1060: * A delivered order is refused outright: money changed hands and the books
 1073: items: { select: { bookId: true, quantity: true } },
 1097: prisma.book.update({
 1098: where: { id: item.bookId },
 1132: select: { bookId: true },
 1138: await refreshBookRating(tx, review.bookId);
 1420: * the dictionary if the dictionary is edited later. The picked books are
 1487: const featuredBookId = text(formData, "featuredBookId");
 1491: const wanted = [...new Set([featuredBookId, ...showcaseIds].filter(Boolean))];
 1494: const found = await prisma.book.count({ where: { id: { in: wanted }, archivedAt: null } });
 1495: if (found !== wanted.length) return { ok: false, error: "unknownBook" };
 1504: { key: HERO_KEYS.featuredBook, value: featuredBookId || null },
 1531: book: (ids) => prisma.book.count({ where: { id: { in: ids }, archivedAt: null } }),
 1539: book: "unknownBook",
 1588: * What the book pickers on the home page forms search through. Reachable
 1592: export async function searchHomeBooks(
 1599: return searchBookPicks(safeTerm, safeExclude);
 1622: return searchAuthorPicks(safeTerm, home.authors.booksCount, safeExclude);
 1636: { books: home.authors.booksCount, handouts: searchPage.handoutsCount },
```

### `src/data/account.ts` — 20 سطر

```text
   58: { bookId: "b5", quantity: 1 },
   59: { bookId: "b12", quantity: 2 },
   60: { bookId: "b16", quantity: 1 },
   63: export const wishlistBookIds = ["b1", "b7", "b9", "b23", "b24", "b28"];
   65: // Seed shapes from before handouts existed: these orders carry book lines only.
   73: { bookId: "b9", quantity: 1, unitPrice: 19000 },
   74: { bookId: "b13", quantity: 1, unitPrice: 14000 },
   96: { bookId: "b5", quantity: 1, unitPrice: 26000 },
   97: { bookId: "b16", quantity: 2, unitPrice: 10000 },
   98: { bookId: "b29", quantity: 1, unitPrice: 12000 },
  119: items: [{ bookId: "b23", quantity: 1, unitPrice: 30000 }],
  139: items: [{ bookId: "b7", quantity: 1, unitPrice: 35000 }],
  158: bookId: "b9",
  159: bookTitle: { ar: "فرانكشتاين في بغداد" },
  171: bookId: "b13",
  172: bookTitle: { ar: "1984" },
  184: bookId: "b5",
  185: bookTitle: { ar: "ثلاثية غرناطة" },
  197: bookId: "b16",
  198: bookTitle: { ar: "الأمير الصغير" },
```

### `src/data/admin.ts` — 38 سطر

```text
   14: TopBookStat,
   73: // Seeded orders hold books only; handout lines arrive through the storefront.
  210: { bookId: "b23", quantity: 1, unitPrice: 30000 },
  211: { bookId: "b1", quantity: 2, unitPrice: 15000 },
  224: items: [{ bookId: "b25", quantity: 1, unitPrice: 40000 }],
  237: { bookId: "b16", quantity: 3, unitPrice: 10000 },
  238: { bookId: "b29", quantity: 1, unitPrice: 12000 },
  251: items: [{ bookId: "b19", quantity: 1, unitPrice: 18000 }],
  264: { bookId: "b24", quantity: 1, unitPrice: 28000 },
  265: { bookId: "b26", quantity: 1, unitPrice: 27000 },
  278: items: [{ bookId: "b7", quantity: 1, unitPrice: 35000 }],
  291: { bookId: "b12", quantity: 1, unitPrice: 24000 },
  292: { bookId: "b13", quantity: 1, unitPrice: 14000 },
  293: { bookId: "b14", quantity: 1, unitPrice: 13000 },
  306: items: [{ bookId: "b28", quantity: 1, unitPrice: 32000 }],
  317: bookId: "b9",
  318: bookTitle: { ar: "فرانكشتاين في بغداد" },
  330: bookId: "b16",
  331: bookTitle: { ar: "الأمير الصغير" },
  343: bookId: "b1",
  344: bookTitle: { ar: "موسم الهجرة إلى الشمال" },
  356: bookId: "b27",
  357: bookTitle: { ar: "العادات السبع" },
  369: bookId: "b23",
  370: bookTitle: { ar: "الأعمال الشعرية الكاملة" },
  382: bookId: "b13",
  383: bookTitle: { ar: "1984" },
  395: bookId: "b12",
  396: bookTitle: { ar: "مئة عام من العزلة" },
  408: bookId: "b5",
  409: bookTitle: { ar: "ثلاثية غرناطة" },
  436: export const topBooks: TopBookStat[] = [
  437: { bookId: "b16", sold: 184, revenue: 1840000 },
  438: { bookId: "b1", sold: 152, revenue: 2280000 },
  439: { bookId: "b12", sold: 131, revenue: 3144000 },
  440: { bookId: "b19", sold: 118, revenue: 2124000 },
  441: { bookId: "b27", sold: 97, revenue: 2134000 },
  459: books: { value: 1467, change: 1.2 },
```

### `src/data/authors.ts` — 25 سطر

```text
   11: booksCount: 34,
   21: booksCount: 7,
   31: booksCount: 12,
   41: booksCount: 11,
   51: booksCount: 15,
   61: booksCount: 9,
   71: booksCount: 6,
   81: booksCount: 5,
   91: booksCount: 18,
  101: booksCount: 22,
  111: booksCount: 14,
  121: booksCount: 19,
  131: booksCount: 8,
  141: booksCount: 6,
  151: booksCount: 10,
  161: booksCount: 9,
  171: booksCount: 7,
  181: booksCount: 13,
  191: booksCount: 10,
  201: booksCount: 30,
  211: booksCount: 5,
  221: booksCount: 12,
  231: booksCount: 8,
  241: booksCount: 11,
  251: booksCount: 4,
```

### `src/data/categories.ts` — 14 سطر

```text
   17: icon: "BookOpen",
   20: booksCount: 428,
   32: booksCount: 176,
   44: booksCount: 214,
   56: booksCount: 132,
   63: ar: "قصص مصوّرة وكتب مدرسية للأطفال واليافعين",
   68: booksCount: 189,
   80: booksCount: 154,
   92: booksCount: 98,
  104: booksCount: 76,
  108: /** The school ladder, filed as the textbook catalogue reads it. */
  110: grade: (grade) => `الكتب المدرسية للصف ${grade}`,
  111: branch: (branch, grade) => `الكتب المدرسية للفرع ${branch} من الصف ${grade}`,
  116: booksCount: 0,
```

### `src/data/handout-categories.ts` — 1 سطر

```text
   16: icon: "BookOpen",
```

### `src/data/handouts.ts` — 2 سطر

```text
    6: * Seed input for the handouts table, shaped like `SeedBook`: the publisher is
   12: * Three lecture-note booklets (ملازم) so the catalogue has something on its
```

### `src/data/reviews.ts` — 8 سطر

```text
    7: bookId: "b1",
   18: bookId: "b1",
   29: bookId: "b1",
   40: bookId: "b9",
   51: bookId: "b9",
   62: bookId: "b12",
   73: bookId: "b16",
   84: bookId: "b27",
```

### `src/lib/category-menu.ts` — 1 سطر

```text
   24: /** The nav label, "الكتب المدرسية" or "الملازم". */
```

### `src/lib/cover-image.ts` — 1 سطر

```text
   12: export const COVER_BUCKET = "Books Covers";
```

### `src/lib/cover-storage.ts` — 1 سطر

```text
  123: folder: "books" | "handouts",
```

### `src/lib/handout-rating.ts` — 1 سطر

```text
    5: * reviews — `refreshBookRating` over the handout tables. Called inside the
```

### `src/lib/home-sections.ts` — 9 سطر

```text
   83: publishers: ["handoutsTitle", "handoutsSubtitle", "booksTitle", "booksSubtitle"],
   84: authors: ["title", "subtitle", "booksCount"],
  156: export type ShelfKind = "book" | "category" | "author" | "publisher";
  175: bestsellers: { kind: "book", limit: 10, max: 20 },
  177: newArrivals: { kind: "book", limit: 5, max: 20 },
  311: primaryHref: "/books",
  316: featuredBook: "home.hero.featuredBookId",
  324: featuredBookId: string | null;
  333: featuredBookId: settings[HERO_KEYS.featuredBook] || null,
```

### `src/lib/navigation.ts` — 2 سطر

```text
    7: tree?: "books" | "handouts";
   14: { href: "/books", label: nav.books, tree: "books" },
```

### `src/lib/picks.ts` — 14 سطر

```text
    3: import type { Author, BookWithRelations, Category, PickOption, Publisher } from "@/types";
    5: /** A book as one of the panel's pickers lists it. */
    6: export function bookPick(book: BookWithRelations, locale: Locale): PickOption {
    8: id: book.id,
    9: label: book.title[locale],
   10: sublabel: book.author.name[locale],
   11: seed: book.slug,
   12: picture: { kind: "jacket", src: book.coverUrl },
   28: export function authorPick(author: Author, locale: Locale, booksLabel: string): PickOption {
   32: sublabel: `${formatNumber(author.booksCount, locale)} ${booksLabel}`,
   39: * A publisher as the picker lists it. The second line is the school-book
   40: * count, which is what `booksLabel` names; the search results say more.
   42: export function publisherPick(publisher: Publisher, locale: Locale, booksLabel: string): PickOption {
   46: sublabel: `${formatNumber(publisher.booksCount, locale)} ${booksLabel}`,
```

### `src/lib/revalidate.ts` — 8 سطر

```text
    7: * its route *file*, route group included — `/books/imarat-yacoubian` is
    8: * tagged `_N_T_/(storefront)/books/[slug]/page` — and one for its own URL,
    9: * `_N_T_/books/imarat-yacoubian`. `revalidatePath` builds one tag from what
   13: * So `revalidatePath("/books/[slug]", "page")` names a file that does not
   15: * nothing; and `revalidatePath("/books", "page")` asks for a file tag where
   30: revalidatePath("/books");
   31: revalidatePath("/(storefront)/books/[slug]", "page");
   56: * publisher pages carry a handouts section under their books — as does the
```

### `src/lib/wishlist-store.ts` — 5 سطر

```text
    7: * Which books the reader has saved, shared by every heart on the page.
   60: /** Applies a toggle locally so every heart for that book updates at once. */
   61: export function setWishlistSaved(bookId: string, next: boolean) {
   65: updated.add(bookId);
   67: updated.delete(bookId);
```

### `src/types/index.ts` — 25 سطر

```text
    6: export type BookTag = "bestseller" | "new" | "featured" | "award";
    9: * A branch of the school-book tree: a stage, a grade under it, a branch under
   24: booksCount: number;
   80: booksCount: number;
   91: booksCount: number;
   96: export interface Book {
  113: tags: BookTag[];
  123: bookId: string;
  131: /** A book joined with its author and category, ready for the UI. */
  132: export interface BookWithRelations extends Book {
  139: * A lecture-note booklet (ملزمة). Shaped exactly like `Book` and stored in
  160: tags: BookTag[];
  225: /** Copies across every non-cancelled order, books and handouts alike. */
  231: bookId: string;
  269: bookId: string;
  273: /** A cart line joined with its book, ready for the UI. */
  274: export interface CartLineWithBook extends CartLine {
  275: book: BookWithRelations;
  310: /** A review plus its moderation status and the book it belongs to. */
  314: bookTitle: Localized;
  334: export interface TopBookStat {
  335: bookId: string;
  355: books: AdminMetric;
  400: /** The subject line: an order reference, a book title, a reviewer. */
  410: /** A book: its cover, or the typographic placeholder when it has none. */
```


## د. الصفحات المشتركة (متجر + إدارة + API)

### `src/app/(admin)/admin/authors/page.tsx` — 3 سطر

```text
   70: <Th>{t.table.books}</Th>
  101: count={author.booksCount}
  102: notes={[{ count: archived.books.get(author.id) ?? 0, label: admin.common.archivedCount }]}
```

### `src/app/(admin)/admin/categories/page.tsx` — 3 سطر

```text
   67: <Th>{t.table.books}</Th>
   98: count={category.booksCount}
  103: (sum, node) => sum + (archived.books.get(node.id) ?? 0),
```

### `src/app/(admin)/admin/handout-reviews/page.tsx` — 1 سطر

```text
   43: /** The moderation queue for handout reviews — the book queue over the other table. */
```

### `src/app/(admin)/admin/layout.tsx` — 1 سطر

```text
   79: action="/admin/books"
```

### `src/app/(admin)/admin/publishers/page.tsx` — 3 سطر

```text
   70: <Th>{t.table.books}</Th>
  101: count={publisher.booksCount}
  102: notes={[{ count: archived.books.get(publisher.id) ?? 0, label: admin.common.archivedCount }]}
```

### `src/app/(admin)/admin/reports/page.tsx` — 14 سطر

```text
   16: getTopBooks,
   63: getTopBooks(),
  204: title={t.topBooks.title}
  205: subtitle={t.topBooks.subtitle}
  212: <Th>{admin.books.table.book}</Th>
  213: <Th className="w-24">{admin.dashboard.topBooks.sold}</Th>
  214: <Th className="w-40">{admin.dashboard.topBooks.revenue}</Th>
  219: <Tr key={entry.bookId}>
  222: href={`/admin/books/${entry.bookId}`}
  225: {entry.book.title[locale]}
  228: {entry.book.category.name[locale]}
  243: the pinned column widths keep its rows in line with the books'. */}
  249: <Th className="w-24">{admin.dashboard.topBooks.sold}</Th>
  250: <Th className="w-40">{admin.dashboard.topBooks.revenue}</Th>
```

### `src/app/(admin)/admin/reviews/page.tsx` — 4 سطر

```text
  102: <Th>{t.table.book}</Th>
  130: href={`/admin/books/${review.bookId}`}
  133: {review.bookTitle[locale]}
  167: bookTitle={review.bookTitle[locale]}
```

### `src/app/(admin)/admin/settings/home/[section]/page.tsx` — 10 سطر

```text
   16: getBooksByIds,
   39: import { authorPick, bookPick, categoryPick, publisherPick } from "@/lib/picks";
   69: case "book":
   70: return (await getBooksByIds(ids)).map((book) => bookPick(book, locale));
   75: authorPick(author, locale, texts.authors.booksCount),
   79: publisherPick(publisher, locale, texts.authors.booksCount),
  110: getBooksByIds(hero.featuredBookId ? [hero.featuredBookId] : []),
  111: getBooksByIds(hero.showcaseIds),
  120: featured={featured ? bookPick(featured, locale) : null}
  121: showcase={showcase.map((book) => bookPick(book, locale))}
```

### `src/app/(admin)/admin/settings/page.tsx` — 1 سطر

```text
  100: defaultValue={saved("taglineAr", "مكتبة ومتجر كتب مدرسية")}
```

### `src/app/(auth)/register/page.tsx` — 1 سطر

```text
   12: * pointing at it — a bookmark, a link in a message — should still arrive
```

### `src/app/(storefront)/account/orders/[id]/page.tsx` — 13 سطر

```text
    6: import { BookCover } from "@/components/book/book-cover";
    7: import { TitleLink } from "@/components/book/title-link";
  162: <li key={item.bookId} className="flex items-center gap-4 p-5">
  164: <BookCover
  165: title={item.book.title[locale]}
  166: author={item.book.author.name[locale]}
  167: seed={item.book.slug}
  168: src={item.book.coverUrl}
  176: href={`/books/${item.book.slug}`}
  177: archived={item.book.archived}
  181: {item.book.title[locale]}
  184: {dictionary.common.by} {item.book.author.name[locale]}
  198: <BookCover
```

### `src/app/(storefront)/account/orders/page.tsx` — 1 سطر

```text
   44: actionHref={`/books`}
```

### `src/app/(storefront)/account/reviews/page.tsx` — 18 سطر

```text
    4: import { BookCover } from "@/components/book/book-cover";
    5: import { TitleLink } from "@/components/book/title-link";
   58: actionHref={`/books`}
   80: href={`/books/${review.book.slug}`}
   81: archived={review.book.archived}
   83: aria-label={review.book.title[locale]}
   85: <BookCover
   86: title={review.book.title[locale]}
   87: author={review.book.author.name[locale]}
   88: seed={review.book.slug}
   89: src={review.book.coverUrl}
   98: <span className="label-mono block text-muted">{t.onBook}</span>
  100: href={`/books/${review.book.slug}`}
  101: archived={review.book.archived}
  105: {review.book.title[locale]}
  142: itemName={review.book.title[locale]}
  158: {/* The reader's handout reviews, in the same card, after the books. */}
  168: <BookCover
```

### `src/app/(storefront)/account/wishlist/page.tsx` — 12 سطر

```text
    4: import { BookGrid } from "@/components/book/book-grid";
   29: const [dictionary, allBooks, allHandouts] = await Promise.all([
   35: const books = previewEmpty ? [] : allBooks;
   40: if (!books.length && !handouts.length) {
   47: actionHref={`/books`}
   58: {books.length ? (
   60: <span data-numeric>{formatNumber(books.length, locale)}</span>{" "}
   64: {books.length && handouts.length ? " · " : null}
   81: {books.length ? (
   82: <BookGrid
   83: books={books}
   99: priority={!books.length}
```

### `src/app/(storefront)/cart/page.tsx` — 4 سطر

```text
   37: // The cart has two halves — books and handouts — shown as one list.
  109: key={line.bookId}
  126: href={`/books`}
  214: actionHref={`/books`}
```

### `src/app/(storefront)/categories/[slug]/page.tsx` — 8 سطر

```text
    4: import { BookCatalogue } from "@/components/book/book-catalogue";
   16: queryBooks,
   21: import { parseBookQuery, toBookQuery } from "@/lib/book-query";
   68: const parsed = parseBookQuery(await searchParams);
   72: * answers to the same slug, its handouts get a shelf under the books, to
   82: queryBooks(toBookQuery(parsed, { category: slug })),
   86: ? await queryHandouts(toBookQuery(parsed, { category: slug, page: 1, perPage: 10 }))
  124: <BookCatalogue
```

### `src/app/(storefront)/handouts/categories/[slug]/page.tsx` — 4 سطر

```text
   18: import { parseBookQuery, toBookQuery } from "@/lib/book-query";
   50: * One branch of the handouts' tree at any depth — the books' branch page over
   67: const parsed = parseBookQuery(await searchParams);
   75: queryHandouts(toBookQuery(parsed, { category: slug })),
```

### `src/app/(storefront)/not-found.tsx` — 2 سطر

```text
   19: "الرابط الذي فتحته غير صحيح أو أن الصفحة نُقلت. يمكنك العودة إلى الرئيسية أو البحث عن كتاب مدرسي.",
   21: search: "ابحث عن كتاب مدرسي",
```

### `src/app/(storefront)/offers/page.tsx` — 6 سطر

```text
    3: import { BookCatalogue } from "@/components/book/book-catalogue";
    6: import { getCategories, getPriceBounds, getPublishers, queryBooks } from "@/data";
    9: import { parseBookQuery, toBookQuery } from "@/lib/book-query";
   25: const parsed = parseBookQuery(await searchParams);
   32: queryBooks(toBookQuery(parsed, { onSale: true })),
   49: <BookCatalogue
```

### `src/app/api/admin/reports/csv/route.ts` — 4 سطر

```text
    7: getTopBooks,
   39: getTopBooks(),
   47: ["book", "copies_sold", "revenue_iqd"],
   48: ...top.map((entry) => [entry.book.title[locale], entry.sold, entry.revenue]),
```


## هـ. المكوّنات المشتركة

### `src/components/admin/admin-nav.tsx` — 7 سطر

```text
    5: BookOpen,
   11: NotebookPen,
   12: NotebookText,
   32: books: string;
   76: { href: `${base}/books`, label: labels.books, icon: BookOpen },
   77: { href: `${base}/handouts`, label: labels.handouts, icon: NotebookText },
   90: { href: `${base}/handout-reviews`, label: labels.handoutReviews, icon: NotebookPen },
```

### `src/components/admin/author-form.tsx` — 1 سطر

```text
   23: * is picked from the school-books category tree, indented the way the
```

### `src/components/admin/cover-field.tsx` — 2 سطر

```text
   13: labels: AdminDictionary["bookForm"]["upload"];
   29: * The cover picker for the book and handout forms.
```

### `src/components/admin/handout-form.tsx` — 6 سطر

```text
    6: import { BookCover } from "@/components/book/book-cover";
   18: BookTag,
   42: const tagOptions: BookTag[] = ["bestseller", "new", "featured", "award"];
   44: /** One form serves both "add handout" and "edit handout" — `BookForm` over the handouts table, ending on the list after an add as it does. */
   81: missingTitle: dictionary.common.actionErrors.missingBookTitle,
  244: <BookCover
```

### `src/components/admin/home-hero-fields.tsx` — 7 سطر

```text
    1: import { searchHomeBooks } from "@/app/actions/admin";
   25: * The opening section's fields: its copy on one side, the two book pickers
   39: const pickerLabels: PickListLabels = { ...t.picker, search: t.picker.searchBooks };
   89: <Panel title={h.featuredBook} subtitle={h.featuredBookHint}>
   91: name="featuredBookId"
   94: search={searchHomeBooks}
  105: search={searchHomeBooks}
```

### `src/components/admin/home-section-form.tsx` — 1 سطر

```text
   42: unknownBook: dictionary.common.actionErrors.unknownBook,
```

### `src/components/admin/home-shelf-fields.tsx` — 2 سطر

```text
    3: searchHomeBooks,
   36: book: searchHomeBooks,
```

### `src/components/admin/pick-list.tsx` — 2 سطر

```text
   14: import { BookCover } from "@/components/book/book-cover";
  322: <BookCover
```

### `src/components/author/author-card.tsx` — 5 سطر

```text
   32: booksLabel: string;
   38: * laid out along the line rather than stacked. The country and the book count
   41: export function AuthorCard({ author, locale, booksLabel, className }: AuthorCardProps) {
   67: <span data-numeric>{formatNumber(author.booksCount, locale)}</span>{" "}
   68: {booksLabel}
```

### `src/components/category/branch-card.tsx` — 13 سطر

```text
    4: import { BookCover } from "@/components/book/book-cover";
    9: import type { BookWithRelations, CategoryNode } from "@/types";
   14: books: BookWithRelations[];
   25: export function BranchCard({ branch, books, locale, dictionary }: BranchCardProps) {
   67: {books.length ? (
   69: {books.map((book) => (
   70: <li key={book.id} className="w-16">
   71: <BookCover
   72: title={book.title[locale]}
   73: author={book.author.name[locale]}
   74: seed={book.slug}
   75: src={book.coverUrl}
   87: {formatNumber(branch.booksCount, locale)} {dictionary.home.categories.count}
```

### `src/components/category/branch-strip.tsx` — 1 سطر

```text
   48: {formatNumber(branch.booksCount, locale)} {countLabel}
```

### `src/components/commerce/cart-line-row.tsx` — 21 سطر

```text
    3: import { BookCover } from "@/components/book/book-cover";
   10: import type { CartLineWithBook } from "@/types";
   13: line: CartLineWithBook;
   18: /** One book in the cart: cover, meta, quantity control and line total. */
   20: const { book } = line;
   25: href={`/books/${book.slug}`}
   27: aria-label={book.title[locale]}
   29: <BookCover
   30: title={book.title[locale]}
   31: author={book.author.name[locale]}
   32: seed={book.slug}
   33: src={book.coverUrl}
   43: {book.category.name[locale]}
   47: href={`/books/${book.slug}`}
   50: {book.title[locale]}
   54: {dictionary.by} {book.author.name[locale]}
   59: bookId={book.id}
   62: bookTitle={book.title[locale]}
   69: bookId={book.id}
   71: max={Math.max(book.stock, 1)}
   87: {formatPrice(book.price, locale)} × {line.quantity}
```

### `src/components/commerce/purchase-controls.tsx` — 3 سطر

```text
   11: kind: "book" | "handout";
   73: {kind === "book" ? (
   74: <AddToCartButton bookId={id} {...button} />
```

### `src/components/handout/handout-branch-card.tsx` — 2 سطر

```text
    4: import { BookCover } from "@/components/book/book-cover";
   75: <BookCover
```

### `src/components/handout/handout-card.tsx` — 3 سطر

```text
    3: import { BookCover } from "@/components/book/book-cover";
   26: * The shelf card for a handout — `BookCard` pointed at `/handouts`, with the
   51: <BookCover
```

### `src/components/handout/handout-cart-line-row.tsx` — 2 سطر

```text
    3: import { BookCover } from "@/components/book/book-cover";
   29: <BookCover
```

### `src/components/handout/handout-catalogue.tsx` — 7 سطر

```text
    3: import { BookFilters, type BookFilterValues } from "@/components/book/book-filters";
    4: import { FilterSheet } from "@/components/book/filter-sheet";
    5: import { SortSelect } from "@/components/book/sort-select";
   25: values: BookFilterValues;
   34: * The filter panel, the sort control and the sheet are the book ones: they
   35: * carry nothing book-specific, and the same query string drives both tables.
   75: <BookFilters
```

### `src/components/handout/handout-grid.tsx` — 1 سطر

```text
   17: /** The handouts grid — same spacing and breakpoints as the book grid. */
```

### `src/components/handout/handout-quantity-stepper.tsx` — 2 سطر

```text
   25: * `QuantityStepper` in its writing mode, for a handout cart line. The book
   26: * stepper stays local when it has no `bookId`; the handout detail page uses
```

### `src/components/handout/handout-review-form.tsx` — 1 سطر

```text
    7: import type { ReviewFormLabels } from "@/components/book/review-form";
```

### `src/components/handout/handout-shelf.tsx` — 2 سطر

```text
   17: /** Sets the shelf on the tinted band, the way `BookShelf` does. */
   24: /** A titled row of handout cards — `BookShelf` for the other catalogue. */
```

### `src/components/home/authors-spotlight.tsx` — 1 سطر

```text
   41: booksLabel={section.booksCount}
```

### `src/components/home/category-tiles.tsx` — 1 سطر

```text
   60: {formatNumber(category.booksCount, locale)} {section.count}
```

### `src/components/home/hero-showcase.tsx` — 5 سطر

```text
   19: import { BookCover } from "@/components/book/book-cover";
  251: href={`/books/${slide.slug}`}
  255: <BookCover
  317: <BookCover
  359: href={`/books/${slide.slug}`}
```

### `src/components/home/hero.tsx` — 16 سطر

```text
   10: import type { BookWithRelations } from "@/types";
   16: featuredBook?: BookWithRelations;
   18: showcase: BookWithRelations[];
   35: featuredBook,
   42: const slides: HeroSlide[] = showcase.map((book) => ({
   43: id: book.id,
   44: slug: book.slug,
   45: title: book.title[locale],
   46: author: book.author.name[locale],
   47: authorSlug: book.author.slug,
   48: coverUrl: book.coverUrl,
   49: description: book.description[locale],
   62: The reference's "what's new" tagline, with the book of the week
   66: {featuredBook ? (
   68: href={`/books/${featuredBook.slug}`}
   81: <span className="truncate text-on-surface-variant">{featuredBook.title[locale]}</span>
```

### `src/components/home/publisher-shelves.tsx` — 10 سطر

```text
    3: import { BookShelf } from "@/components/book/book-shelf";
   18: * its latest school books, each drawn exactly as the new-arrivals shelf is
   28: return shelves.flatMap(({ publisher, handouts, books }) => {
   48: if (books.length) {
   50: <BookShelf
   51: key={`${publisher.id}-books`}
   52: title={fillPublisherText(texts.booksTitle, name)}
   53: subtitle={fillPublisherText(texts.booksSubtitle, name)}
   54: books={books}
   57: actionHref={`/books?publisher=${publisher.slug}`}
```

### `src/components/layout/storefront-footer.tsx` — 2 سطر

```text
   32: { label: footer.shop.newArrivals, href: `/books?sort=newest` },
   33: { label: footer.shop.bestsellers, href: `/books?sort=popular` },
```

### `src/components/publisher/publisher-card.tsx` — 3 سطر

```text
   23: booksLabel: string;
   30: booksLabel,
   57: {formatNumber(publisher.booksCount, locale)} {booksLabel}
```

### `src/components/ui/category-icon.tsx` — 5 سطر

```text
    4: BookMarked,
    5: BookOpen,
   27: BookMarked,
   28: BookOpen,
   51: const Icon = icons[name] ?? BookOpen;
```


## و. القواميس والنصوص

### `src/i18n/config.ts` — 2 سطر

```text
    9: * The `[locale]` URL segment went with it — `/ar/books` is `/books` now. The
   10: * store had never been published, so no bookmark or inbound link pointed at
```

### `src/i18n/dictionaries/admin.ar.json` — 37 سطر

```text
   12: "books": "الكتب المدرسية",
   85: "books": "العناوين"
   95: "topBooks": {
  114: "subtitle": "نصيب كل فرع رئيسي من مبيعات الكتب المدرسية",
  118: "books": {
  119: "title": "إدارة الكتب المدرسية",
  121: "add": "إضافة كتاب مدرسي",
  124: "book": "الكتاب المدرسي",
  147: "title": "لا توجد كتب مدرسية مطابقة",
  152: "bookForm": {
  153: "addTitle": "إضافة كتاب مدرسي",
  202: "bookDetails": {
  337: "subtitle": "شجرة الكتب المدرسية: مراحل وصفوف وفروع، وما تضيفه تحتها",
  342: "books": "عدد الكتب المدرسية",
  363: "subtitle": "شجرة الملازم: مراحل وصفوف وفروع مستقلة عن شجرة الكتب المدرسية",
  393: "books": "عدد الكتب المدرسية",
  401: "subjectHint": "فرع من شجرة تصنيفات الكتب المدرسية",
  411: "subtitle": "الجهات التي تأتي منها الكتب المدرسية للمتجر",
  415: "books": "عدد الكتب المدرسية",
  488: "book": "الكتاب المدرسي",
  623: "subtitle": "حصة كل فرع رئيسي من مبيعات الكتب المدرسية",
  626: "topBooks": {
  672: "description": "رف الكتب المدرسية الأكثر طلبًا"
  688: "description": "لكل مطبعة أو مكتبة رفّ لملازمها ورفّ لكتبها المدرسية"
  692: "description": "المدرسون مع عدد الكتب المدرسية لكلٍّ منهم"
  714: "searchBooks": "ابحث عن كتاب مدرسي…"
  725: "featuredBook": "الكتاب المدرسي للأسبوع",
  726: "featuredBookHint": "يظهر في الشريط فوق العنوان. إن لم تختر كتابًا مدرسيًا يُعرض أكثر الكتب المدرسية الموسومة «مميّز» تقييمًا.",
  745: "booksCount": "كلمة عدد الكتب المدرسية",
  748: "booksTitle": "عنوان رف الكتب المدرسية",
  749: "booksSubtitle": "العنوان الفرعي لرف الكتب المدرسية"
  759: "book": {
  760: "content": "الكتب المدرسية المعروضة",
  761: "limit": "عدد الكتب المدرسية",
  762: "manualNote": "كتب مدرسية تختارها بنفسك، بالترتيب الذي تحدّده",
  763: "search": "ابحث عن كتاب مدرسي…"
  785: "bestsellers": "أكثر الكتب المدرسية الموسومة «الأكثر مبيعًا» تقييمًا",
```

### `src/i18n/dictionaries/ar.json` — 50 سطر

```text
    4: "tagline": "مكتبة ومتجر كتب مدرسية"
   76: "bookPublished": "نُشر الكتاب المدرسي",
   88: "stockChanged": "تغيّرت الكمية المتوفرة لأحد الكتب المدرسية",
  129: "missingBookTitle": "العنوان مطلوب — لا يكفي أن يكون مسافات فقط",
  159: "unknownBook": "أحد الكتب المدرسية المختارة لم يعد في المكتبة",
  165: "hasTitles": "تنتمي إليه كتب مدرسية أو ملازم — انقلها إلى غيره من صفحة تعديلها أو احذفها أولًا",
  166: "hasArchivedTitles": "تنتمي إليه عناوين مؤرشفة لا تظهر في المتجر — تجدها في تبويب «المؤرشفة» بقائمة الكتب المدرسية أو الملازم؛ انقلها إلى غيره أو احذفها أولًا",
  172: "books": "الكتب المدرسية",
  180: "bookTree": "تصنيفات الكتب المدرسية",
  189: "primaryCta": "تصفّح الكتب المدرسية",
  225: "booksTitle": "الكتب المدرسية من {publisher}",
  226: "booksSubtitle": "آخر ما وصلنا من كتبها المدرسية"
  242: "booksCount": "كتاب مدرسي"
  252: "books": {
  253: "title": "كل الكتب المدرسية",
  277: "title": "لا توجد كتب مدرسية مطابقة",
  284: "bookDetails": {
  317: "related": "كتب مدرسية مشابهة",
  390: "subtitle": "المراحل والصفوف التي تُرتَّب عليها الكتب المدرسية",
  409: "booksBy": "الكتب المدرسية للمدرس",
  412: "booksCount": "عدد الكتب المدرسية"
  416: "subtitle": "الجهات التي تأتي منها الكتب المدرسية للمتجر",
  417: "booksBy": "الكتب المدرسية للمطبعة / المكتبة",
  419: "booksCount": "عدد الكتب المدرسية",
  425: "placeholder": "اكتب اسم كتاب مدرسي أو مدرس…",
  429: "action": "تصفّح كل الكتب المدرسية"
  456: "description": "لم تُضف أي كتاب مدرسي بعد. ابدأ من الأكثر مبيعًا.",
  457: "action": "تصفّح الكتب المدرسية"
  513: "pack": "نجهّز الكتب المدرسية ونغلّفها",
  527: "description": "احفظ الكتب المدرسية في المفضلة، تابع طلباتك، واحصل على توصيات مبنية على قراءاتك.",
  530: "point3": "تنبيه عند توفّر الكتب المدرسية الناقصة"
  606: "subtitle": "الكتب المدرسية التي حفظتها للرجوع إليها",
  607: "itemsCount": "كتاب مدرسي محفوظ",
  613: "description": "اضغط على أيقونة القلب في أي كتاب مدرسي لحفظه هنا.",
  614: "action": "تصفّح الكتب المدرسية"
  642: "subtitle": "ما كتبته عن الكتب المدرسية التي قرأتها",
  644: "onBook": "عن كتاب مدرسي",
  653: "description": "شارك رأيك في كتاب مدرسي قرأته لتساعد قُرّاءً آخرين.",
  654: "action": "تصفّح الكتب المدرسية"
  676: "body": "لا نعرض كل ما يُطبع. نختار الطبعات الجيدة والترجمات الموثوقة، ونكتب عن كل كتاب مدرسي بما يساعدك على القرار قبل الشراء."
  710: "title": "ماذا لو وصلني كتاب مدرسي تالف؟",
  714: "title": "هل الكتب المدرسية أصلية؟",
  718: "title": "هل يمكن طلب كتاب مدرسي غير متوفر؟",
  747: "body": "7 أيام من تاريخ الاستلام للكتب المدرسية التالفة أو المخالفة للطلب، مع الاحتفاظ بالغلاف والحالة الأصلية."
  750: "title": "كيف تُرجع كتابًا مدرسيًا",
  815: "subtitle": "نبحث عمّن يحب الكتب المدرسية والتفاصيل",
  823: "body": "أمين مخزن، مسؤول خدمة زبائن، ومحرر محتوى للكتب المدرسية. الدوام كامل ومقره بغداد."
  827: "body": "أرسل سيرتك الذاتية ونبذة قصيرة عن آخر كتاب مدرسي أعجبك عبر صفحة التواصل."
  834: "description": "الرابط الذي فتحته غير صحيح أو أن الصفحة نُقلت. يمكنك العودة إلى الرئيسية أو البحث عن كتاب مدرسي.",
  838: "about": "متجر كتب مدرسية عراقي يختار عناوينه بعناية، ويوصلها إلى كل محافظة مع الدفع عند الاستلام.",
```


## ز. الاختبارات

### `tests/fixtures/pages.ts` — 8 سطر

```text
   35: { id: "catalogue", path: () => "/books", ready: "main" },
   37: id: "book-detail",
   38: path: () => "/books/al-amir-al-saghir",
   41: // The handouts catalogue mirrors the books one, read from its own table.
   91: path: () => "/books/no-such-book",
  109: { id: "admin-books", path: () => "/admin/books", gated: true },
  148: // form, and the report. admin-books already covers the plain table.
  153: { id: "admin-book-new", path: () => "/admin/books/new", gated: true },
```

### `tests/functional/critical-paths.spec.ts` — 6 سطر

```text
   22: test("home lists books and categories", async ({ page }) => {
   27: await expect(page.locator('a[href^="/books/"]').first()).toBeVisible();
   61: test("book detail shows title, price and a cart control", async ({ page }) => {
   62: await page.goto("/books/al-amir-al-saghir", { waitUntil: "domcontentloaded" });
   78: await page.goto("/books?sort=newest", { waitUntil: "domcontentloaded" });
  131: await page.goto("/books", { waitUntil: "domcontentloaded" });
```


## ح. الوثائق والسكربتات وغيرها

### `docs/db-audit/00-inventory.md` — 43 سطر

```text
   67: | 4 | `books` | `CATALOG` | 20 | 0 | 0 | 184 kB |  |
  126: الحاويات الفعلية: `Books Covers` (عامة، النوع `STANDARD`، أُنشئت 2026-09-14، 3 ملف). أغلفة الكتب يرفعها `src/lib/cover-storage.ts` بمفتاح service-role.
  179: | `CATALOG` | الكتالوج | `public` | `categories`، `handout_categories`، `publishers`، `authors`، `books`، `handouts` | 6 | 50 |
  201: كتالوجان متوازيان بشجرتي تصنيف مستقلتين: **الكتب المدرسية** (`categories` ← `books`) و**الملازم** (`handout_categories` ← `handouts`)، يتشاركان جدولي البحث `aut
  234: `buckets` + `objects` هما المستخدمان (حاوية `Books Covers`: 3 ملف). `buckets_analytics`/`buckets_vectors`/`vector_indexes` أنواع حاويات أحدث، و`s3_multipart_upl
  252: | 3 | `books(authorId)` | `authors(id)` | RESTRICT | CASCADE | `books_authorId_fkey` |
  253: | 4 | `books(categoryId)` | `categories(id)` | RESTRICT | CASCADE | `books_categoryId_fkey` |
  254: | 5 | `books(publisherId)` | `publishers(id)` | RESTRICT | CASCADE | `books_publisherId_fkey` |
  255: | 6 | `cart_items(bookId)` | `books(id)` | CASCADE | CASCADE | `cart_items_bookId_fkey` |
  272: | 23 | `order_items(bookId)` | `books(id)` | RESTRICT | CASCADE | `order_items_bookId_fkey` |
  275: | 26 | `reviews(bookId)` | `books(id)` | CASCADE | CASCADE | `reviews_bookId_fkey` |
  277: | 28 | `wishlist_items(bookId)` | `books(id)` | CASCADE | CASCADE | `wishlist_items_bookId_fkey` |
  327: | `public.books.coverUrl` / `public.handouts.coverUrl` | `storage.objects` | رابط URL عام نصّي، لا مرجع لصفّ الملف |
  347: - الأعمدة من نوع مصفوفة (`tags "BookTag"[]`) nullable في القاعدة رغم أنها `BookTag[] @default([])` في Prisma — سلوك Prisma المعتاد مع المصفوفات.
  396: ### `books` — 20 عموداً، 0 صف، مجموعة `CATALOG`
  411: | 20 | `tags` | `"BookTag"[]` | نعم | `ARRAY[]` |
  426: | 2 | `bookId` 🔑 | `text` | لا |  |
  559: | 15 | `tags` | `"BookTag"[]` | نعم | `ARRAY[]` |
  592: | 3 | `bookId` | `text` | لا |  |
  636: | 2 | `bookId` | `text` | لا |  |
  658: | 2 | `bookId` 🔑 | `text` | لا |  |
  670: | `books` | `id` | `cuid` نصّي |
  671: | `cart_items` | `customerId`، `bookId` | مركّب (جدول ربط) |
  689: | `wishlist_items` | `customerId`، `bookId` | مركّب (جدول ربط) |
  697: | `books` | `books_compareAtPrice_above_price_check` | `CHECK ((("compareAtPrice" IS NULL) OR ("compareAtPrice" > price)))` |
  698: | `books` | `books_compareAtPrice_check` | `CHECK ((("compareAtPrice" IS NULL) OR ("compareAtPrice" >= 0)))` |
  699: | `books` | `books_pages_check` | `CHECK ((pages >= 1))` |
  700: | `books` | `books_price_check` | `CHECK ((price >= 0))` |
  701: | `books` | `books_publishedYear_check` | `CHECK (("publishedYear" >= 1))` |
  702: | `books` | `books_rating_check` | `CHECK (((rating >= (0)::double precision) AND (rating <= (5)::double precision)))` |
  703: | `books` | `books_reviewsCount_check` | `CHECK (("reviewsCount" >= 0))` |
  704: | `books` | `books_stock_check` | `CHECK ((stock >= 0))` |
  741: | `books` | `books_authorId_idx` | `("authorId")` |
  742: | `books` | `books_categoryId_idx` | `("categoryId")` |
  743: | `books` | `books_createdAt_idx` | `("createdAt")` |
  744: | `books` | `books_publisherId_idx` | `("publisherId")` |
  745: | `books` | `books_slug_key` | `UNIQUE (slug)` |
  746: | `cart_items` | `cart_items_bookId_idx` | `("bookId")` |
  773: | `order_items` | `order_items_bookId_idx` | `("bookId")` |
  782: | `reviews` | `reviews_bookId_customerId_key` | `UNIQUE ("bookId", "customerId")` |
  785: | `wishlist_items` | `wishlist_items_bookId_idx` | `("bookId")` |
  802: | `public` | `BookTag` | `bestseller`، `new`، `featured`، `award` |  |
  860: | 24 | `20260919090000_book_archive` | 2026-09-18 22:00:03 | 1 | — |
```

### `docs/token-audit.md` — 10 سطر

```text
  230: | Book-cover palette | Eight fixed colours for printed objects that must not invert with the UI. Kept, but re-derived from the generated brand ramp in Phase 6. 
  247: | 5 | Author line on book covers fails AA | `opacity-80` at 10px drops 3 of 8 palettes below 4.5 — from the Phase 1 accessibility baseline |
  331: The third was the long-standing book-cover defect. It was assigned to Phase 6,
  417: plus a hover rule — two lines. Their interiors have nothing in common: the book
  479: `getAdminBooks`, `getAdminOrders`, `getCustomers`, `getAdminReviews` — now
  582: bookshop: cream ground, beige bands, rounded corners, diffuse warm shadows,
  657: `h3` that wants the serif asks for `font-display` at the call site — the book
  736: The paper pass above was cut against a printed-paper bookshop. In September
  816: its `gold` tone; the hero eyebrow and the book tag that wore it take `muted`.
  896: Fluent's own `TabList` on the book page still draws its selected indicator.
```

### `scripts/db-audit-inventory.ts` — 4 سطر

```text
   43: CATALOG: { ar: "الكتالوج", tables: ["categories", "handout_categories", "publishers", "authors", "books", "handouts"] },
  672: p(`كتالوجان متوازيان بشجرتي تصنيف مستقلتين: **الكتب المدرسية** (§categories§ ← §books§) و**الملازم** (§handout_categories§ ← §handouts§)، يتشاركان جدولي البحث §
  753: p(`| §public.books.coverUrl§ / §public.handouts.coverUrl§ | §storage.objects§ | رابط URL عام نصّي، لا مرجع لصفّ الملف |`);
  810: p(`- الأعمدة من نوع مصفوفة (§tags "BookTag"[]§) nullable في القاعدة رغم أنها §BookTag[] @default([])§ في Prisma — سلوك Prisma المعتاد مع المصفوفات.`);
```

### `src/proxy.ts` — 1 سطر

```text
   12: * never been published, so there is no bookmark, no inbound link and no search
```

### `src/theme/noqta-covers.ts` — 2 سطر

```text
    2: * The jackets drawn for books that have no cover image yet.
    8: * book is green under a lamp and green in daylight. So these are literal
```


## ط. لقطات الاختبار البصري الخاصة بالكتب (18 صورة)

- `tests/__screenshots__/desktop-dark/visual/baseline.spec.ts/book-detail-ar.png`
- `tests/__screenshots__/desktop-dark/visual/gated.spec.ts/admin-book-new-ar.png`
- `tests/__screenshots__/desktop-dark/visual/gated.spec.ts/admin-books-ar.png`
- `tests/__screenshots__/desktop-light/visual/baseline.spec.ts/book-detail-ar.png`
- `tests/__screenshots__/desktop-light/visual/gated.spec.ts/admin-book-new-ar.png`
- `tests/__screenshots__/desktop-light/visual/gated.spec.ts/admin-books-ar.png`
- `tests/__screenshots__/mobile-dark/visual/baseline.spec.ts/book-detail-ar.png`
- `tests/__screenshots__/mobile-dark/visual/gated.spec.ts/admin-book-new-ar.png`
- `tests/__screenshots__/mobile-dark/visual/gated.spec.ts/admin-books-ar.png`
- `tests/__screenshots__/mobile-light/visual/baseline.spec.ts/book-detail-ar.png`
- `tests/__screenshots__/mobile-light/visual/gated.spec.ts/admin-book-new-ar.png`
- `tests/__screenshots__/mobile-light/visual/gated.spec.ts/admin-books-ar.png`
- `tests/__screenshots__/tablet-dark/visual/baseline.spec.ts/book-detail-ar.png`
- `tests/__screenshots__/tablet-dark/visual/gated.spec.ts/admin-book-new-ar.png`
- `tests/__screenshots__/tablet-dark/visual/gated.spec.ts/admin-books-ar.png`
- `tests/__screenshots__/tablet-light/visual/baseline.spec.ts/book-detail-ar.png`
- `tests/__screenshots__/tablet-light/visual/gated.spec.ts/admin-book-new-ar.png`
- `tests/__screenshots__/tablet-light/visual/gated.spec.ts/admin-books-ar.png`
