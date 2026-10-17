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

  let body: { text?: string; url?: string; title?: string; tags?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "无效的请求体" }, { status: 400 });
  }

  // 手动模式：用户直接给链接 + 标题（抓取失败时的降级路径）
  if (body.url) {
    const title = body.title?.trim();
    if (!title) {
      return NextResponse.json({ error: "请填写标题" }, { status: 400 });
    }

    const inputUrl = body.url;
    const canonicalUrl = await resolveUrl(inputUrl).catch(() => inputUrl);
    const platform = matchAdapter(canonicalUrl)?.name ?? "unknown";
    const tags = Array.isArray(body.tags) ? body.tags : [];

    const existing = await db.favorite.findUnique({
      where: { userId_canonicalUrl: { userId: user.id, canonicalUrl } },
    });
    if (existing) {
      return NextResponse.json({ ...existing, alreadyExists: true });
    }

    const favorite = await db.favorite.create({
      data: {
        userId: user.id,
        url: canonicalUrl,
        canonicalUrl,
        platform,
        title,
        tags,
      },
    });
    return NextResponse.json(favorite, { status: 201 });
  }

  // 自动模式：从分享文本提取并抓取
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
    return NextResponse.json(
      { error: "抓取失败，请手动补标题", url: urls[0] },
      { status: 422 }
    );
  }

  const existing = await db.favorite.findUnique({
    where: {
      userId_canonicalUrl: { userId: user.id, canonicalUrl: meta.canonicalUrl },
    },
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

export async function GET(request: Request) {
  let user: { id: string; email: string };
  try {
    user = await requireUser();
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    throw e;
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();

  const favorites = await db.favorite.findMany({
    where: {
      userId: user.id,
      ...(q ? { title: { contains: q, mode: "insensitive" } } : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(favorites);
}
