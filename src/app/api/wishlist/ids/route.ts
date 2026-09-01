import { NextResponse } from "next/server";

import { getWishlistIds } from "@/data";

/**
 * The hearts ask for this from the browser instead of the page, which keeps
 * every catalogue page statically rendered.
 */
export async function GET() {
  const ids = await getWishlistIds();

  return NextResponse.json(
    { ids },
    { headers: { "Cache-Control": "no-store" } },
  );
}
