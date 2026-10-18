// 一次性维护脚本：补封面。
//   阶段 1：把还指向远程 CDN 的封面转存到本地 data/covers/；
//   阶段 2：给没有封面的收藏，按链接重新抓取 og:image 并转存。
// 用法：node scripts/backfill-covers.cjs
require("dotenv").config();
const { randomUUID } = require("node:crypto");
const { mkdir, writeFile } = require("node:fs/promises");
const path = require("node:path");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const COVERS_DIR = path.join(process.cwd(), "data", "covers");
const MAX_BYTES = 5 * 1024 * 1024;
const MAX_HTML = 2 * 1024 * 1024;
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

const EXT_BY_MIME = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/avif": ".avif",
};

async function fetchLimited(url, accept, maxBytes) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: { "user-agent": UA, accept },
    });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length === 0 || buf.length > maxBytes) return null;
    return { buf, res };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function downloadImage(remoteUrl) {
  const r = await fetchLimited(remoteUrl, "image/*", MAX_BYTES);
  if (!r) return null;
  const mime = (r.res.headers.get("content-type") ?? "")
    .split(";")[0]
    .trim()
    .toLowerCase();
  const ext = EXT_BY_MIME[mime];
  if (!ext) return null;
  await mkdir(COVERS_DIR, { recursive: true });
  const name = `${randomUUID()}${ext}`;
  await writeFile(path.join(COVERS_DIR, name), r.buf);
  return `/api/covers/${name}`;
}

function extractOgImage(html) {
  const tag = html.match(/<meta[^>]+og:image["'][^>]+>/i);
  if (!tag) return undefined;
  const content = tag[0].match(/content=["']([^"']+)["']/i);
  return content ? content[1] : undefined;
}

async function fetchCoverFor(pageUrl) {
  const r = await fetchLimited(pageUrl, "text/html", MAX_HTML);
  if (!r) return null;
  const og = extractOgImage(r.buf.toString("utf8"));
  if (!og) return null;
  let abs;
  try {
    abs = new URL(og, pageUrl).toString();
  } catch {
    return null;
  }
  return downloadImage(abs);
}

(async () => {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const db = new PrismaClient({ adapter });

  // 阶段 1：远程封面转本地
  const remote = await db.favorite.findMany({
    where: { cover: { startsWith: "http" } },
    select: { id: true, cover: true },
  });
  console.log(`阶段 1：远程封面转本地（${remote.length} 条）`);
  for (const f of remote) {
    const local = await downloadImage(f.cover);
    if (local) {
      await db.favorite.update({ where: { id: f.id }, data: { cover: local } });
      console.log(`  ✓ ${f.id} → ${local}`);
    } else {
      console.log(`  ✗ ${f.id} 下载失败，保留原图`);
    }
  }

  // 阶段 2：无封面 → 重新抓取
  const none = await db.favorite.findMany({
    where: { cover: null },
    select: { id: true, url: true, canonicalUrl: true, platform: true },
  });
  console.log(`\n阶段 2：给无封面的收藏补抓（${none.length} 条）`);
  let ok = 0;
  for (const f of none) {
    const pageUrl = f.canonicalUrl || f.url;
    const local = await fetchCoverFor(pageUrl);
    if (local) {
      await db.favorite.update({ where: { id: f.id }, data: { cover: local } });
      ok += 1;
      console.log(`  ✓ ${f.id} [${f.platform}] → ${local}`);
    } else {
      console.log(`  ✗ ${f.id} [${f.platform}] 未抓到封面`);
    }
  }
  console.log(`\n阶段 2 完成：成功 ${ok}/${none.length}`);

  await db.$disconnect();
})();
