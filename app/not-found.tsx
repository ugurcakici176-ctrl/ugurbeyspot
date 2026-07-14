import Link from "next/link";

import Icon from "@/components/ui/icon";

export default function NotFound() {
  return (
    <main className="error-page">
      <div className="error-page__glow" />

      <div className="error-page__content">
        <span className="error-page__code">404</span>

        <span className="eyebrow">
          SAYFA BULUNAMADI
        </span>

        <h1>
          Aradığınız sayfa burada değil.
        </h1>

        <p>
          Bağlantı değişmiş, içerik kaldırılmış veya adres
          yanlış yazılmış olabilir. Mağazaya geri dönüp
          ürünleri keşfetmeye devam edin.
        </p>

        <div className="error-page__actions">
          <Link
            className="button button--dark"
            href="/"
          >
            Ana Sayfaya Dön
            <Icon name="arrow-right" size={18} />
          </Link>

          <Link
            className="button button--ghost"
            href="/urunler"
          >
            Ürünleri İncele
          </Link>
        </div>
      </div>

      <div className="error-page__mark">
        UB
      </div>
    </main>
  );
}
