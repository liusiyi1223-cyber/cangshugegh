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

  let body: { items?: { title: string; platform?: string }[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "无效的请求体" }, { status: 400 });
  }

  const items = Array.isArray(body.items) ? body.items : [];
  if (items.length === 0) {
    return NextResponse.json({ error: "没有收藏" }, { status: 400 });
  }

  try {
    const content = await chat([
      {
        role: "system",
        content:
          "你是收藏助手。根据用户的收藏列表，用一两句话总结这些收藏的主题和特点，语气友好、口语化。只输出总结本身，不要解释、不要序号。",
      },
      {
        role: "user",
        content: `收藏列表：\n${items
          .map((it, i) => `${i + 1}. ${it.title}`)
          .join("\n")}`,
      },
    ]);
    return NextResponse.json({ summary: content.trim() });
  } catch {
    return NextResponse.json({ error: "AI 服务暂时不可用" }, { status: 502 });
  }
}
