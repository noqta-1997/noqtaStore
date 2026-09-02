"use client";

import { useState, type InputHTMLAttributes } from "react";

import { Field } from "@/components/ui/field";
import { Input, type InputSize } from "@/components/ui/input";
import type { Dictionary } from "@/i18n/get-dictionary";

export type ValidationMessages = Dictionary["common"]["validation"];

interface ValidatedFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "name" | "size"> {
  id: string;
  name: string;
  label: string;
  /** Forwarded to the control, so a form can ask for a taller field. */
  size?: InputSize;
  messages: ValidationMessages;
  hint?: string;
  optional?: string;
  /** Id of another input this value must equal — used by "confirm password". */
  matchWith?: string;
  className?: string;
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const phonePattern = /^[+\d][\d\s-]{7,}$/;

/**
 * Input with inline validation: the message appears on blur and clears as
 * soon as the value becomes valid. Native constraints still apply on submit.
 */
export function ValidatedField({
  id,
  name,
  label,
  messages,
  hint,
  optional,
  matchWith,
  size,
  className,
  ...props
}: ValidatedFieldProps) {
  const [error, setError] = useState<string | null>(null);

  const validate = (value: string) => {
    const trimmed = value.trim();

    if (props.required && !trimmed) return messages.required;
    if (!trimmed) return null;

    if (props.type === "email" && !emailPattern.test(trimmed)) {
      return messages.email;
    }
    if (props.type === "tel" && !phonePattern.test(trimmed)) {
      return messages.phone;
    }
    if (props.type === "number" && Number.isNaN(Number(trimmed))) {
      return messages.number;
    }
    if (props.minLength && trimmed.length < props.minLength) {
      return messages.minLength.replace("{n}", String(props.minLength));
    }
    if (matchWith) {
      const other = document.getElementById(matchWith) as HTMLInputElement | null;
      if (other && other.value !== value) return messages.mismatch;
    }

    return null;
  };

  return (
    <Field
      label={label}
      htmlFor={id}
      hint={hint}
      optional={optional}
      error={error ?? undefined}
      className={className}
    >
      <Input
        id={id}
        name={name}
        size={size}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        onBlur={(event) => setError(validate(event.target.value))}
        onChange={(event) => {
          if (error) setError(validate(event.target.value));
        }}
        {...props}
      />
    </Field>
  );
}
