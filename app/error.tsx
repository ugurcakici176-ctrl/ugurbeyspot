"use client";

import Icon from "@/components/ui/icon";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="error-page">
      <div className="error-page__content">
        <span className="error-page__code">
          !
        </span>

        <span className="eyebrow">
          BİR ŞEYLER TERS GİTTİ
        </span>

        <h1>
          Sayfa şu anda görüntülenemiyor.
        </h1>

        <p>
          Geçici bir teknik sorun oluştu. Sayfayı yeniden
          yüklemeyi deneyebilirsiniz.
        </p>

        <button
          type="button"
          className="button button--dark"
          onClick={reset}
        >
          Tekrar Dene
          <Icon name="arrow-right" size={18} />
        </button>
      </div>
    </main>
  );
}
