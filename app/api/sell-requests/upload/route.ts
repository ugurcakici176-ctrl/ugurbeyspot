import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { STORAGE_PATHS, UPLOAD_LIMITS } from "@/lib/constants";
import { getAdminStorage } from "@/lib/firebase-admin";
import { limitByIp } from "@/lib/server/rate-limit";
import { createId, safeFileName } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REQUEST_KEY_PATTERN = /^\d{10,16}-[a-z0-9]{2,16}$/;
const UPLOADS_PER_HOUR = 40;

type ImageKind = { contentType: string };

// Uzantıya/başlığa güvenmeden dosya imzasından gerçek türü bulur.
function detectImage(bytes: Uint8Array): ImageKind | null {
  const ascii = (start: number, end: number) =>
    String.fromCharCode(...bytes.subarray(start, end));

  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { contentType: "image/jpeg" };
  }

  if (
    bytes[0] === 0x89 &&
    ascii(1, 4) === "PNG"
  ) {
    return { contentType: "image/png" };
  }

  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") {
    return { contentType: "image/webp" };
  }

  if (ascii(4, 8) === "ftyp" && ["avif", "avis"].includes(ascii(8, 12))) {
    return { contentType: "image/avif" };
  }

  return null;
}

function readDimension(value: FormDataEntryValue | null): number | undefined {
  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed > 0 && parsed <= 20000
    ? parsed
    : undefined;
}

/**
 * Satış talebi fotoğrafları. Ziyaretçi Storage'a doğrudan yazamaz (storage.rules);
 * dosya burada doğrulanıp Admin SDK ile yüklenir.
 */
export async function POST(request: Request) {
  const limited = await limitByIp(
    request,
    "sell-request-upload",
    UPLOADS_PER_HOUR,
    60 * 60 * 1000,
  );

  if (limited) {
    return limited;
  }

  let form: FormData;

  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "Gecersiz istek." }, { status: 400 });
  }

  const file = form.get("file");
  const requestKey = String(form.get("requestKey") || "");
  const alt = String(form.get("alt") || "").trim().slice(0, 160);
  const sortOrder = Number(form.get("sortOrder"));

  if (
    !(file instanceof File) ||
    !REQUEST_KEY_PATTERN.test(requestKey) ||
    !Number.isInteger(sortOrder) ||
    sortOrder < 0 ||
    sortOrder > 5
  ) {
    return NextResponse.json({ ok: false, error: "Gecersiz fotograf verisi." }, { status: 400 });
  }

  if (file.size <= 0 || file.size > UPLOAD_LIMITS.maxImageSizeBytes) {
    return NextResponse.json(
      { ok: false, error: "Fotograf boyutu cok buyuk." },
      { status: 413 },
    );
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = detectImage(bytes);

  if (!kind) {
    return NextResponse.json(
      { ok: false, error: "Sadece JPG, PNG, WEBP veya AVIF fotograf yuklenebilir." },
      { status: 415 },
    );
  }

  const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  const id = createId();
  const storagePath = `${STORAGE_PATHS.sellRequests}/${requestKey}/${id}-${safeFileName(file.name).slice(-80)}`;
  const downloadToken = randomUUID();

  try {
    const bucket = getAdminStorage().bucket(bucketName);

    await bucket.file(storagePath).save(Buffer.from(bytes), {
      resumable: false,
      contentType: kind.contentType,
      metadata: {
        metadata: {
          originalName: file.name.slice(0, 200),
          // Firebase indirme URL'si bu token ile çalışır (getDownloadURL ile aynı biçim).
          firebaseStorageDownloadTokens: downloadToken,
        },
      },
    });

    const url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(storagePath)}?alt=media&token=${downloadToken}`;

    return NextResponse.json({
      ok: true,
      image: {
        id,
        url,
        storagePath,
        alt,
        width: readDimension(form.get("width")),
        height: readDimension(form.get("height")),
        sortOrder,
      },
    });
  } catch (error: unknown) {
    console.error("[sell-request-upload] failed", error);
    return NextResponse.json(
      { ok: false, error: "Fotograf yuklenemedi. Lutfen tekrar deneyin." },
      { status: 500 },
    );
  }
}
