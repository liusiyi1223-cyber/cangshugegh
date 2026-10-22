import { NextResponse } from "next/server";
import { sendMail } from "@/lib/mailer";
import { generateCode, saveCode } from "@/lib/verify-code";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "无效的请求体" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "邮箱格式不正确" }, { status: 400 });
  }

  const code = generateCode();
  saveCode(email, code);

  try {
    await sendMail(
      email,
      "【口袋链】验证码",
      `<p>你的验证码是：</p><p style="font-size:24px;font-weight:bold;letter-spacing:4px">${code}</p><p>10 分钟内有效，请勿泄露。</p>`
    );
  } catch {
    return NextResponse.json(
      { error: "邮件发送失败，请稍后重试" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
