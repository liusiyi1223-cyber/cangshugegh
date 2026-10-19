import { NextResponse } from "next/server";
import { destroySession, requireUser, UnauthorizedError } from "@/lib/auth";
import { db } from "@/lib/db";

export async function DELETE() {
  let user: { id: string; email: string; role: string };
  try {
    user = await requireUser();
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    throw e;
  }

  await db.user.delete({ where: { id: user.id } });
  await destroySession();

  return NextResponse.json({ ok: true });
}
