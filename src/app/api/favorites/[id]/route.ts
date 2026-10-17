import { NextResponse } from "next/server";
import { requireUser, UnauthorizedError } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let user: { id: string; email: string };
  try {
    user = await requireUser();
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    throw e;
  }

  const { id } = await params;

  let body: { tags?: string[]; status?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "无效的请求体" }, { status: 400 });
  }

  const data: { tags?: string[]; status?: "ACTIVE" | "BROKEN" } = {};
  if (Array.isArray(body.tags)) {
    data.tags = body.tags.filter((t): t is string => typeof t === "string");
  }
  if (body.status === "ACTIVE" || body.status === "BROKEN") {
    data.status = body.status;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "没有要更新的字段" }, { status: 400 });
  }

  const result = await db.favorite.updateMany({
    where: { id, userId: user.id },
    data,
  });

  if (result.count === 0) {
    return NextResponse.json({ error: "收藏不存在" }, { status: 404 });
  }

  const favorite = await db.favorite.findUnique({ where: { id } });
  return NextResponse.json(favorite);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let user: { id: string; email: string };
  try {
    user = await requireUser();
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    throw e;
  }

  const { id } = await params;

  const result = await db.favorite.deleteMany({
    where: { id, userId: user.id },
  });

  if (result.count === 0) {
    return NextResponse.json({ error: "收藏不存在" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
