import { FirebaseError } from "firebase/app";
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytesResumable,
} from "firebase/storage";

import { UPLOAD_LIMITS } from "@/lib/constants";
import { storage } from "@/lib/firebase";
import type { ImageAsset } from "@/lib/types";
import {
  createId,
  safeFileName,
} from "@/lib/utils";

export interface UploadProgress {
  transferredBytes: number;
  totalBytes: number;
  percent: number;
}

export type UploadProgressCallback = (
  progress: UploadProgress,
) => void;

const CUSTOMER_IMAGE_MAX_EDGE = 1920;
const CUSTOMER_IMAGE_QUALITY = 0.78;

export async function optimizeImageForUpload(file: File): Promise<File> {
  if (typeof window === "undefined" || !file.type.startsWith("image/")) {
    return file;
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(
    1,
    CUSTOMER_IMAGE_MAX_EDGE / Math.max(bitmap.width, bitmap.height),
  );
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d", { alpha: false });
  if (!context) {
    bitmap.close();
    return file;
  }

  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/webp", CUSTOMER_IMAGE_QUALITY);
  });

  if (!blob || blob.size >= file.size) {
    return file;
  }

  const baseName = file.name.replace(/\.[^.]+$/, "") || "esya-fotografi";
  return new File([blob], `${baseName}.webp`, {
    type: "image/webp",
    lastModified: file.lastModified,
  });
}

function validateImageFile(file: File): void {
  if (
    !UPLOAD_LIMITS.allowedImageTypes.includes(
      file.type as
        (typeof UPLOAD_LIMITS.allowedImageTypes)[number],
    )
  ) {
    throw new Error(
      "Yalnızca JPG, PNG, WebP veya AVIF görseller yüklenebilir.",
    );
  }

  if (file.size > UPLOAD_LIMITS.maxImageSizeBytes) {
    throw new Error("Görsel boyutu en fazla 10 MB olabilir.");
  }
}

async function getImageDimensions(
  file: File,
): Promise<{
  width?: number;
  height?: number;
}> {
  if (typeof window === "undefined") {
    return {};
  }

  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      resolve({
        width: image.naturalWidth,
        height: image.naturalHeight,
      });
      URL.revokeObjectURL(objectUrl);
    };

    image.onerror = () => {
      resolve({});
      URL.revokeObjectURL(objectUrl);
    };

    image.src = objectUrl;
  });
}

export async function uploadImage(
  file: File,
  folder: string,
  alt: string,
  sortOrder = 0,
  onProgress?: UploadProgressCallback,
): Promise<ImageAsset> {
  validateImageFile(file);

  const id = createId();
  const fileName = `${id}-${safeFileName(file.name)}`;
  const storagePath = `${folder}/${fileName}`;
  const storageRef = ref(storage, storagePath);
  const dimensionsPromise = getImageDimensions(file);

  const uploadTask = uploadBytesResumable(
    storageRef,
    file,
    {
      contentType: file.type,
      customMetadata: {
        originalName: file.name.slice(0, 200),
      },
    },
  );

  await new Promise<void>((resolve, reject) => {
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const percent =
          snapshot.totalBytes > 0
            ? Math.round(
                (snapshot.bytesTransferred /
                  snapshot.totalBytes) *
                  100,
              )
            : 0;

        onProgress?.({
          transferredBytes: snapshot.bytesTransferred,
          totalBytes: snapshot.totalBytes,
          percent,
        });
      },
      reject,
      resolve,
    );
  });

  const [url, dimensions] = await Promise.all([
    getDownloadURL(uploadTask.snapshot.ref),
    dimensionsPromise,
  ]);

  return {
    id,
    url,
    storagePath,
    alt: alt.trim(),
    width: dimensions.width,
    height: dimensions.height,
    sortOrder,
  };
}

export async function uploadImages(
  files: File[],
  folder: string,
  alt: string,
): Promise<ImageAsset[]> {
  const uploaded: ImageAsset[] = [];

  for (const [index, file] of files.entries()) {
    uploaded.push(
      await uploadImage(file, folder, alt, index),
    );
  }

  return uploaded;
}

export async function uploadCustomerImages(
  files: File[],
  folder: string,
  alt: string,
  onProgress?: (percent: number) => void,
): Promise<ImageAsset[]> {
  onProgress?.(3);
  const optimized = await Promise.all(
    files.map(async (file) => {
      try {
        return await optimizeImageForUpload(file);
      } catch {
        // Eski tarayıcılarda görsel dönüştürme desteklenmiyorsa yüklemeyi
        // durdurmak yerine güvenli biçimde özgün dosyayla devam et.
        return file;
      }
    }),
  );
  onProgress?.(15);

  const transferred = optimized.map(() => 0);
  const totals = optimized.map((file) => file.size);
  const uploaded = await Promise.all(
    optimized.map((file, index) =>
      uploadImage(file, folder, alt, index, (item) => {
        transferred[index] = item.transferredBytes;
        totals[index] = item.totalBytes;
        const totalBytes = totals.reduce((sum, size) => sum + size, 0);
        const sentBytes = transferred.reduce((sum, size) => sum + size, 0);
        onProgress?.(
          Math.min(99, 15 + Math.round((sentBytes / totalBytes) * 84)),
        );
      }),
    ),
  );

  onProgress?.(100);
  return uploaded.sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function deleteImageAsset(
  image: Pick<ImageAsset, "storagePath">,
): Promise<void> {
  if (!image.storagePath) {
    return;
  }

  try {
    await deleteObject(
      ref(storage, image.storagePath),
    );
  } catch (error: unknown) {
    if (
      error instanceof FirebaseError &&
      error.code === "storage/object-not-found"
    ) {
      return;
    }

    throw error;
  }
}

export async function replaceImage(
  oldImage: ImageAsset | undefined,
  file: File,
  folder: string,
  alt: string,
): Promise<ImageAsset> {
  const newImage = await uploadImage(
    file,
    folder,
    alt,
    0,
  );

  if (oldImage) {
    await deleteImageAsset(oldImage);
  }

  return newImage;
}
