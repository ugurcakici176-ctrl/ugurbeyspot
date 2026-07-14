import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

import type { Analytics } from "firebase/analytics";

const firebaseEnv = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const requiredFirebaseEnv = {
  NEXT_PUBLIC_FIREBASE_API_KEY: firebaseEnv.apiKey,
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: firebaseEnv.authDomain,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: firebaseEnv.projectId,
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: firebaseEnv.storageBucket,
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:
    firebaseEnv.messagingSenderId,
  NEXT_PUBLIC_FIREBASE_APP_ID: firebaseEnv.appId,
};

for (const [key, value] of Object.entries(requiredFirebaseEnv)) {
  if (!value) {
    throw new Error(`Missing required Firebase environment variable: ${key}`);
  }
}

const firebaseConfig = {
  apiKey: firebaseEnv.apiKey!,
  authDomain: firebaseEnv.authDomain!,
  projectId: firebaseEnv.projectId!,
  storageBucket: firebaseEnv.storageBucket!,
  messagingSenderId: firebaseEnv.messagingSenderId!,
  appId: firebaseEnv.appId!,
  measurementId: firebaseEnv.measurementId,
};

export const firebaseApp =
  getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(firebaseApp);

export const db = getFirestore(firebaseApp);

export const storage = getStorage(firebaseApp);

let analyticsPromise: Promise<Analytics | null> | null = null;

export function getFirebaseAnalytics(): Promise<Analytics | null> {
  if (typeof window === "undefined") {
    return Promise.resolve(null);
  }

  if (!firebaseEnv.measurementId) {
    return Promise.resolve(null);
  }

  if (!analyticsPromise) {
    analyticsPromise = (async () => {
      const { getAnalytics, isSupported } = await import(
        "firebase/analytics"
      );

      const supported = await isSupported();

      if (!supported) {
        return null;
      }

      return getAnalytics(firebaseApp);
    })().catch((error: unknown) => {
      console.error("Firebase Analytics could not be initialized:", error);

      return null;
    });
  }

  return analyticsPromise;
}