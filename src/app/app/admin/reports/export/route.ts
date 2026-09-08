import { currentEatMonthBounds, eatDateIso, eatDayStartUtc } from "@/lib/dates";
import { requireAdmin } from "@/server/auth/guards";
import { getApprovedTaskRows, getRoster } from "@/server/db/contribution";
import { contributionCsv } from "@/server/domain/contribution";

const DAY_MS = 86_400_000;

export async function GET(req: Request) {
  await requireAdmin();

  const url = new URL(req.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const role = url.searchParams.get("role") || undefined;

  const range =
    from && to
      ? {
          start: eatDayStartUtc(from),
          end: new Date(eatDayStartUtc(to).getTime() + DAY_MS),
        }
      : currentEatMonthBounds();

  const [rows, roster] = await Promise.all([
    getApprovedTaskRows(range.start, range.end, role),
    getRoster(),
  ]);

  const csv = contributionCsv(rows, roster);
  const filename = `contribution-${eatDateIso(range.start)}.csv`;

  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}"`,
    },
  });
}
