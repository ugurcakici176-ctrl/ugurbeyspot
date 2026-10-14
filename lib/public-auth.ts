import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";

import {
  doc,
  getDoc,
} from "firebase/firestore";

import { auth, db } from "@/lib/firebase";

const VERIFICATION_CACHE_MS = 60_000;
let verificationCache: {
  uid: string;
  at: number;
  promise: Promise<boolean>;
} | null = null;

/**
 * Giriş yapmış kullanıcının e-postası 6 haneli kodla doğrulanmış mı?
 * Aynı sayfadaki birçok bileşen sorduğu için sonuç kısa süre paylaşılır.
 */
export function fetchEmailVerifiedByCode(force = false): Promise<boolean> {
  const user = auth.currentUser;

  if (!user) {
    return Promise.resolve(false);
  }

  if (
    !force &&
    verificationCache?.uid === user.uid &&
    Date.now() - verificationCache.at < VERIFICATION_CACHE_MS
  ) {
    return verificationCache.promise;
  }

  const promise = (async () => {
    const token = await user.getIdToken();
    const response = await fetch("/api/auth/verification-status", {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const payload = (await response.json().catch(() => null)) as {
      verified?: boolean;
    } | null;

    return response.ok && payload?.verified === true;
  })();

  verificationCache = { uid: user.uid, at: Date.now(), promise };
  promise.catch(() => {
    if (verificationCache?.promise === promise) {
      verificationCache = null;
    }
  });

  return promise;
}

export interface PublicSession {
  user: User;
  isAdmin: boolean;
  adminRole: string | null;
}

function normalizeEmail(value: string): string {
  // E-postalar dil kuralından bağımsız küçültülür ("I" → "i", "ı" değil).
  return value
    .trim()
    .toLowerCase();
}

function getFirebaseErrorCode(
  error: unknown,
): string {
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

function getAuthErrorMessage(
  error: unknown,
): string {
  const code =
    getFirebaseErrorCode(error);

  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "E-posta veya şifre hatalı.";

    case "auth/email-already-in-use":
      return "Bu e-posta adresi zaten kullanılıyor.";

    case "auth/invalid-email":
      return "Geçerli bir e-posta adresi girin.";

    case "auth/weak-password":
      return "Şifre yeterince güçlü değil.";

    case "auth/too-many-requests":
      return "Çok fazla deneme yapıldı. Bir süre sonra tekrar deneyin.";

    case "auth/network-request-failed":
      return "İnternet bağlantısı kontrol edilemedi.";

    case "auth/operation-not-allowed":
      return "E-posta ve şifre ile giriş Firebase üzerinde aktif değil.";

    default:
      return error instanceof Error
        ? error.message
        : "Kimlik doğrulama işlemi tamamlanamadı.";
  }
}

async function getAdminStatus(
  uid: string,
): Promise<{
  isAdmin: boolean;
  role: string | null;
}> {
  try {
    const snapshot = await getDoc(
      doc(
        db,
        "admins",
        uid,
      ),
    );

    if (!snapshot.exists()) {
      return {
        isAdmin: false,
        role: null,
      };
    }

    const data = snapshot.data();

    const active =
      data.status === "active";

    const validRole =
      data.role === "super_admin" ||
      data.role === "admin" ||
      data.role === "editor";

    return {
      isAdmin:
        active &&
        validRole,

      role:
        active &&
        validRole
          ? data.role
          : null,
    };
  } catch (error) {
    console.warn(
      "Admin status could not be checked:",
      error,
    );

    return {
      isAdmin: false,
      role: null,
    };
  }
}

export async function loginPublicUser(
  emailValue: string,
  password: string,
): Promise<PublicSession> {
  const email =
    normalizeEmail(emailValue);

  if (!email) {
    throw new Error(
      "E-posta adresi zorunludur.",
    );
  }

  if (!password) {
    throw new Error(
      "Şifre zorunludur.",
    );
  }

  try {
    const credential =
      await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );

    const adminStatus =
      await getAdminStatus(
        credential.user.uid,
      );

    return {
      user: credential.user,
      isAdmin:
        adminStatus.isAdmin,
      adminRole:
        adminStatus.role,
    };
  } catch (error) {
    throw new Error(
      getAuthErrorMessage(error),
    );
  }
}

export async function registerPublicUser(
  displayNameValue: string,
  emailValue: string,
  password: string,
): Promise<User> {
  const displayName =
    displayNameValue.trim();

  const email =
    normalizeEmail(emailValue);

  if (displayName.length < 2) {
    throw new Error(
      "Ad soyad en az 2 karakter olmalıdır.",
    );
  }

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

    await updateProfile(
      credential.user,
      {
        displayName,
      },
    );

    await credential.user.reload();

    return credential.user;
  } catch (error) {
    throw new Error(
      getAuthErrorMessage(error),
    );
  }
}

export async function resendVerificationEmail(): Promise<void> {
  const user =
    auth.currentUser;

  if (!user) {
    throw new Error(
      "Oturum bulunamadı.",
    );
  }

  if (user.emailVerified) {
    return;
  }

  await sendEmailVerification(user);
}

export async function logoutPublicUser(): Promise<void> {
  await signOut(auth);
}

export function observePublicSession(
  callback: (
    session: PublicSession | null,
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

        const adminStatus =
          await getAdminStatus(
            user.uid,
          );

        callback({
          user,
          isAdmin:
            adminStatus.isAdmin,
          adminRole:
            adminStatus.role,
        });
      })();
    },

    (error) => {
      console.error(
        "Public auth observer error:",
        error,
      );

      callback(null);
    },
  );
}