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

messaging.onBackgroundMessage((payload) => {
  const notification = payload.notification || {};

  self.registration.showNotification(notification.title || "قولها", {
    body: notification.body || "",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    data: payload.data || {},
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification.data?.url || "/notifications";

  event.waitUntil(
    clients.openWindow(url)
  );
});