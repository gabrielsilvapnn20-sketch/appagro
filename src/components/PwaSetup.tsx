"use client";

import { useEffect } from "react";

/** Registra o service worker (instalável + offline). Sem UI. */
export function PwaSetup() {
  useEffect(() => {
    // aplica o tema salvo (claro/escuro); "auto" segue o sistema
    try {
      const t = localStorage.getItem("agrogiro_theme");
      if (t === "dark" || t === "light") {
        document.documentElement.setAttribute("data-theme", t);
      }
    } catch {
      /* ignore */
    }
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);
  return null;
}
