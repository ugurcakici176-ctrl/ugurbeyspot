export default function LoadingScreen({
  label = "Yükleniyor",
}: {
  label?: string;
}) {
  return (
    <div className="loading-screen" role="status" aria-live="polite">
      <span className="loading-mark" aria-hidden="true">UB</span>
      <span>{label}</span>
    </div>
  );
}
