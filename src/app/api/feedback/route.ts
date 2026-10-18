import { NextResponse } from "next/server";
import { requireUser, UnauthorizedError } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendMail } from "@/lib/mailer";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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

  let body: { content?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "无效的请求体" }, { status: 400 });
  }

  const content = body.content?.trim();
  if (!content) {
    return NextResponse.json({ error: "请填写问题描述" }, { status: 400 });
  }
  if (content.length > 2000) {
    return NextResponse.json({ error: "描述过长" }, { status: 400 });
  }

  await db.feedback.create({
    data: { userId: user.id, content },
  });

  const adminEmail = process.env.SMTP_USER;
  if (adminEmail) {
    try {
      await sendMail(
        adminEmail,
        "【藏书阁】收到一条问题反馈",
        `<p><strong>反馈内容：</strong></p><p>${escapeHtml(content)}</p><p style="color:#89919b">来自用户：${escapeHtml(user.email)}</p>`
      );
    } catch {
      // 邮件失败不阻断反馈保存
    }
  }

  return NextResponse.json({ ok: true });
}
