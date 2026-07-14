import Link from "next/link";

import Icon from "@/components/ui/icon";
import { ROUTES } from "@/lib/constants";
import type { Product } from "@/lib/types";
import { formatCurrency, getDiscountPercent } from "@/lib/utils";

export default function ProductCard({ product }: { product: Product }) {
  const image = [...product.images].sort(
    (a, b) => a.sortOrder - b.sortOrder,
  )[0];

  const discount = getDiscountPercent(
    product.price,
    product.compareAtPrice,
  );

  return (
    <article className="product-card">
      <Link
        className="product-card__image"
        href={ROUTES.product(product.slug)}
        aria-label={`${product.title} ürününü incele`}
      >
        {image ? (
          <img
            src={image.url}
            alt={image.alt || product.title}
            loading="lazy"
          />
        ) : (
          <span className="product-placeholder">
            <Icon name="package" size={34} />
          </span>
        )}

        <div className="product-card__badges">
          {product.isNew && <span className="badge">Yeni</span>}
          {discount > 0 && (
            <span className="badge badge--accent">%{discount}</span>
          )}
          {(product.status === "sold_out" ||
            product.stockStatus === "out_of_stock") && (
            <span className="badge badge--dark">Tükendi</span>
          )}
        </div>
      </Link>

      <div className="product-card__content">
        <span className="product-card__category">
          {product.categoryName || "Ürün"}
        </span>

        <Link href={ROUTES.product(product.slug)}>
          <h3>{product.title}</h3>
        </Link>

        <p>{product.shortDescription}</p>

        <div className="product-card__footer">
          <div className="product-price">
            <strong>{formatCurrency(product.price)}</strong>
            {product.compareAtPrice &&
              product.compareAtPrice > product.price && (
                <del>{formatCurrency(product.compareAtPrice)}</del>
              )}
          </div>

          <Link
            className="product-card__arrow"
            href={ROUTES.product(product.slug)}
            aria-label="Ürünü incele"
          >
            <Icon name="arrow-right" size={18} />
          </Link>
        </div>
      </div>
    </article>
  );
}
