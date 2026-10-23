import { NextResponse } from "next/server";
import { extractTitle, extractUrls } from "@/lib/extract";

// Web Share Target 分享入口：接收手机 App 分享来的 title/text/url，
// 提取链接和标题后重定向到 /favorites 触发自动保存
export async function POST(request: Request) {
  let title = "";
  let text = "";
  let url = "";

  try {
    const form = await request.formData();
    title = (form.get("title") as string) || "";
    text = (form.get("text") as string) || "";
    url = (form.get("url") as string) || "";
  } catch {
    // 表单解析失败则按空处理，走下面的降级
  }

  let target = url;
  if (!target) {
    const urls = extractUrls(text || title);
    target = urls[0] || "";
  }

  const t = title || extractTitle(text);

  const params = new URLSearchParams();
  params.set("share", "1");
  if (target) params.set("url", target);
  if (t) params.set("title", t);

  return NextResponse.redirect(
    new URL(`/favorites?${params.toString()}`, request.url)
  );
}
