import {
  applicationDefault,
  getApp,
  getApps,
  initializeApp,
  type App,
} from "firebase-admin/app";

import {
  getFirestore,
  type Firestore,
} from "firebase-admin/firestore";

const CONTROL_APP_NAME =
  "dromocob-control-agent";

function getProjectId(): string {
  const projectId =
    process.env.FIREBASE_PROJECT_ID ||
    process.env.GOOGLE_CLOUD_PROJECT ||
    process.env.GCLOUD_PROJECT ||
    process.env
      .NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (!projectId) {
    throw new Error(
      "[DROMOCOB CONTROL] Firebase project ID bulunamadı."
    );
  }

  return projectId;
}

function getControlAdminApp(): App {
  const exists =
    getApps().some(
      (app) =>
        app.name ===
        CONTROL_APP_NAME
    );

  if (exists) {
    return getApp(
      CONTROL_APP_NAME
    );
  }

  return initializeApp(
    {
      credential:
        applicationDefault(),

      projectId:
        getProjectId(),
    },
    CONTROL_APP_NAME
  );
}

export function getControlDb(): Firestore {
  return getFirestore(
    getControlAdminApp()
  );
}