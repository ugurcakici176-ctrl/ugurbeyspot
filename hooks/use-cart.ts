"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  addCartItem,
  CART_CHANGE_EVENT,
  clearCart,
  readCart,
  removeCartItem,
  type CartItem,
  updateCartItemQuantity,
} from "@/lib/cart";

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(() => {
    setItems(readCart());
    setReady(true);
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      refresh();
    }, 0);

    function handleChange(): void {
      refresh();
    }

    window.addEventListener(CART_CHANGE_EVENT, handleChange);
    window.addEventListener("storage", handleChange);

    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener(CART_CHANGE_EVENT, handleChange);
      window.removeEventListener("storage", handleChange);
    };
  }, [refresh]);

  const totalCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  );

  const totalPrice = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items],
  );

  function addItem(item: Omit<CartItem, "quantity">, quantity = 1): void {
    addCartItem(item, quantity);
    refresh();
  }

  function updateItemQuantity(productId: string, quantity: number): void {
    updateCartItemQuantity(productId, quantity);
    refresh();
  }

  function removeItem(productId: string): void {
    removeCartItem(productId);
    refresh();
  }

  function clearAll(): void {
    clearCart();
    refresh();
  }

  return {
    items,
    ready,
    totalCount,
    totalPrice,
    addItem,
    updateItemQuantity,
    removeItem,
    clearAll,
  };
}
