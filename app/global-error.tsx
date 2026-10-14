"use client";

export default function GlobalError({
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
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
            onClick={() => unstable_retry()}
          >
            Tekrar Dene
          </button>
        </main>
      </body>
    </html>
  );
}
