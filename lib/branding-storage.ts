import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";

import { storage } from "@/lib/firebase";

export interface BrandAssetUploadResult {
  url: string;
  path: string;
}

const MAX_BRAND_ASSET_SIZE =
  5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

function safeFileName(
  fileName: string,
): string {
  return fileName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function uploadBrandLogo(
  file: File,
): Promise<BrandAssetUploadResult> {
  if (
    !ALLOWED_IMAGE_TYPES.has(
      file.type,
    )
  ) {
    throw new Error(
      "Logo JPG, PNG, WebP veya AVIF formatında olmalıdır.",
    );
  }

  if (
    file.size <= 0 ||
    file.size >
      MAX_BRAND_ASSET_SIZE
  ) {
    throw new Error(
      "Logo dosyası 5 MB'dan küçük olmalıdır.",
    );
  }

  const fileName =
    safeFileName(file.name) ||
    "site-logo";

  const storagePath =
    `branding/logo/${Date.now()}-${fileName}`;

  const storageRef = ref(
    storage,
    storagePath,
  );

  await uploadBytes(
    storageRef,
    file,
    {
      contentType: file.type,
      customMetadata: {
        originalName: file.name,
        assetType: "site-logo",
      },
    },
  );

  return {
    url:
      await getDownloadURL(
        storageRef,
      ),
    path: storagePath,
  };
}

export async function deleteBrandAsset(
  storagePath: string,
): Promise<void> {
  const normalized =
    storagePath.trim();

  if (!normalized) {
    return;
  }

  try {
    await deleteObject(
      ref(
        storage,
        normalized,
      ),
    );
  } catch (error) {
    console.warn(
      "Previous brand asset could not be deleted:",
      error,
    );
  }
}
