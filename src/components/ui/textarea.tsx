import type { TextareaHTMLAttributes } from "react";

import { fieldStyles } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ className, rows = 4, ...props }: TextareaProps) {
  return (
    <textarea
      rows={rows}
      className={cn(fieldStyles, "py-2 text-body-md", className)}
      {...props}
    />
  );
}
