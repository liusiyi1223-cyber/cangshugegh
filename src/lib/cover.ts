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
    const parsed = new URL(remoteUrl);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }

    const res = await safeFetch(remoteUrl, {
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
