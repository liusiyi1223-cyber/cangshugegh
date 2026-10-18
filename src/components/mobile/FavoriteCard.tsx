"use client";

import { Bookmark, MoreHorizontal } from "lucide-react";
import type { FavoriteWithCollections } from "@/lib/types";
import { platformName } from "@/lib/platforms";

export default function FavoriteCard({
  favorite,
  onOpen,
}: {
  favorite: FavoriteWithCollections;
  onOpen: (f: FavoriteWithCollections) => void;
}) {
  const broken = favorite.status === "BROKEN";
  const tags = favorite.tags ?? [];

  return (
    <article
      className={`overflow-hidden rounded-[14px] border border-sand bg-white shadow-sm ${
        broken ? "opacity-60" : ""
      }`}
    >
      <a
        href={favorite.url}
        target="_blank"
        rel="noreferrer"
        className="relative block aspect-[16/10] overflow-hidden bg-brand-soft"
      >
        {favorite.cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={favorite.cover}
            alt=""
            loading="lazy"
            referrerPolicy="no-referrer"
            className={`h-full w-full object-cover ${broken ? "grayscale" : ""}`}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted">
            <Bookmark size={28} strokeWidth={1.5} />
          </div>
        )}
        {broken && (
          <span className="absolute left-2 top-2 rounded-md bg-white px-1.5 py-0.5 text-[10px] text-muted">
            已失效
          </span>
        )}
      </a>

      <div className="p-3">
        <a
          href={favorite.url}
          target="_blank"
          rel="noreferrer"
          className={`line-clamp-2 min-h-[39px] text-[13px] font-semibold leading-snug text-ink ${
            broken ? "line-through" : ""
          }`}
        >
          {favorite.title || "未命名收藏"}
        </a>

        {favorite.author && (
          <div className="mt-1 truncate text-[10px] text-muted">
            {favorite.author}
          </div>
        )}

        <div className="mt-2.5 flex items-center gap-1.5 border-t border-[#f0f2f4] pt-2">
          {favorite.platform && (
            <span className="shrink-0 rounded bg-brand-soft px-1.5 py-0.5 text-[10px] text-brand">
              {platformName(favorite.platform)}
            </span>
          )}
          {tags.slice(0, 2).map((t) => (
            <span
              key={t}
              className="shrink-0 rounded bg-tag px-1.5 py-0.5 text-[10px] text-[#697681]"
            >
              #{t}
            </span>
          ))}
          <button
            type="button"
            onClick={() => onOpen(favorite)}
            aria-label="更多操作"
            className="ml-auto shrink-0 text-muted"
          >
            <MoreHorizontal size={18} strokeWidth={2} />
          </button>
        </div>
      </div>
    </article>
  );
}
