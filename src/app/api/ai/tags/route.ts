import { NextResponse } from "next/server";
import { requireUser, UnauthorizedError } from "@/lib/auth";
import { chat } from "@/lib/ai";

const ICON_NAMES =
  "BookOpen, Code, Utensils, Music, Film, Gamepad2, Camera, Briefcase, Heart, Star, GraduationCap, Lightbulb, Globe, ShoppingBag, Plane, Home, Dumbbell, Palette, Car, Smartphone, Wrench, Leaf, Coffee, PenTool, Rocket, Cloud, Flame, MessageCircle, Newspaper, Mic, Atom, Beer, Bike, Book, BookMarked, Brain, Cake, Cat, ChefHat, Clapperboard, Coins, Compass, Dog, FileText, Fish, FlaskConical, Flower2, Footprints, Gem, Gift, Guitar, Headphones, HeartPulse, Joystick, Languages, MapPin, Medal, Microscope, Moon, Mountain, Paintbrush, PawPrint, Piano, PiggyBank, Pill, Pizza, Podcast, Puzzle, Snowflake, Sparkles, Store, Sun, Target, Tent, TrendingUp, Trophy, Tv, Video, Wallet, Wine";

export async function POST(request: Request) {
  try {
    await requireUser();
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    throw e;
  }

  let body: { title?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "无效的请求体" }, { status: 400 });
  }

  const title = body.title?.trim();
  if (!title) {
    return NextResponse.json({ error: "缺少标题" }, { status: 400 });
  }

  try {
    const content = await chat([
      {
        role: "system",
        content: `你是标签助手。根据收藏标题，生成 3-5 个简短中文标签（每个 1-4 字），并从以下图标名中选一个最贴切的图标。可用图标：${ICON_NAMES}。只输出 JSON 格式：{"tags":["标签1","标签2"],"icon":"图标名"}，不要解释。`,
      },
      { role: "user", content: title },
    ]);

    try {
      const parsed = JSON.parse(content);
      const tags = Array.isArray(parsed.tags)
        ? parsed.tags
            .filter((t: unknown): t is string => typeof t === "string")
            .slice(0, 5)
        : [];
      const icon = typeof parsed.icon === "string" ? parsed.icon : undefined;
      return NextResponse.json({ tags, icon });
    } catch {
      // JSON 解析失败，降级为逗号分隔标签
      const tags = content
        .split(/[,，、\n]/)
        .map((t) => t.replace(/^#/, "").trim())
        .filter(Boolean)
        .slice(0, 5);
      return NextResponse.json({ tags });
    }
  } catch {
    return NextResponse.json({ error: "AI 服务暂时不可用" }, { status: 502 });
  }
}
