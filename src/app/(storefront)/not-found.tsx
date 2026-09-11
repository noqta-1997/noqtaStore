import { Home, Search } from "lucide-react";
import Link from "next/link";

import { buttonStyles } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Surface } from "@/components/ui/surface";

/**
 * `not-found.tsx` receives no route params, so the few strings it needs live
 * here rather than in the dictionary. They used to come in two languages,
 * picked by sniffing the path for `/en`, which is what made this a client
 * component; the English half went with the English site and the sniff went
 * with it, so this renders on the server like the pages around it.
 */
const t = {
  code: "خطأ 404",
  title: "الصفحة غير موجودة",
  description:
    "الرابط الذي فتحته غير صحيح أو أن الصفحة نُقلت. يمكنك العودة إلى الرئيسية أو البحث عن كتاب.",
  home: "العودة إلى الرئيسية",
  search: "ابحث عن كتاب",
} as const;

export default function StorefrontNotFound() {
  return (
    <Container className="py-16 lg:py-24">
      <Surface className="mx-auto max-w-lg space-y-5 p-8 text-center elevation-md">
        <p className="label-mono text-primary">{t.code}</p>
        <p
          aria-hidden
          className="text-7xl font-bold text-on-surface"
          data-numeric
        >
          404
        </p>
        <h1 className="text-headline-lg">{t.title}</h1>
        <p className="text-body-md text-on-surface-variant">{t.description}</p>

        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-center">
          <Link href={"/"} className={buttonStyles({ size: "lg" })}>
            <Home aria-hidden className="size-4" strokeWidth={1.75} />
            {t.home}
          </Link>
          <Link
            href={`/search`}
            className={buttonStyles({ variant: "secondary", size: "lg" })}
          >
            <Search aria-hidden className="size-4" strokeWidth={1.75} />
            {t.search}
          </Link>
        </div>
      </Surface>
    </Container>
  );
}
