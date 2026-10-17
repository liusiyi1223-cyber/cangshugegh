import { NextResponse } from "next/server";
import { requireUser, UnauthorizedError } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  let user: { id: string; email: string };
  try {
    user = await requireUser();
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    throw e;
  }

  const logs = await db.fetchLog.findMany({
    select: { platform: true, success: true },
  });

  const map = new Map<
    string,
    { total: number; success: number; failed: number }
  >();

  for (const log of logs) {
    const key = log.platform ?? "unknown";
    const s = map.get(key) ?? { total: 0, success: 0, failed: 0 };
    s.total += 1;
    if (log.success) s.success += 1;
    else s.failed += 1;
    map.set(key, s);
  }

  const stats = Array.from(map.entries()).map(([platform, s]) => ({
    platform,
    total: s.total,
    success: s.success,
    failed: s.failed,
    failureRate: s.total ? Number((s.failed / s.total).toFixed(4)) : 0,
  }));

  return NextResponse.json(stats);
}
