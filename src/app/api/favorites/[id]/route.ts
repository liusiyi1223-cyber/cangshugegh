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

  let body: { tags?: string[]; status?: string; collectionIds?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "无效的请求体" }, { status: 400 });
  }

  const existing = await db.favorite.findUnique({ where: { id } });
  if (!existing || existing.userId !== user.id) {
    return NextResponse.json({ error: "收藏不存在" }, { status: 404 });
  }

  const data: {
    tags?: string[];
    status?: "ACTIVE" | "BROKEN";
    collections?: { set: { id: string }[] };
  } = {};

  if (Array.isArray(body.tags)) {
    data.tags = body.tags.filter((t): t is string => typeof t === "string");
  }
  if (body.status === "ACTIVE" || body.status === "BROKEN") {
    data.status = body.status;
  }
  if (Array.isArray(body.collectionIds)) {
    const ids = body.collectionIds.filter(
      (c): c is string => typeof c === "string"
    );
    // 只允许连接到当前用户自己的收藏夹，防止跨用户关联
    const owned = await db.collection.findMany({
      where: { id: { in: ids }, userId: user.id },
      select: { id: true },
    });
    data.collections = { set: owned.map((c) => ({ id: c.id })) };
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "没有要更新的字段" }, { status: 400 });
  }

  const favorite = await db.favorite.update({
    where: { id },
    data,
    include: { collections: { select: { id: true, name: true } } },
  });

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
