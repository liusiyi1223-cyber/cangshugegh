"use client";

import { memo, useState } from "react";
import { Eye } from "lucide-react";
import type { FavoriteWithCollections } from "@/lib/types";
import { platformColor, platformIcon, platformName } from "@/lib/platforms";
import { formatRelativeTime } from "@/lib/time";
import { iconFor } from "@/lib/iconMap";

function FavoriteCard({
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
      className={`relative mb-1 break-inside-avoid overflow-hidden rounded-[8px] border border-sand bg-white shadow-sm ${
        broken ? "opacity-60" : ""
      }`}
    >
      <button
        type="button"
        onClick={() => onOpen(favorite)}
        className="relative block w-full overflow-hidden bg-brand-soft text-left"
      >
        {favorite.cover && !coverError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={favorite.cover}
            alt=""
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setCoverError(true)}
            className={`block h-auto w-full ${broken ? "grayscale" : ""}`}
          />
        ) : (
          (() => {
            const Icon = favorite.icon
              ? iconFor(favorite.icon)
              : platformIcon(favorite.platform);
            return (
              <div
                className="flex aspect-[2/1] w-full items-center justify-center"
                style={{
                  backgroundColor: "#ffffff",
                  color: platformColor(favorite.platform),
                }}
              >
                <Icon size={32} className={broken ? "opacity-70" : ""} />
              </div>
            );
          })()
        )}
        {broken && (
          <span className="absolute left-2 top-2 rounded-md bg-white px-1.5 py-0.5 text-[9px] text-muted">
            已失效
          </span>
        )}
        {!hide && (
          <span className="absolute bottom-1.5 right-1.5 flex items-center gap-0.5 text-[9px] text-muted drop-shadow">
            <Eye size={9} strokeWidth={2} />
            {favorite.visitCount}
          </span>
        )}
      </button>

      <div className="px-3 pt-3">
        <div className="text-[13px] font-medium leading-snug text-ink">
          <button
            type="button"
            onClick={() => onOpen(favorite)}
            className={`block text-left ${broken ? "line-through" : ""}`}
          >
            {favorite.title || "未命名收藏"}
          </button>
        </div>

        {favorite.author && (
          <div className="mt-1 truncate text-[10px] text-muted">
            {favorite.author}
          </div>
        )}
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5 border-t border-[#e5e7eb] bg-[#f3f4f6] px-3 py-2">
        {favorite.platform && (
          <span
            className="shrink-0 rounded px-1 py-0.5 text-[8px] text-white"
            style={{ backgroundColor: platformColor(favorite.platform) }}
          >
            {platformName(favorite.platform)}
          </span>
        )}
        {tags.slice(0, 2).map((t) => (
          <span
            key={t}
            className="shrink-0 rounded bg-brand-soft px-1 py-0.5 text-[8px] text-brand-dark"
          >
            #{t}
          </span>
        ))}
        {tags.length > 2 && (
          <span
            className="shrink-0 text-[10px] text-muted"
            title={tags.join("、")}
          >
            …
          </span>
        )}
        <time
          title={new Date(favorite.createdAt).toLocaleString()}
          className="ml-auto shrink-0 text-[10px] text-muted"
        >
          {formatRelativeTime(favorite.createdAt)}
        </time>
      </div>
    </article>
  );
}

export default memo(FavoriteCard);
