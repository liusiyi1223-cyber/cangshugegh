"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { darken, mixWhite, readableOn } from "./color";

const THEME_KEY = "themeColor";

function readStoredTheme(defaultColor: string): string {
  if (typeof window === "undefined") return defaultColor;
  try {
    return localStorage.getItem(THEME_KEY) || defaultColor;
  } catch {
    return defaultColor;
  }
}

export function useThemeColor(defaultColor = "#1b3a63") {
  // 初始值直接读 localStorage，避免每次导航闪回默认色
  const [themeColor, setThemeColorState] = useState(() =>
    readStoredTheme(defaultColor)
  );

  // 后台从服务器同步一次，以服务器为准，避免本地缓存过期导致颜色不一致
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((u) => {
        const pref = (u?.preferences as { themeColor?: string } | null)
          ?.themeColor;
        if (pref && pref !== themeColor) {
          setThemeColorState(pref);
          try {
            localStorage.setItem(THEME_KEY, pref);
          } catch {}
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultColor]);

  function setThemeColor(value: string) {
    setThemeColorState(value);
    try {
      localStorage.setItem(THEME_KEY, value);
    } catch {}
    fetch("/api/auth/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ preferences: { themeColor: value } }),
    }).catch(() => {});
  }

  const themeStyle = {
    "--color-brand": themeColor,
    "--color-brand-soft": mixWhite(themeColor, 0.9),
    "--color-brand-dark": darken(themeColor, 0.15),
    "--color-onbrand": readableOn(themeColor),
  } as CSSProperties;

  return { themeColor, setThemeColor, themeStyle };
}
