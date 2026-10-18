import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { COVERS_DIR, contentTypeForExt } from "@/lib/cover";

const KEY_PATTERN = /^[a-zA-Z0-9._-]+$/;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;

  if (!KEY_PATTERN.test(key)) {
    return new NextResponse(null, { status: 404 });
  }

  let body: ArrayBuffer;
  try {
    const buf = await readFile(path.join(COVERS_DIR, key));
    body = buf.buffer.slice(
      buf.byteOffset,
      buf.byteOffset + buf.byteLength
    ) as ArrayBuffer;
  } catch {
    return new NextResponse(null, { status: 404 });
  }

  const contentType =
    contentTypeForExt(path.extname(key)) ?? "application/octet-stream";

  return new NextResponse(body, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
