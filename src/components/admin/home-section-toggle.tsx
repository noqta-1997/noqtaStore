"use client";

import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { setHomeSectionVisibility } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import type { HomeSection } from "@/lib/home-sections";

interface HomeSectionToggleProps {
  section: HomeSection;
  visible: boolean;
  /** The section's name, for the toast and the accessible label. */
  title: string;
  labels: {
    show: string;
    hide: string;
    shown: string;
    hidden: string;
    failure: string;
  };
  errorMessages: Record<string, string>;
}

/**
 * Switches one home page section on or off, straight from its row.
 *
 * The button names the action rather than the state — "hide" beside a
 * section that is showing — because the row's badge already says which
 * state it is in, and a button that read "showing" would leave the reader
 * guessing what pressing it does.
 */
export function HomeSectionToggle({
  section,
  visible,
  title,
  labels,
  errorMessages,
}: HomeSectionToggleProps) {
  const toast = useToast();
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const action = visible ? labels.hide : labels.show;
  const Icon = visible ? EyeOff : Eye;

  const onClick = async () => {
    setPending(true);
    const result = await setHomeSectionVisibility(section, !visible);
    setPending(false);

    if (!result.ok) {
      toast({ title: errorMessages[result.error] ?? labels.failure, tone: "error" });
      return;
    }

    toast({ title: visible ? labels.hidden : labels.shown, description: title });
    router.refresh();
  };

  return (
    <Button
      variant="secondary"
      size="sm"
      disabled={pending}
      aria-label={`${action}: ${title}`}
      onClick={onClick}
    >
      <Icon aria-hidden className="size-4" strokeWidth={1.75} />
      {action}
    </Button>
  );
}
