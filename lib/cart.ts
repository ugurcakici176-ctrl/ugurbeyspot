import { formatCurrency } from "@/lib/utils";

export interface CartItem {
  productId: string;
  slug: string;
  title: string;
  price: number;
  imageUrl?: string;
  quantity: number;
}

const CART_STORAGE_KEY = "ugurbey_cart_v1";
export const CART_CHANGE_EVENT = "ugurbey:cart-change";

function canUseStorage(): boolean {
  return typeof window !== "undefined";
}

function sanitizeItems(value: unknown): CartItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => item as Partial<CartItem>)
    .filter(
      (item) =>
        typeof item.productId === "string" &&
        item.productId.length > 0 &&
        typeof item.slug === "string" &&
        item.slug.length > 0 &&
        typeof item.title === "string" &&
        item.title.length > 0 &&
        typeof item.price === "number" &&
        Number.isFinite(item.price) &&
        typeof item.quantity === "number" &&
        Number.isFinite(item.quantity),
    )
    .map((item) => ({
      productId: item.productId as string,
      slug: item.slug as string,
      title: item.title as string,
      price: item.price as number,
      imageUrl:
        typeof item.imageUrl === "string" && item.imageUrl
          ? item.imageUrl
          : undefined,
      quantity: Math.max(1, Math.floor(item.quantity as number)),
    }));
}

export function readCart(): CartItem[] {
  if (!canUseStorage()) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);

    if (!raw) {
      return [];
    }

    return sanitizeItems(JSON.parse(raw) as unknown);
  } catch {
    return [];
  }
}

function writeCart(items: CartItem[]): void {
  if (!canUseStorage()) {
    return;
  }

  const normalized = sanitizeItems(items);
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(normalized));
  window.dispatchEvent(new CustomEvent(CART_CHANGE_EVENT));
}

export function addCartItem(item: Omit<CartItem, "quantity">, quantity = 1): void {
  const items = readCart();
  const safeQuantity = Math.max(1, Math.floor(quantity));
  const index = items.findIndex((entry) => entry.productId === item.productId);

  if (index > -1) {
    items[index] = {
      ...items[index],
      title: item.title,
      slug: item.slug,
      price: item.price,
      imageUrl: item.imageUrl,
      quantity: items[index].quantity + safeQuantity,
    };
  } else {
    items.push({
      ...item,
      quantity: safeQuantity,
    });
  }

  writeCart(items);
}

export function updateCartItemQuantity(productId: string, quantity: number): void {
  const items = readCart();
  const nextQuantity = Math.floor(quantity);

  if (nextQuantity <= 0) {
    writeCart(items.filter((item) => item.productId !== productId));
    return;
  }

  writeCart(
    items.map((item) =>
      item.productId === productId
        ? {
            ...item,
            quantity: nextQuantity,
          }
        : item,
    ),
  );
}

export function removeCartItem(productId: string): void {
  writeCart(readCart().filter((item) => item.productId !== productId));
}

export function clearCart(): void {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(CART_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent(CART_CHANGE_EVENT));
}

export function buildCartWhatsappMessage(items: CartItem[]): string {
  if (items.length === 0) {
    return "Merhaba, sepetimdeki urunler hakkinda bilgi almak istiyorum.";
  }

  const lines = items.map(
    (item, index) =>
      `${index + 1}. ${item.title} x${item.quantity} - ${formatCurrency(item.price)}`,
  );

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return [
    "Merhaba, sepetimdeki urunler icin teklif almak istiyorum:",
    ...lines,
    "",
    `Toplam: ${formatCurrency(total)}`,
  ].join("\n");
}
