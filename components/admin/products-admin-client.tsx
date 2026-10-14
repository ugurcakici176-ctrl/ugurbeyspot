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
import { deleteProduct, getProducts } from "@/lib/products";
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
          <Link href={ROUTES.adminNewProduct} className="admin-primary-button">
            <Icon name="plus" size={18} />
            Yeni Ürün
          </Link>
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
