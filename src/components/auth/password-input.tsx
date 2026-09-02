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
      <Input type={visible ? "text" : "password"} className="pe-11" {...props} />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? labels.hide : labels.show}
        title={visible ? labels.hide : labels.show}
        className="absolute inset-y-0 end-0 flex w-11 items-center justify-center rounded-e-md text-on-surface-variant transition-colors hover:text-primary"
      >
        {visible ? (
          <EyeOff aria-hidden className="size-4" strokeWidth={1.75} />
        ) : (
          <Eye aria-hidden className="size-4" strokeWidth={1.75} />
        )}
      </button>
    </div>
  );
}
