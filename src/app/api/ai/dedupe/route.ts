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

  let body: { items?: { id: string; title: string }[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "无效的请求体" }, { status: 400 });
  }

  const items = Array.isArray(body.items) ? body.items : [];
  if (items.length < 2) {
    return NextResponse.json(
      { error: "收藏太少，无法检测重复" },
      { status: 400 }
    );
  }

  try {
    const content = await chat([
      {
        role: "system",
        content:
          "你是去重助手。从收藏列表中找出标题相同或高度相似（明显是重复）的收藏。只输出重复项的序号（从 0 开始），用逗号分隔；如果没有重复，输出 NONE。不要解释。",
      },
      {
        role: "user",
        content: `收藏列表：\n${items
          .map((it, i) => `${i}. ${it.title}`)
          .join("\n")}`,
      },
    ]);

    const trimmed = content.trim();
    if (trimmed.toUpperCase() === "NONE") {
      return NextResponse.json({ duplicateIds: [] });
    }

    const indices = trimmed
      .split(/[^0-9]+/)
      .map((s) => Number(s))
      .filter((n) => !Number.isNaN(n) && n >= 0 && n < items.length);
    const duplicateIds = indices.map((i) => items[i].id);
    return NextResponse.json({ duplicateIds });
  } catch {
    return NextResponse.json({ error: "AI 服务暂时不可用" }, { status: 502 });
  }
}
