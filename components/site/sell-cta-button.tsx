"use client";

import { useState, type ReactNode } from "react";

import SellItemModal from "@/components/site/sell-item-modal";

/** Sunucu sayfalarından satış talebi penceresini açan buton. */
export default function SellCtaButton({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>
        {children}
      </button>
      <SellItemModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
