"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="tr">
      <body>
        <main className="global-error-page">
          <span>UB</span>

          <h1>
            Beklenmeyen bir teknik sorun oluştu.
          </h1>

          <p>
            Uygulamayı yeniden başlatmayı deneyin.
          </p>

          <button
            type="button"
            onClick={reset}
          >
            Tekrar Dene
          </button>
        </main>
      </body>
    </html>
  );
}
