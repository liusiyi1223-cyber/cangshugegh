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

  // collections 无级联删除，先手动删；favorites 由 user 的 onDelete Cascade 级联删除
  await db.collection.deleteMany({ where: { userId: user.id } });
  await db.user.delete({ where: { id: user.id } });
  await destroySession();

  return NextResponse.json({ ok: true });
}
