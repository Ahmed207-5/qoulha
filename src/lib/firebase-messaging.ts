import { getMessaging, getToken, isSupported } from "firebase/messaging";
import { firebaseApp } from "./firebase";

let messaging: ReturnType<typeof getMessaging> | null = null;

export async function getFirebaseMessaging() {
  if (!(await isSupported())) return null;

  if (!messaging) {
    messaging = getMessaging(firebaseApp);
  }

  return messaging;
}

export async function requestNotificationPermission() {
  const permission = await Notification.requestPermission();

  if (permission !== "granted") {
    return null;
  }

  const messaging = await getFirebaseMessaging();

  if (!messaging) {
    return null;
  }

  const token = await getToken(messaging, {
    vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    serviceWorkerRegistration: await navigator.serviceWorker.ready,
  });

  return token;
}