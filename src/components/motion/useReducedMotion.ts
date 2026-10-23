"use client";

import { useSyncExternalStore } from "react";

export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (avisar) => {
      if (typeof window === "undefined" || !window.matchMedia) return () => {};
      const midia = window.matchMedia(query);
      midia.addEventListener("change", avisar);
      return () => midia.removeEventListener("change", avisar);
    },
    () => (window.matchMedia ? window.matchMedia(query).matches : false),
    () => false,
  );
}

export function useReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}
