import { NextResponse } from "next/server";
import { requireUser, UnauthorizedError } from "@/lib/auth";
import { saveDataUrlCover, storeCover } from "@/lib/cover";
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

  let body: { tags?: string[]; status?: string; title?: string; cover?: string | null; note?: string | null; incrementVisit?: boolean };
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
    title?: string;
    cover?: string | null;
    note?: string | null;
    visitCount?: { increment: number };
  } = {};

  if (typeof body.title === "string") {
    const t = body.title.trim();
    if (t) data.title = t;
  }
  if (Array.isArray(body.tags)) {
    data.tags = body.tags.filter((t): t is string => typeof t === "string");
  }
  if (body.status === "ACTIVE" || body.status === "BROKEN") {
    data.status = body.status;
  }
  if (body.cover === null) {
    data.cover = null;
  } else if (typeof body.cover === "string") {
    const c = body.cover.trim();
    if (c === "") {
      data.cover = null;
    } else if (c.startsWith("data:")) {
      const local = await saveDataUrlCover(c);
      if (local) data.cover = local;
    } else if (c.startsWith("http://") || c.startsWith("https://")) {
      const stored = await storeCover(c).catch(() => null);
      if (stored) data.cover = stored;
    }
  }
  if (body.note !== undefined) {
    data.note =
      typeof body.note === "string" && body.note.trim()
        ? body.note.trim()
        : null;
  }
  if (body.incrementVisit) {
    data.visitCount = { increment: 1 };
  }
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "没有要更新的字段" }, { status: 400 });
  }

  const favorite = await db.favorite.update({
    where: { id },
    data,
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
