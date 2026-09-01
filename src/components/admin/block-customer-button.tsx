"use client";

import { Ban, CircleCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { toggleCustomerBlock } from "@/app/actions/admin";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

interface BlockCustomerButtonProps {
  customerId: string;
  blocked: boolean;
  label: string;
  successTitle: string;
  selfBlockMessage: string;
  failureMessage: string;
  className?: string;
}

export function BlockCustomerButton({
  customerId,
  blocked,
  label,
  successTitle,
  selfBlockMessage,
  failureMessage,
  className,
}: BlockCustomerButtonProps) {
  const toast = useToast();
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const onClick = async () => {
    setPending(true);
    const result = await toggleCustomerBlock(customerId);
    setPending(false);

    if (!result.ok) {
      toast({
        title: result.error === "selfBlock" ? selfBlockMessage : failureMessage,
        tone: "error",
      });
      return;
    }

    toast({ title: successTitle });
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex size-9 shrink-0 items-center justify-center border border-transparent",
        "text-on-surface transition-colors hover:border-line hover:bg-surface-high disabled:opacity-50",
        className,
      )}
    >
      {blocked ? (
        <CircleCheck aria-hidden className="size-4" strokeWidth={2} />
      ) : (
        <Ban aria-hidden className="size-4" strokeWidth={2} />
      )}
    </button>
  );
}
