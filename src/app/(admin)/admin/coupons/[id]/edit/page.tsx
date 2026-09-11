import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { CouponForm } from "@/components/admin/coupon-form";
import { Panel } from "@/components/admin/panel";
import { getCouponById } from "@/data";
import { defaultLocale } from "@/i18n/config";
import { getAdminDictionary, getDictionary } from "@/i18n/get-dictionary";

interface EditCouponPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  const admin = await getAdminDictionary(defaultLocale);

  return { title: `${admin.coupons.form.editTitle} — ${admin.brand.panel}` };
}

export default async function EditCouponPage({ params }: EditCouponPageProps) {
  const { id } = await params;
  const locale = defaultLocale;

  const coupon = await getCouponById(id);

  if (!coupon) {
    notFound();
  }

  const [dictionary, admin] = await Promise.all([
    getDictionary(locale),
    getAdminDictionary(locale),
  ]);

  const t = admin.coupons.form;

  return (
    <>
      <Link
        href={`/admin/coupons`}
        className="inline-flex items-center gap-2 text-label-md text-on-surface underline-offset-4 hover:underline"
      >
        <ArrowRight aria-hidden className="size-4 rotate-180 rtl:rotate-0" strokeWidth={1.75} />
        {t.back}
      </Link>

      <AdminPageHeader title={t.editTitle} subtitle={coupon.code} />

      <Panel title={t.editSubtitle} className="max-w-2xl">
        <CouponForm admin={admin} dictionary={dictionary} coupon={coupon} />
      </Panel>
    </>
  );
}
