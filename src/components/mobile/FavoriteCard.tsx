"use client";

import { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import type { FavoriteWithCollections } from "@/lib/types";
import { platformColor, platformIcon, platformName } from "@/lib/platforms";
import { formatRelativeTime } from "@/lib/time";

export default function FavoriteCard({
  favorite,
  onOpen,
}: {
  favorite: FavoriteWithCollections;
  onOpen: (f: FavoriteWithCollections) => void;
}) {
  const broken = favorite.status === "BROKEN";
  const tags = favorite.tags ?? [];
  const [coverError, setCoverError] = useState(false);

  return (
    <article
      className={`mb-2.5 break-inside-avoid overflow-hidden rounded-[14px] border border-sand bg-white shadow-sm ${
        broken ? "opacity-60" : ""
      }`}
    >
      <a
        href={favorite.url}
        target="_blank"
        rel="noreferrer"
        className="relative block overflow-hidden bg-brand-soft"
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
            const Icon = platformIcon(favorite.platform);
            return (
              <div
                className="flex aspect-[16/10] w-full items-center justify-center"
                style={{
                  backgroundColor: platformColor(favorite.platform),
                  color: "#ffffff",
                }}
              >
                <Icon size={48} className={broken ? "opacity-70" : ""} />
              </div>
            );
          })()
        )}
        {broken && (
          <span className="absolute left-2 top-2 rounded-md bg-white px-1.5 py-0.5 text-[10px] text-muted">
            已失效
          </span>
        )}
      </a>

      <div className="p-3">
        <div className="text-[13px] font-semibold leading-snug text-ink">
          <a
            href={favorite.url}
            target="_blank"
            rel="noreferrer"
            className={broken ? "line-through" : ""}
          >
            {favorite.title || "未命名收藏"}
          </a>
          <button
            type="button"
            onClick={() => onOpen(favorite)}
            aria-label="更多操作"
            className="float-right ml-2 text-ink"
          >
            <MoreHorizontal size={18} strokeWidth={2} />
          </button>
        </div>

        {favorite.author && (
          <div className="mt-1 truncate text-[10px] text-muted">
            {favorite.author}
          </div>
        )}

        <div className="mt-2.5 border-t border-[#f0f2f4] pt-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {favorite.platform && (
              <span className="shrink-0 rounded bg-brand-soft px-1.5 py-0.5 text-[10px] text-brand">
                {platformName(favorite.platform)}
              </span>
            )}
            {tags.map((t) => (
              <span
                key={t}
                className="shrink-0 rounded bg-brand-soft px-1.5 py-0.5 text-[10px] text-brand-dark"
              >
                #{t}
              </span>
            ))}
            <time
              title={new Date(favorite.createdAt).toLocaleString()}
              className="ml-auto shrink-0 text-[10px] text-muted"
            >
              {formatRelativeTime(favorite.createdAt)}
            </time>
          </div>
        </div>
      </div>
    </article>
  );
}
