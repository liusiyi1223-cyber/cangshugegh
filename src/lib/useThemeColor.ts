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
  // 先从 localStorage 读，避免每次导航都闪回默认色、也不用等网络
  const [themeColor, setThemeColorState] = useState(() =>
    readStoredTheme(defaultColor)
  );

  // 仅在本地无缓存（首次/清缓存后）才同步服务器，避免每次导航都多一次请求
  useEffect(() => {
    if (readStoredTheme(defaultColor) !== defaultColor) return;
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((u) => {
        const pref = (u?.preferences as { themeColor?: string } | null)
          ?.themeColor;
        if (pref) {
          setThemeColorState(pref);
          try {
            localStorage.setItem(THEME_KEY, pref);
          } catch {}
        }
      })
      .catch(() => {});
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
