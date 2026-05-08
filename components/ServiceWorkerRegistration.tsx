"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegistration() {
  useEffect(function registerSW() {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    window.addEventListener("load", function onLoad() {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then(function onRegistered(registration) {
          console.log("[SW] Registered, scope:", registration.scope);

          var updateInterval = setInterval(function checkUpdate() {
            registration.update().catch(function() {});
          }, 60 * 60 * 1000);

          registration.addEventListener("updatefound", function onUpdateFound() {
            var newWorker = registration.installing;
            if (!newWorker) return;
            var worker = newWorker;
            worker.addEventListener("statechange", function onStateChange() {
              if (worker.state === "installed" && navigator.serviceWorker.controller) {
                worker.postMessage({ type: "SKIP_WAITING" });
              }
            });
          });

          return function cleanup() { clearInterval(updateInterval); };
        })
        .catch(function onError(err) {
          console.warn("[SW] Registration failed:", err);
        });
    });
  }, []);

  return null;
}
