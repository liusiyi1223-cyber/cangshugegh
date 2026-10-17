import { NextResponse } from "next/server";
import { matchAdapter } from "@/adapters";
import type { FetchedMeta } from "@/adapters/types";
import { requireUser, UnauthorizedError } from "@/lib/auth";
import { db } from "@/lib/db";
import { extractUrls } from "@/lib/extract";
import { resolveUrl } from "@/lib/resolve";

export async function POST(request: Request) {
  let user: { id: string; email: string };
  try {
    user = await requireUser();
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    throw e;
  }

  let body: { text?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "无效的请求体" }, { status: 400 });
  }

  const text = body.text?.trim();
  if (!text) {
    return NextResponse.json({ error: "请粘贴分享文本" }, { status: 400 });
  }

  const urls = extractUrls(text);
  if (urls.length === 0) {
    return NextResponse.json({ error: "未在文本中找到链接" }, { status: 422 });
  }

  let platform: string;
  let meta: FetchedMeta;
  try {
    const resolved = await resolveUrl(urls[0]);
    const adapter = matchAdapter(resolved);
    if (!adapter) {
      return NextResponse.json({ error: "暂不支持该平台" }, { status: 422 });
    }
    platform = adapter.name;
    meta = await adapter.fetchMeta(resolved);
  } catch {
    return NextResponse.json({ error: "抓取失败，请稍后重试" }, { status: 422 });
  }

  const dedupKey = { userId: user.id, canonicalUrl: meta.canonicalUrl };
  const existing = await db.favorite.findUnique({
    where: { userId_canonicalUrl: dedupKey },
  });
  if (existing) {
    return NextResponse.json({ ...existing, alreadyExists: true });
  }

  const favorite = await db.favorite.create({
    data: {
      userId: user.id,
      url: meta.canonicalUrl,
      canonicalUrl: meta.canonicalUrl,
      platform,
      title: meta.title,
      cover: meta.cover,
      author: meta.author,
      tags: [],
    },
  });

  return NextResponse.json(favorite, { status: 201 });
}

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

  const favorites = await db.favorite.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(favorites);
}
