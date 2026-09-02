"use client";

import {
  DrawerBody,
  DrawerHeader,
  DrawerHeaderTitle,
  OverlayDrawer,
} from "@fluentui/react-components";
import { Dismiss24Regular } from "@fluentui/react-icons";
import type { ReactNode } from "react";

import { IconButton } from "@/components/ui/icon-button";
import { useRestoreFocus } from "@/components/ui/use-restore-focus";

export type DrawerPosition = "start" | "end" | "bottom";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  closeLabel: string;
  position?: DrawerPosition;
  /** Rendered next to the close button in the header. */
  headerAction?: ReactNode;
  className?: string;
  children: ReactNode;
}

/**
 * One drawer for the three that existed.
 *
 * The storefront menu, the admin menu and the filter sheet each carried their
 * own copy of the same code: an escape listener, a body-scroll lock, and an
 * unlabelled backdrop button. None of them trapped focus or restored it.
 * Fluent's `OverlayDrawer` does all of that once, and collapsing the three
 * removes two `"use client"` files from the app.
 */
export function Drawer({
  open,
  onClose,
  title,
  closeLabel,
  position = "start",
  headerAction,
  className,
  children,
}: DrawerProps) {
  useRestoreFocus(open);

  return (
    <OverlayDrawer
      open={open}
      position={position}
      onOpenChange={(_, data) => {
        if (!data.open) onClose();
      }}
      className={className}
    >
      <DrawerHeader>
        <DrawerHeaderTitle
          action={
            <span className="flex items-center gap-1">
              {headerAction}
              <IconButton variant="subtle" label={closeLabel} onClick={onClose}>
                <Dismiss24Regular aria-hidden className="size-5" />
              </IconButton>
            </span>
          }
        >
          <span className="text-headline-md">{title}</span>
        </DrawerHeaderTitle>
      </DrawerHeader>

      <DrawerBody>{children}</DrawerBody>
    </OverlayDrawer>
  );
}
