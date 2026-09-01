"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

import { Input, type InputProps } from "@/components/ui/input";

interface PasswordInputProps extends Omit<InputProps, "type"> {
  labels: { show: string; hide: string };
}

/** Password field with a visibility toggle. */
export function PasswordInput({ labels, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input type={visible ? "text" : "password"} className="pe-12" {...props} />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? labels.hide : labels.show}
        title={visible ? labels.hide : labels.show}
        className="absolute end-0 top-0 flex h-11 w-11 items-center justify-center text-on-surface-variant hover:text-on-surface"
      >
        {visible ? (
          <EyeOff aria-hidden className="size-4" strokeWidth={2} />
        ) : (
          <Eye aria-hidden className="size-4" strokeWidth={2} />
        )}
      </button>
    </div>
  );
}
