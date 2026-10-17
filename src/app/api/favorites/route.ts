import { NextResponse } from "next/server";
import { matchAdapter } from "@/adapters";
import type { FetchedMeta } from "@/adapters/types";
import { requireUser, UnauthorizedError } from "@/lib/auth";
import { db } from "@/lib/db";
import { extractUrls } from "@/lib/extract";
import { resolveUrl } from "@/lib/resolve";

type FetchLogEntry = {
  platform: string | null;
  url: string;
  success: boolean;
  error?: string;
};

async function logFetch(entry: FetchLogEntry) {
  try {
    await db.fetchLog.create({ data: entry });
  } catch {
    // 日志失败不阻断主流程
  }
}

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

  const inputUrl = urls[0];

  let resolved: string;
  try {
    resolved = await resolveUrl(inputUrl);
  } catch {
    await logFetch({
      platform: null,
      url: inputUrl,
      success: false,
      error: "短链还原失败",
    });
    return NextResponse.json(
      { error: "抓取失败，请手动补标题", url: inputUrl },
      { status: 422 }
    );
  }

  const adapter = matchAdapter(resolved);
  if (!adapter) {
    await logFetch({
      platform: null,
      url: inputUrl,
      success: false,
      error: "暂不支持该平台",
    });
    return NextResponse.json({ error: "暂不支持该平台" }, { status: 422 });
  }

  let meta: FetchedMeta;
  try {
    meta = await adapter.fetchMeta(resolved);
  } catch (err) {
    await logFetch({
      platform: adapter.name,
      url: inputUrl,
      success: false,
      error: err instanceof Error ? err.message : "未知错误",
    });
    return NextResponse.json(
      { error: "抓取失败，请手动补标题", url: inputUrl },
      { status: 422 }
    );
  }

  await logFetch({ platform: adapter.name, url: inputUrl, success: true });

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
      platform: adapter.name,
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
  const collectionId = searchParams.get("collectionId")?.trim();

  const favorites = await db.favorite.findMany({
    where: {
      userId: user.id,
      ...(q ? { title: { contains: q, mode: "insensitive" } } : {}),
      ...(collectionId === "unfiled"
        ? { collections: { none: {} } }
        : collectionId
          ? { collections: { some: { id: collectionId } } }
          : {}),
    },
    orderBy: { createdAt: "desc" },
    include: { collections: { select: { id: true, name: true } } },
  });

  return NextResponse.json(favorites);
}
