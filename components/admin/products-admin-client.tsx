"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useCanDeleteRecords } from "@/components/admin/admin-form-utils";
import AdminPageHeading from "@/components/admin/admin-page-heading";
import Icon from "@/components/ui/icon";
import { PRODUCT_STATUS_LABELS, ROUTES } from "@/lib/constants";
import {
  findProductTitleFixes,
  replaceTitleInSeo,
} from "@/lib/product-name";
import { deleteProduct, getProducts, updateProduct } from "@/lib/products";
import type { Product } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";

function getErrorMessage(reason: unknown, fallback: string): string {
  return reason instanceof Error && reason.message ? reason.message : fallback;
}

export default function ProductsAdminClient() {
  const canDelete = useCanDeleteRecords();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [fixPanelOpen, setFixPanelOpen] = useState(false);
  const [skippedFixIds, setSkippedFixIds] = useState<Set<string>>(new Set());
  const [applyingFixes, setApplyingFixes] = useState(false);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      setProducts(await getProducts({ includePassive: true }));
    } catch (reason: unknown) {
      console.error("Products load error:", reason);
      setError(getErrorMessage(reason, "Ürünler yüklenemedi."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadProducts();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadProducts]);

  const visibleProducts = useMemo(() => {
    const value = search.trim().toLocaleLowerCase("tr-TR");

    if (!value) return products;

    return products.filter((product) =>
      [product.title, product.categoryName || ""]
        .join(" ")
        .toLocaleLowerCase("tr-TR")
        .includes(value),
    );
  }, [products, search]);

  const titleFixes = useMemo(() => findProductTitleFixes(products), [products]);

  async function applyTitleFixes() {
    const selected = titleFixes.filter((fix) => !skippedFixIds.has(fix.id));

    if (selected.length === 0) return;

    setError(null);
    setMessage(null);
    setApplyingFixes(true);

    let done = 0;

    try {
      for (const fix of selected) {
        const product = products.find((item) => item.id === fix.id);
        if (!product) continue;

        // Bağlantı (slug) değişmez: Google'daki adresler bozulmasın.
        await updateProduct(product.id, {
          title: fix.to,
          seo: {
            ...product.seo,
            title: replaceTitleInSeo(product.seo.title, fix.from, fix.to),
          },
          images: product.images.map((image) => ({
            ...image,
            alt: replaceTitleInSeo(image.alt, fix.from, fix.to),
          })),
        });
        done += 1;
      }

      setMessage(`${done} ürünün adı düzeltildi.`);
      setFixPanelOpen(false);
      setSkippedFixIds(new Set());
      await loadProducts();
    } catch (reason: unknown) {
      console.error("Product title fix error:", reason);
      setError(
        `${done} ürün düzeltildi, sonrası kaydedilemedi: ${getErrorMessage(reason, "bilinmeyen hata")}`,
      );
      await loadProducts();
    } finally {
      setApplyingFixes(false);
    }
  }

  async function handleDelete(product: Product) {
    if (
      !window.confirm(
        `"${product.title}" ürününü silmek istediğinize emin misiniz?`,
      )
    ) {
      return;
    }

    setError(null);
    setMessage(null);
    setDeletingId(product.id);

    try {
      await deleteProduct(product.id);
      setMessage(`"${product.title}" silindi.`);
      await loadProducts();
    } catch (reason: unknown) {
      console.error("Product delete error:", reason);
      setError(getErrorMessage(reason, "Ürün silinemedi."));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <AdminPageHeading
        eyebrow="KATALOG"
        title="Ürün Yönetimi"
        description="Ürünleri ekleyin, düzenleyin, öne çıkarın veya yayından kaldırın."
        actions={
          <>
            {titleFixes.length > 0 && (
              <button
                type="button"
                className="admin-secondary-button"
                onClick={() => setFixPanelOpen((open) => !open)}
              >
                <Icon name="edit" size={18} />
                İsimleri düzelt ({titleFixes.length})
              </button>
            )}
            <Link href={ROUTES.adminNewProduct} className="admin-primary-button">
              <Icon name="plus" size={18} />
              Yeni Ürün
            </Link>
          </>
        }
      />

      {error && (
        <div className="admin-notice admin-notice--error" role="alert">
          {error}
        </div>
      )}

      {message && (
        <div className="admin-notice admin-notice--info" role="status">
          {message}
        </div>
      )}

      {fixPanelOpen && titleFixes.length > 0 && (
        <section className="admin-panel admin-title-fixes">
          <h2>Ürün adı düzeltmeleri</h2>
          <p>
            Yazım hataları ve büyük harf düzeni otomatik bulundu. Uygulamak
            istemediğiniz satırın işaretini kaldırın. Ürün bağlantıları değişmez.
          </p>
          <ul>
            {titleFixes.map((fix) => (
              <li key={fix.id}>
                <label>
                  <input
                    type="checkbox"
                    checked={!skippedFixIds.has(fix.id)}
                    onChange={(event) =>
                      setSkippedFixIds((current) => {
                        const next = new Set(current);
                        if (event.target.checked) next.delete(fix.id);
                        else next.add(fix.id);
                        return next;
                      })
                    }
                  />
                  <span>
                    <del>{fix.from}</del> → <strong>{fix.to}</strong>
                  </span>
                </label>
              </li>
            ))}
          </ul>
          <div className="admin-title-fixes__actions">
            <button
              type="button"
              className="admin-primary-button"
              disabled={applyingFixes || skippedFixIds.size >= titleFixes.length}
              onClick={() => void applyTitleFixes()}
            >
              {applyingFixes
                ? "Kaydediliyor..."
                : `Seçilenleri uygula (${titleFixes.length - skippedFixIds.size})`}
            </button>
            <button
              type="button"
              className="admin-secondary-button"
              disabled={applyingFixes}
              onClick={() => setFixPanelOpen(false)}
            >
              Vazgeç
            </button>
          </div>
        </section>
      )}

      <section className="admin-panel">
        <div className="admin-table-toolbar">
          <label className="admin-search">
            <Icon name="search" size={18} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Ürün ara..."
            />
          </label>
          <span>{visibleProducts.length} ürün</span>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Ürün</th>
                <th>Fiyat</th>
                <th>Durum</th>
                <th>Tarih</th>
                <th />
              </tr>
            </thead>

            <tbody>
              {visibleProducts.map((product) => (
                <tr key={product.id}>
                  <td>
                    <div className="admin-product-cell">
                      <span>
                        {product.images[0] ? (
                          <img
                            src={product.images[0].url}
                            alt={product.images[0].alt || product.title}
                          />
                        ) : (
                          <Icon name="package" size={20} />
                        )}
                      </span>
                      <div>
                        <strong>{product.title}</strong>
                        <small>{product.categoryName || "Kategori"}</small>
                      </div>
                    </div>
                  </td>

                  <td><strong>{formatCurrency(product.price)}</strong></td>

                  <td>
                    <span className={`admin-status admin-status--${product.status}`}>
                      {PRODUCT_STATUS_LABELS[product.status]}
                    </span>
                  </td>

                  <td>{formatDate(product.createdAt)}</td>

                  <td>
                    <div className="admin-row-actions">
                      <Link
                        href={ROUTES.editProduct(product.id)}
                        aria-label="Düzenle"
                      >
                        <Icon name="edit" size={17} />
                      </Link>

                      {canDelete && (
                        <button
                          type="button"
                          aria-label="Sil"
                          disabled={deletingId === product.id}
                          onClick={() => void handleDelete(product)}
                        >
                          <Icon name="trash" size={17} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {loading && products.length === 0 && (
          <div className="admin-empty">Ürünler yükleniyor...</div>
        )}

        {!loading && visibleProducts.length === 0 && (
          <div className="admin-empty">Henüz ürün bulunmuyor.</div>
        )}
      </section>
    </>
  );
}
