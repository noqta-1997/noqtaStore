"use client";

import { Ban, CircleCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { toggleCustomerBlock } from "@/app/actions/admin";
import { runAction } from "@/lib/action-result";
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
    const result = await runAction(toggleCustomerBlock(customerId));
    setPending(false);

    if (!result.ok) {
      toast({
        title: result.error === "selfBlock" ? selfBlockMessage : failureMessage,
        tone: "error",
      });
      // The customer was removed meanwhile; the table still lists them.
      if (result.error === "notFound") router.refresh();
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
        "inline-flex size-9 shrink-0 items-center justify-center rounded-md",
        "text-on-surface transition-colors duration-100 ease-fluent hover:bg-state-hover hover:text-primary disabled:opacity-50",
        className,
      )}
    >
      {blocked ? (
        <CircleCheck aria-hidden className="size-4" strokeWidth={1.75} />
      ) : (
        <Ban aria-hidden className="size-4" strokeWidth={1.75} />
      )}
    </button>
  );
}
