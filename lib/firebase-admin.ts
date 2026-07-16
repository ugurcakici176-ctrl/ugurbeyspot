import {
  applicationDefault,
  getApp,
  getApps,
  initializeApp,
  type App,
  type AppOptions,
} from "firebase-admin/app";

import {
  getAuth,
  type Auth,
} from "firebase-admin/auth";

import {
  getFirestore,
  type Firestore,
} from "firebase-admin/firestore";

const ADMIN_APP_NAME = "ugurbey-server";

function resolveProjectId(): string | undefined {
  return (
    process.env.FIREBASE_PROJECT_ID ||
    process.env.GOOGLE_CLOUD_PROJECT ||
    process.env.GCLOUD_PROJECT ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  );
}

function getOrCreateAdminApp(): App {
  const existing = getApps().find((app) => app.name === ADMIN_APP_NAME);

  if (existing) {
    return getApp(ADMIN_APP_NAME);
  }

  const options: AppOptions = {
    credential: applicationDefault(),
  };

  const projectId = resolveProjectId();

  if (projectId) {
    options.projectId = projectId;
  }

  return initializeApp(options, ADMIN_APP_NAME);
}

export function getAdminDb(): Firestore {
  return getFirestore(getOrCreateAdminApp());
}

export function getAdminAuth(): Auth {
  return getAuth(getOrCreateAdminApp());
}
