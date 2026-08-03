// Carried over from the old public/sw.js (now removed — it registered a
// second, separate Service Worker whose only job was this): activate this
// worker immediately instead of waiting for all existing tabs to close.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});

// notificationclick is registered before importScripts()/firebase.initializeApp()
// per Firebase's own guidance: "make sure to handle notificationclick before
// you import FCM functions or libraries. Otherwise, FCM may overwrite the
// custom behavior." (https://firebase.google.com/docs/cloud-messaging/web/receive-messages)
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification.data?.url || "/notifications";

  event.waitUntil(clients.openWindow(url));
});

importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyDvD5Zqj4sPyve91bzhT6_TJUSD6fIuc98",
  authDomain: "qoulha-57322.firebaseapp.com",
  projectId: "qoulha-57322",
  storageBucket: "qoulha-57322.firebasestorage.app",
  messagingSenderId: "589783748972",
  appId: "1:589783748972:web:5f51914fef61692189e349",
});

const messaging = firebase.messaging();

// src/lib/push-notifications.ts sends a DATA-ONLY message (no top-level
// `notification` field) specifically so this handler is the single,
// deterministic place that decides what's shown — see the comment there
// for why. Everything the notification needs (title/body/url) travels as
// plain strings inside `payload.data`.
messaging.onBackgroundMessage((payload) => {
  const data = payload.data || {};

  self.registration.showNotification(data.title || "قولها", {
    body: data.body || "",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    data: { url: data.url || "/notifications" },
  });
});