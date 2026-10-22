import { NextResponse } from "next/server";
import { hashPassword, signToken } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  let body: { code?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "无效的请求体" }, { status: 400 });
  }

  const code = body.code?.trim();
  if (!code) {
    return NextResponse.json({ error: "缺少登录凭证" }, { status: 400 });
  }

  const appid = process.env.WECHAT_APPID;
  const secret = process.env.WECHAT_APP_SECRET;
  if (!appid || !secret) {
    return NextResponse.json({ error: "未配置微信登录" }, { status: 500 });
  }

  let openid: string;
  try {
    const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appid}&secret=${secret}&js_code=${encodeURIComponent(code)}&grant_type=authorization_code`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    let res: Response;
    try {
      res = await fetch(url, { signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }
    const data = (await res.json()) as { openid?: string; errmsg?: string };
    if (!data.openid) {
      return NextResponse.json(
        { error: `微信登录失败${data.errmsg ? `：${data.errmsg}` : ""}` },
        { status: 401 }
      );
    }
    openid = data.openid;
  } catch {
    return NextResponse.json({ error: "微信服务暂时不可用" }, { status: 502 });
  }

  let user = await db.user.findUnique({ where: { openid } });
  if (!user) {
    user = await db.user.create({
      data: {
        email: `wechat_${openid}@wechat.local`,
        passwordHash: await hashPassword(`wechat:${openid}`),
        openid,
      },
    });
  }

  const token = await signToken(user.id);
  return NextResponse.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      tags: user.tags,
      platforms: user.platforms,
      role: user.role,
    },
  });
}
