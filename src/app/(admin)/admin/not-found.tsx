import { LayoutDashboard } from "lucide-react";
import Link from "next/link";

import { buttonStyles } from "@/components/ui/button";

/**
 * `not-found.tsx` receives no route params, so the few strings it needs live
 * here rather than in the dictionary. They used to come in two languages,
 * picked by sniffing the path for `/en`, which is what made this a client
 * component; the English half went with the English site and the sniff went
 * with it, so this renders on the server like the pages around it.
 */
const t = {
  code: "خطأ 404",
  title: "الصفحة غير موجودة في اللوحة",
  description: "تحقّق من الرابط أو عد إلى لوحة المعلومات.",
  action: "لوحة المعلومات",
} as const;

export default function AdminNotFound() {
  return (
    <div className="mx-auto max-w-lg space-y-5 rounded-xl border border-line bg-card p-8 text-center elevation-md">
      <p className="text-label-md font-semibold text-primary">{t.code}</p>
      <p aria-hidden className="text-6xl font-bold text-on-surface" data-numeric>
        404
      </p>
      <h1 className="text-headline-md">{t.title}</h1>
      <p className="text-body-md text-on-surface-variant">{t.description}</p>

      <Link href={`/admin`} className={buttonStyles({ size: "lg" })}>
        <LayoutDashboard aria-hidden className="size-4" strokeWidth={1.75} />
        {t.action}
      </Link>
    </div>
  );
}
