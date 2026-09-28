"use client";

import { useEffect } from "react";

/** Registra o service worker (instalável + offline). Sem UI. */
export function PwaSetup() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);
  return null;
}
