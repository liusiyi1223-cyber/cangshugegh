"use client";

import { memo, useState } from "react";
import { Eye } from "lucide-react";
import type { FavoriteWithCollections } from "@/lib/types";
import { platformColor, platformIcon, platformName } from "@/lib/platforms";
import { formatRelativeTime } from "@/lib/time";
import { iconFor } from "@/lib/iconMap";

function FavoriteListItem({
  favorite,
  onOpen,
  hide,
}: {
  favorite: FavoriteWithCollections;
  onOpen: (f: FavoriteWithCollections) => void;
  hide: boolean;
}) {
  const broken = favorite.status === "BROKEN";
  const tags = favorite.tags ?? [];
  const [coverError, setCoverError] = useState(false);

  return (
    <article
      className={`relative flex gap-3 overflow-hidden rounded-2xl bg-white p-1.5 shadow-card ${
        broken ? "opacity-60" : ""
      }`}
    >
      <button
        type="button"
        onClick={() => onOpen(favorite)}
        className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-brand-soft text-left"
      >
        {favorite.cover && !coverError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={favorite.cover}
            alt=""
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setCoverError(true)}
            className={`h-full w-full object-cover ${broken ? "grayscale" : ""}`}
          />
        ) : (
          (() => {
            const Icon = favorite.icon
              ? iconFor(favorite.icon)
              : platformIcon(favorite.platform);
            return (
              <div
                className="flex h-full w-full items-center justify-center"
                style={{
                  backgroundColor: "#ffffff",
                  color: platformColor(favorite.platform),
                }}
              >
                <Icon size={28} className={broken ? "opacity-70" : ""} />
              </div>
            );
          })()
        )}
        {broken && (
          <span className="absolute left-1 top-1 rounded-md bg-white px-1 py-0.5 text-[10px] text-muted">
            已失效
          </span>
        )}
        {!hide && (
          <span className="absolute bottom-1 right-1 flex items-center gap-0.5 text-[8px] text-muted drop-shadow">
            <Eye size={8} strokeWidth={2} />
            {favorite.visitCount}
          </span>
        )}
      </button>

      <div className="flex min-w-0 flex-1 flex-col py-0.5">
        <button
          type="button"
          onClick={() => onOpen(favorite)}
          className={`block text-left text-[13px] font-normal leading-snug text-ink line-clamp-2 ${
            broken ? "line-through" : ""
          }`}
        >
          {favorite.title || "未命名收藏"}
        </button>

        {favorite.author && (
          <div className="mt-0.5 truncate text-xs text-muted">
            {favorite.author}
          </div>
        )}

        <div className="mt-auto flex items-center gap-1.5 pt-1.5">
          {favorite.platform && (
            <span
              className="shrink-0 rounded px-1 py-0.5 text-[7px] text-white"
              style={{ backgroundColor: platformColor(favorite.platform) }}
            >
              {platformName(favorite.platform)}
            </span>
          )}
          {tags.slice(0, 1).map((t) => (
            <span
              key={t}
              className="shrink-0 rounded bg-brand-soft px-1 py-0.5 text-[7px] text-ink"
            >
              #{t}
            </span>
          ))}
          {tags.length > 1 && (
            <span
              className="shrink-0 text-[10px] text-muted"
              title={tags.join("、")}
            >
              …
            </span>
          )}
          <span className="ml-auto flex shrink-0 items-center gap-1.5">
            <time
              title={new Date(favorite.createdAt).toLocaleString()}
              className="text-[10px] text-muted"
            >
              {formatRelativeTime(favorite.createdAt)}
            </time>
          </span>
        </div>
      </div>
    </article>
  );
}

export default memo(FavoriteListItem);
