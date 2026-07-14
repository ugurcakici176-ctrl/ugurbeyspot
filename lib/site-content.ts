import {
  doc,
  getDoc,
  setDoc,
  type DocumentData,
} from "firebase/firestore";

import {
  COLLECTIONS,
  DOCUMENTS,
} from "@/lib/constants";

import {
  DEFAULT_ABOUT_CONTENT,
  DEFAULT_HOMEPAGE_CONTENT,
  DEFAULT_SITE_SETTINGS,
} from "@/lib/default-content";

import { db } from "@/lib/firebase";

import type {
  AboutContent,
  HomepageContent,
  SiteSettings,
} from "@/lib/types";

import {
  deepClone,
  deepMerge,
  stripUndefined,
} from "@/lib/utils";

async function readSingleton<T>(
  collectionName: string,
  documentId: string,
  fallback: T,
): Promise<T> {
  const documentReference = doc(
    db,
    collectionName,
    documentId,
  );

  const snapshot = await getDoc(documentReference);

  if (!snapshot.exists()) {
    return deepClone(fallback);
  }

  return deepMerge(
    deepClone(fallback),
    snapshot.data() as Partial<T>,
  );
}

async function writeSingleton<T extends object>(
  collectionName: string,
  documentId: string,
  value: T,
): Promise<void> {
  const documentReference = doc(
    db,
    collectionName,
    documentId,
  );

  const payload = stripUndefined(
    value,
  ) as DocumentData;

  await setDoc(
    documentReference,
    payload,
  );
}

export function getHomepageContent(): Promise<HomepageContent> {
  return readSingleton(
    COLLECTIONS.homepage,
    DOCUMENTS.homepage,
    DEFAULT_HOMEPAGE_CONTENT,
  );
}

export async function saveHomepageContent(
  content: HomepageContent,
): Promise<void> {
  await writeSingleton(
    COLLECTIONS.homepage,
    DOCUMENTS.homepage,
    {
      ...content,
      updatedAt: new Date().toISOString(),
    },
  );
}

export function getAboutContent(): Promise<AboutContent> {
  return readSingleton(
    COLLECTIONS.about,
    DOCUMENTS.about,
    DEFAULT_ABOUT_CONTENT,
  );
}

export async function saveAboutContent(
  content: AboutContent,
): Promise<void> {
  await writeSingleton(
    COLLECTIONS.about,
    DOCUMENTS.about,
    {
      ...content,
      updatedAt: new Date().toISOString(),
    },
  );
}

export function getSiteSettings(): Promise<SiteSettings> {
  return readSingleton(
    COLLECTIONS.siteSettings,
    DOCUMENTS.siteSettings,
    DEFAULT_SITE_SETTINGS,
  );
}

export async function saveSiteSettings(
  settings: SiteSettings,
): Promise<void> {
  const now = new Date().toISOString();

  await writeSingleton(
    COLLECTIONS.siteSettings,
    DOCUMENTS.siteSettings,
    {
      ...settings,

      contact: {
        ...settings.contact,
        updatedAt: now,
      },

      updatedAt: now,
    },
  );
}