"use client";

import { Power } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { toggleCoupon } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

interface CouponToggleProps {
  couponId: string;
  active: boolean;
  code: string;
  labels: {
    activate: string;
    deactivate: string;
    saved: string;
    failure: string;
  };
  errorMessages: Record<string, string>;
}

/** Switches a code on or off without opening the edit form. */
export function CouponToggle({
  couponId,
  active,
  code,
  labels,
  errorMessages,
}: CouponToggleProps) {
  const toast = useToast();
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const label = active ? labels.deactivate : labels.activate;

  const onClick = async () => {
    setPending(true);
    const result = await toggleCoupon(couponId);
    setPending(false);

    if (!result.ok) {
      toast({ title: errorMessages[result.error] ?? labels.failure, tone: "error" });
      return;
    }

    toast({ title: labels.saved, description: code });
    router.refresh();
  };

  return (
    <Button
      variant="secondary"
      size="sm"
      disabled={pending}
      className="px-2"
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      <Power aria-hidden className="size-4" strokeWidth={1.75} />
    </Button>
  );
}
