import { NextResponse } from "next/server";
import { requireUser, UnauthorizedError } from "@/lib/auth";

export async function GET() {
  try {
    const user = await requireUser();
    return NextResponse.json(user);
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    throw e;
  }
}
