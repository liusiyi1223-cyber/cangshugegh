import { NextResponse } from "next/server";
import { requireUser, UnauthorizedError } from "@/lib/auth";
import { chat } from "@/lib/ai";
import { normalizeUrl } from "@/lib/normalize-url";

type DedupeItem = { id: string; title: string; url?: string };

export async function POST(request: Request) {
  try {
    await requireUser();
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    throw e;
  }

  let body: { items?: DedupeItem[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "无效的请求体" }, { status: 400 });
  }

  const items = (Array.isArray(body.items) ? body.items : []).filter(
    (it) => it && typeof it.id === "string" && typeof it.title === "string"
  );
  if (items.length < 2) {
    return NextResponse.json(
      { error: "收藏太少，无法检测重复" },
      { status: 400 }
    );
  }

  // 步骤 1：确定性去重 —— 链接归一化后相同的，除第一条外都判为重复
  const urlDuplicates: string[] = [];
  const seen = new Set<string>();
  for (const it of items) {
    if (!it.url) continue;
    const key = normalizeUrl(it.url);
    if (seen.has(key)) {
      urlDuplicates.push(it.id);
    } else {
      seen.add(key);
    }
  }
  const urlDupSet = new Set(urlDuplicates);

  // 步骤 2：AI 兜底 —— 对未判重的剩余项，结合标题+链接找「同内容/相似」
  const remaining = items.filter((it) => !urlDupSet.has(it.id));
  let similarIds: string[] = [];
  if (remaining.length >= 2) {
    try {
      const content = await chat([
        {
          role: "system",
          content:
            "你是去重助手。从收藏列表中找出指向同一内容（标题相同或高度相似，或链接指向同一页面/视频）的重复收藏。只输出重复项的序号（从 0 开始，按给出列表的顺序），用逗号分隔；如果没有重复，输出 NONE。不要解释。",
        },
        {
          role: "user",
          content: `收藏列表：\n${remaining
            .map((it, i) => `${i}. ${it.title} ${it.url ?? ""}`)
            .join("\n")}`,
        },
      ]);

      const trimmed = content.trim();
      if (trimmed.toUpperCase() !== "NONE") {
        const indices = trimmed
          .split(/[^0-9]+/)
          .map((s) => Number(s))
          .filter(
            (n) => !Number.isNaN(n) && n >= 0 && n < remaining.length
          );
        similarIds = indices.map((i) => remaining[i].id);
      }
    } catch {
      // AI 失败降级：仍返回确定性去重结果，不阻断
    }
  }

  return NextResponse.json({ urlDuplicates, similarIds });
}
