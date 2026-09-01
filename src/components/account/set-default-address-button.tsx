"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { setDefaultAddress } from "@/app/actions/account";
import { useToast } from "@/components/ui/toast";

interface SetDefaultAddressButtonProps {
  addressId: string;
  label: string;
  successTitle: string;
  failureMessage: string;
}

export function SetDefaultAddressButton({
  addressId,
  label,
  successTitle,
  failureMessage,
}: SetDefaultAddressButtonProps) {
  const toast = useToast();
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const onClick = async () => {
    setPending(true);
    const result = await setDefaultAddress(addressId);
    setPending(false);

    toast(
      result.ok
        ? { title: successTitle }
        : { title: failureMessage, tone: "error" },
    );

    if (result.ok) router.refresh();
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="ms-auto text-label-md text-primary underline-offset-4 hover:underline disabled:opacity-50"
    >
      {label}
    </button>
  );
}
