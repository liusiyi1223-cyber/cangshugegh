import { NextResponse } from "next/server";
import { requireUser, UnauthorizedError } from "@/lib/auth";
import { chat } from "@/lib/ai";

export async function POST(request: Request) {
  try {
    await requireUser();
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    throw e;
  }

  let body: {
    query?: string;
    items?: {
      id: string;
      title: string;
      platform?: string;
      time?: string;
    }[];
    history?: string[];
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "无效的请求体" }, { status: 400 });
  }

  const query = body.query?.trim();
  const items = Array.isArray(body.items) ? body.items : [];
  const history = Array.isArray(body.history) ? body.history : [];
  if (!query || items.length === 0) {
    return NextResponse.json({ error: "缺少查询或收藏" }, { status: 400 });
  }

  try {
    const listText = items
      .map(
        (it, i) =>
          `${i}. ${it.title}（${it.platform ?? "未知"}，${it.time ?? "未知时间"}）`
      )
      .join("\n");
    const historyText =
      history.length > 0
        ? `\n\n之前的对话：\n${history.join("\n")}`
        : "";

    const content = await chat([
      {
        role: "system",
        content:
          "根据用户的查询和之前的对话历史，从收藏列表中找出语义相关的收藏。要理解时间（如「去年」「最近」）和平台（如「B站」「知乎」）等意图。只输出匹配项的序号（从 0 开始），用逗号分隔；如果没有匹配，输出 NONE。不要解释。",
      },
      {
        role: "user",
        content: `当前查询：${query}${historyText}\n\n收藏列表：\n${listText}`,
      },
    ]);

    const trimmed = content.trim();
    if (trimmed.toUpperCase() === "NONE") {
      return NextResponse.json({ ids: [] });
    }

    const indices = trimmed
      .split(/[^0-9]+/)
      .map((s) => Number(s))
      .filter((n) => !Number.isNaN(n) && n >= 0 && n < items.length);
    const ids = indices.map((i) => items[i].id);
    return NextResponse.json({ ids });
  } catch {
    return NextResponse.json({ error: "AI 服务暂时不可用" }, { status: 502 });
  }
}
