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

  // 后台同步服务器主题色（跨设备 / 首次登录），仅在变化时更新
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((u) => {
        const pref = (u?.preferences as { themeColor?: string } | null)
          ?.themeColor;
        if (pref && pref !== readStoredTheme(defaultColor)) {
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
