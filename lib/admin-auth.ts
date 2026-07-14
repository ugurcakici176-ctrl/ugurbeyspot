import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import {
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";

import { auth, db } from "@/lib/firebase";

export type AdminRole =
  | "super_admin"
  | "admin"
  | "editor";

export type AdminStatus =
  | "active"
  | "passive";

export interface AdminRecord {
  uid: string;
  email: string;
  displayName: string;
  role: AdminRole;
  status: AdminStatus;
  createdAt?: string;
  updatedAt?: string;
  lastLoginAt?: string;
}

export interface AdminSession {
  user: User;
  admin: AdminRecord;
}

export interface AdminRegistrationResult {
  uid: string;
  email: string;
  verificationSent: boolean;
}

const ADMIN_COLLECTION = "admins";

export const ADMIN_LOGIN_ROUTE = "/admin/giris";
export const ADMIN_REGISTER_ROUTE = "/admin/kayit";
export const ADMIN_DASHBOARD_ROUTE = "/admin";

function normalizeEmail(value: string): string {
  return value.trim().toLocaleLowerCase("tr-TR");
}

function getFirebaseErrorCode(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
  ) {
    return error.code;
  }

  return "";
}

function getAuthErrorMessage(error: unknown): string {
  const code = getFirebaseErrorCode(error);

  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "E-posta veya şifre hatalı.";

    case "auth/invalid-email":
      return "Geçerli bir e-posta adresi girin.";

    case "auth/email-already-in-use":
      return "Bu e-posta adresiyle daha önce hesap oluşturulmuş.";

    case "auth/weak-password":
      return "Şifre yeterince güçlü değil. En az 8 karakter kullanın.";

    case "auth/too-many-requests":
      return "Çok fazla deneme yapıldı. Bir süre sonra tekrar deneyin.";

    case "auth/network-request-failed":
      return "İnternet bağlantısı veya Firebase erişimi kontrol edilemedi.";

    case "auth/operation-not-allowed":
      return "Firebase Authentication üzerinde Email/Password girişi aktif değil.";

    default:
      return error instanceof Error
        ? error.message
        : "Kimlik doğrulama işlemi tamamlanamadı.";
  }
}

function parseAdminRecord(
  uid: string,
  userEmail: string | null,
  data: Record<string, unknown>,
): AdminRecord | null {
  const email =
    typeof data.email === "string"
      ? data.email
      : userEmail || "";

  const displayName =
    typeof data.displayName === "string"
      ? data.displayName
      : "Yönetici";

  const role =
    data.role === "super_admin" ||
    data.role === "admin" ||
    data.role === "editor"
      ? data.role
      : null;

  const status =
    data.status === "active" ||
    data.status === "passive"
      ? data.status
      : null;

  if (!role || !status) {
    return null;
  }

  return {
    uid,
    email,
    displayName,
    role,
    status,
    createdAt:
      typeof data.createdAt === "string"
        ? data.createdAt
        : undefined,
    updatedAt:
      typeof data.updatedAt === "string"
        ? data.updatedAt
        : undefined,
    lastLoginAt:
      typeof data.lastLoginAt === "string"
        ? data.lastLoginAt
        : undefined,
  };
}

async function readAdminRecord(
  user: User,
): Promise<AdminRecord | null> {
  const snapshot = await getDoc(
    doc(db, ADMIN_COLLECTION, user.uid),
  );

  if (!snapshot.exists()) {
    return null;
  }

  return parseAdminRecord(
    user.uid,
    user.email,
    snapshot.data(),
  );
}

async function touchLastLogin(
  uid: string,
): Promise<void> {
  const now = new Date().toISOString();

  try {
    await updateDoc(
      doc(db, ADMIN_COLLECTION, uid),
      {
        lastLoginAt: now,
        updatedAt: now,
      },
    );
  } catch (error) {
    console.warn(
      "Admin lastLoginAt could not be updated:",
      error,
    );
  }
}

export function isAdminRegistrationEnabled(): boolean {
  return (
    process.env
      .NEXT_PUBLIC_ENABLE_ADMIN_REGISTRATION ===
    "true"
  );
}

export async function loginAsAdmin(
  emailValue: string,
  password: string,
): Promise<AdminSession> {
  const email = normalizeEmail(emailValue);

  if (!email) {
    throw new Error("E-posta adresi zorunludur.");
  }

  if (!password) {
    throw new Error("Şifre zorunludur.");
  }

  try {
    const credential =
      await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );

    const admin = await readAdminRecord(
      credential.user,
    );

    if (!admin) {
      await signOut(auth);

      throw new Error(
        "Bu hesabın yönetim paneli yetkisi bulunmuyor.",
      );
    }

    if (admin.status !== "active") {
      await signOut(auth);

      throw new Error(
        "Yönetici hesabınız pasif durumda.",
      );
    }

    await touchLastLogin(credential.user.uid);

    return {
      user: credential.user,
      admin,
    };
  } catch (error) {
    const code = getFirebaseErrorCode(error);

    if (code) {
      throw new Error(
        getAuthErrorMessage(error),
      );
    }

    throw error instanceof Error
      ? error
      : new Error(
          "Yönetim paneline giriş yapılamadı.",
        );
  }
}

export async function logoutAdmin(): Promise<void> {
  await signOut(auth);
}

export async function sendAdminPasswordReset(
  emailValue: string,
): Promise<void> {
  const email = normalizeEmail(emailValue);

  if (!email) {
    throw new Error(
      "Şifre sıfırlama bağlantısı için e-posta adresinizi girin.",
    );
  }

  try {
    await sendPasswordResetEmail(
      auth,
      email,
    );
  } catch (error) {
    throw new Error(
      getAuthErrorMessage(error),
    );
  }
}

export async function registerAdminCandidate(
  emailValue: string,
  password: string,
): Promise<AdminRegistrationResult> {
  if (!isAdminRegistrationEnabled()) {
    throw new Error(
      "Yönetici kayıt ekranı kapalı.",
    );
  }

  const email = normalizeEmail(emailValue);

  if (!email) {
    throw new Error(
      "E-posta adresi zorunludur.",
    );
  }

  if (password.length < 8) {
    throw new Error(
      "Şifre en az 8 karakter olmalıdır.",
    );
  }

  try {
    const credential =
      await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );

    let verificationSent = false;

    try {
      await sendEmailVerification(
        credential.user,
      );

      verificationSent = true;
    } catch (error) {
      console.warn(
        "Verification email could not be sent:",
        error,
      );
    }

    const result: AdminRegistrationResult = {
      uid: credential.user.uid,
      email:
        credential.user.email || email,
      verificationSent,
    };

    await signOut(auth);

    return result;
  } catch (error) {
    throw new Error(
      getAuthErrorMessage(error),
    );
  }
}

export function observeAdminSession(
  callback: (
    session: AdminSession | null,
  ) => void,
): () => void {
  return onAuthStateChanged(
    auth,
    (user) => {
      void (async () => {
        if (!user) {
          callback(null);
          return;
        }

        try {
          const admin =
            await readAdminRecord(user);

          if (
            !admin ||
            admin.status !== "active"
          ) {
            await signOut(auth);
            callback(null);
            return;
          }

          callback({
            user,
            admin,
          });
        } catch (error) {
          console.error(
            "Admin session could not be verified:",
            error,
          );

          callback(null);
        }
      })();
    },
    (error) => {
      console.error(
        "Firebase auth observer error:",
        error,
      );

      callback(null);
    },
  );
}
