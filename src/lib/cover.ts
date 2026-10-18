import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { MAX_BYTES, readBodyLimitedBuffer, safeFetch } from "./net";

export const COVERS_DIR = path.join(process.cwd(), "data", "covers");

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/avif": ".avif",
};

const MIME_BY_EXT: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".avif": "image/avif",
};

export function contentTypeForExt(ext: string): string | undefined {
  return MIME_BY_EXT[ext.toLowerCase()];
}

// 下载远程封面并存到本地磁盘，返回相对回显路径；任一步失败返回 null（调用方降级保留原 URL）
export async function storeCover(remoteUrl: string): Promise<string | null> {
  try {
    const url = remoteUrl.startsWith("//") ? `https:${remoteUrl}` : remoteUrl;
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }

    const res = await safeFetch(url, {
      allowedDomains: [parsed.hostname],
      accept: "image/*",
      timeoutMs: 5000,
    });
    if (!res.ok) return null;

    const mime = (res.headers.get("content-type") ?? "")
      .split(";")[0]
      .trim()
      .toLowerCase();
    const ext = EXT_BY_MIME[mime];
    if (!ext) return null;

    const bytes = await readBodyLimitedBuffer(res, MAX_BYTES);

    await mkdir(COVERS_DIR, { recursive: true });
    const name = `${randomUUID()}${ext}`;
    await writeFile(path.join(COVERS_DIR, name), bytes);

    return `/api/covers/${name}`;
  } catch {
    return null;
  }
}

// 把 data URL（前端上传的图片）解码并落到本地磁盘，返回回显路径；失败返回 null
export async function saveDataUrlCover(dataUrl: string): Promise<string | null> {
  try {
    const m = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
    if (!m) return null;
    const ext = EXT_BY_MIME[m[1].toLowerCase()] ?? ".jpg";
    const bytes = Buffer.from(m[2], "base64");
    if (bytes.length === 0 || bytes.length > MAX_BYTES) return null;

    await mkdir(COVERS_DIR, { recursive: true });
    const name = `${randomUUID()}${ext}`;
    await writeFile(path.join(COVERS_DIR, name), bytes);
    return `/api/covers/${name}`;
  } catch {
    return null;
  }
}
