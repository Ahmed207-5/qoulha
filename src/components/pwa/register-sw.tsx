"use client";

import { useEffect } from "react";

// public/firebase-messaging-sw.js is now the only Service Worker this app
// registers. It used to be split in two — this component registered a
// separate /sw.js (whose only job was logging install/activate), while
// requestNotificationPermission() in src/lib/firebase-messaging.ts waited
// on navigator.serviceWorker.ready to get a push subscription. Whichever
// registration Chrome considered "ready" at that moment won the push
// subscription, and since /sw.js had no `push` event handling at all,
// FCM push events landed on a service worker that could never show them —
// Admin SDK kept reporting success while nothing ever displayed. Only
// registering firebase-messaging-sw.js means there's just one Service
// Worker, so .ready always resolves to the one that actually handles push.
export default function RegisterSW() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/firebase-messaging-sw.js")
        .then(() => {
          console.log("✅ Service Worker Registered");
        })
        .catch((err) => {
          console.error("❌ Service Worker Registration Failed", err);
        });
    }
  }, []);

  return null;
}