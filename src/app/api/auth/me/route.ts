import { NextResponse } from "next/server";
import { requireUser, UnauthorizedError } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const user = await requireUser();
    return NextResponse.json(user);
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    throw e;
  }
}

export async function PATCH(request: Request) {
  let user: { id: string };
  try {
    user = await requireUser();
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    throw e;
  }

  let body: { name?: string; avatar?: string; tags?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "无效的请求体" }, { status: 400 });
  }

  const data: {
    name?: string | null;
    avatar?: string | null;
    tags?: string[];
  } = {};

  if (typeof body.name === "string") {
    data.name = body.name.trim() || null;
  }
  if (typeof body.avatar === "string") {
    if (body.avatar.length > 500000) {
      return NextResponse.json({ error: "头像图片过大" }, { status: 400 });
    }
    data.avatar = body.avatar || null;
  }
  if (Array.isArray(body.tags)) {
    const newTags = body.tags.filter((t): t is string => typeof t === "string");
    data.tags = newTags;

    // 删除标签时，级联把该标签从所有收藏里移除（收藏本身保留）
    const oldUser = await db.user.findUnique({
      where: { id: user.id },
      select: { tags: true },
    });
    const removed = (oldUser?.tags ?? []).filter((t) => !newTags.includes(t));
    for (const tag of removed) {
      const favs = await db.favorite.findMany({
        where: { userId: user.id, tags: { has: tag } },
        select: { id: true, tags: true },
      });
      for (const fav of favs) {
        await db.favorite.update({
          where: { id: fav.id },
          data: { tags: fav.tags.filter((t) => t !== tag) },
        });
      }
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "没有要更新的字段" }, { status: 400 });
  }

  const updated = await db.user.update({
    where: { id: user.id },
    data,
    select: {
      id: true,
      email: true,
      name: true,
      avatar: true,
      tags: true,
      role: true,
    },
  });

  return NextResponse.json(updated);
}
