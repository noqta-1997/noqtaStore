import type { ReactNode } from "react";

/**
 * The real root layout lives at `app/[locale]/layout.tsx`, where the
 * locale decides `lang` and `dir`. This file only forwards children.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
