"use client";

import { useEffect, useState } from "react";

export function useHideVisitCount() {
  const [hide, setHide] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((u) => {
        const pref = (u?.preferences as { hideVisitCount?: boolean } | null)
          ?.hideVisitCount;
        if (pref !== undefined) setHide(pref);
      })
      .catch(() => {});
  }, []);

  function setHideVisitCount(value: boolean) {
    setHide(value);
    fetch("/api/auth/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ preferences: { hideVisitCount: value } }),
    }).catch(() => {});
  }

  return { hide, setHideVisitCount };
}
