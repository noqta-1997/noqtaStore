import Link from "next/link";

/**
 * The boundary for paths that match no route at all.
 *
 * It used to render its own `<html>` and pull in the stylesheet by hand,
 * because the root layout was a pass-through for the `[locale]` segment and
 * the real document lived one level down. Collapsing the two layouts moved
 * `<html>` up here, so this renders content only — emitting a second document
 * would nest one inside the other.
 */
export default function RootNotFound() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-surface p-6">
      <div className="max-w-md space-y-4 rounded-xl border border-line bg-card p-8 text-center">
        <p className="text-5xl font-bold text-on-surface">404</p>
        <h1 className="font-display text-2xl font-bold">الصفحة غير موجودة</h1>
        <p className="text-on-surface-variant">
          الرابط الذي فتحته غير صحيح أو أن الصفحة نُقلت.
        </p>
        <Link
          href="/"
          className="inline-flex h-11 items-center justify-center rounded-md bg-primary-container px-6 font-semibold text-on-primary-container elevation-sm"
        >
          العودة إلى الرئيسية
        </Link>
      </div>
    </main>
  );
}
