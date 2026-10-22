import { NextResponse } from "next/server";
import { requireUser, UnauthorizedError } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  let user: { id: string; email: string; role: string };
  try {
    user = await requireUser();
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    throw e;
  }

  if (user.role !== "ADMIN") {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const users = await db.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      _count: { select: { favorites: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(users);
}
