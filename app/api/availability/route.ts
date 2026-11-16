import { NextResponse, type NextRequest } from "next/server";
import { getBookedSlots } from "@/lib/storage";
import { parseISODate, slotsForDate } from "@/lib/validations";

/**
 * GET /api/availability?date=YYYY-MM-DD
 * Returns the day's time slots and whether each is still free. The booking form
 * polls this with TanStack Query so taken slots are disabled before submission.
 */
export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get("date") ?? "";
  if (!parseISODate(date)) {
    return NextResponse.json({ error: "Provide a date as YYYY-MM-DD" }, { status: 400 });
  }
  try {
    const booked = await getBookedSlots(date);
    const slots = slotsForDate(date).map((time) => ({ time, available: !booked.includes(time) }));
    return NextResponse.json({ date, slots }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[availability] failed", error);
    return NextResponse.json({ error: "Availability is temporarily unavailable" }, { status: 503 });
  }
}
