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

export function useThemeColor(defaultColor = "#ffffff") {
  const [themeColor, setThemeColorState] = useState(() =>
    readStoredTheme(defaultColor)
  );

  // 每次挂载都从服务器同步一次，以服务器为准，保证各页面主题色一致
  useEffect(() => {
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

  // 浅色品牌色（如白色）时，文字强调色用深墨色，避免白底白字看不见
  const isLight = readableOn(themeColor) === "#1d2630";
  const themeStyle = {
    "--color-brand": themeColor,
    "--color-brand-ink": isLight ? "#1d2630" : themeColor,
    "--color-brand-soft": isLight ? "#f4f6f8" : mixWhite(themeColor, 0.9),
    "--color-brand-dark": darken(themeColor, 0.15),
    "--color-onbrand": readableOn(themeColor),
  } as CSSProperties;

  return { themeColor, setThemeColor, themeStyle };
}
