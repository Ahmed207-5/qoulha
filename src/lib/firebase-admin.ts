import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getMessaging, type Messaging } from "firebase-admin/messaging";

// IMPORTANT: this must stay lazy.
//
// Next.js/Vercel evaluates (imports) route modules while *building* the
// project in order to trace each Route Handler into its own serverless
// function. If `initializeApp()`/`cert()` run eagerly at module load time
// (as they did before) and the FIREBASE_* env vars aren't present at build
// time, this throws synchronously during that trace step. Vercel then
// fails to produce a function for that route, so the deployed route
// doesn't exist at all -> requests to it 404, even though the code and
// deployment otherwise succeed. Making init lazy means the credentials are
// only touched the first time the handler actually runs, so any missing-env
// problem surfaces as a normal 500 from the route's own try/catch instead
// of a silent 404.
function getFirebaseAdminApp(): App {
  const existingApp = getApps()[0];
  if (existingApp) return existingApp;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Firebase Admin credentials are missing. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in your environment (on Vercel: Project Settings -> Environment Variables, for all environments you deploy to)."
    );
  }

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
}

let messagingInstance: Messaging | null = null;

function getMessagingInstance(): Messaging {
  if (!messagingInstance) {
    messagingInstance = getMessaging(getFirebaseAdminApp());
  }
  return messagingInstance;
}

// Kept as `adminMessaging` (same name/shape as before) so every existing
// call site, e.g. `adminMessaging.send(...)` in route.ts, keeps working
// with zero changes. The proxy defers the real initialization above until
// a method is actually called at request time.
export const adminMessaging: Messaging = new Proxy({} as Messaging, {
  get(_target, prop) {
    const instance = getMessagingInstance();
    const value = Reflect.get(instance, prop, instance);
    return typeof value === "function" ? value.bind(instance) : value;
  },
});
