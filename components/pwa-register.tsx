"use client";

import { useEffect } from "react";

export default function PWARegister() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      const register = () => {
        navigator.serviceWorker.register("/sw.js").catch((err) => {
          console.warn("Service Worker registration failed:", err);
        });
      };

      if (document.readyState === "complete") {
        register();
      } else {
        window.addEventListener("load", register);
        // Fallback for cases where load event is missed or delayed
        const timeout = setTimeout(register, 3000);
        return () => {
          window.removeEventListener("load", register);
          clearTimeout(timeout);
        };
      }
    }
  }, []);

  return null;
}
