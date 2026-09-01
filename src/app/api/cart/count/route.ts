import { NextResponse } from "next/server";

import { getCartCount } from "@/data";

/**
 * The header badge asks for the count from the browser instead of the layout,
 * which keeps every catalogue page statically rendered.
 */
export async function GET() {
  const count = await getCartCount();

  return NextResponse.json(
    { count },
    { headers: { "Cache-Control": "no-store" } },
  );
}
