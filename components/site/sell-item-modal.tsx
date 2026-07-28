"use client";

import { type ChangeEvent, type FormEvent, useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/icon";
import { usePublicSession } from "@/hooks/use-public-session";
import { submitSellRequest } from "@/lib/sell-requests";

const CATEGORIES = ["Beyaz Eşya", "Mobilya", "Televizyon & Elektronik", "Küçük Ev Aleti", "Diğer"];

export default function SellItemModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { session, authenticated } = usePublicSession();
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [uploadPercent, setUploadPercent] = useState(0);
  const [progress, setProgress] = useState<"form" | "success">("form");
  const [error, setError] = useState("");
  const registeredName =
    session?.user.displayName?.trim() ||
    session?.user.email?.split("@")[0] ||
    "Kayıtlı Kullanıcı";

  useEffect(() => {
    const urls = files.map((file) => URL.createObjectURL(file));
    // Object URLs are browser resources and are released whenever the file set changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPreviews(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [files]);

  useEffect(() => {
    if (!open) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = overflow; };
  }, [open]);

  function addFiles(list: FileList | null) {
    if (!list) return;
    const next = [...files, ...Array.from(list).filter((file) => file.type.startsWith("image/"))].slice(0, 6);
    setFiles(next);
    setError("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSubmitting(true);
    setUploadPercent(0);
    setError("");
    try {
      await submitSellRequest({
        fullName: authenticated ? registeredName : String(form.get("fullName") || ""),
        phone: String(form.get("phone") || ""),
        district: String(form.get("district") || ""),
        category: String(form.get("category") || ""),
        brandModel: String(form.get("brandModel") || ""),
        condition: String(form.get("condition") || ""),
        description: String(form.get("description") || ""),
        expectedPrice: form.get("expectedPrice") ? Number(form.get("expectedPrice")) : undefined,
        files,
      }, setUploadPercent);
      setProgress("success");
      setFiles([]);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Talebiniz gönderilemedi.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;
  return (
    <div className="sell-modal">
      <button className="sell-modal__backdrop" aria-label="Pencereyi kapat" onClick={onClose} />
      <section className="sell-modal__panel" role="dialog" aria-modal="true" aria-labelledby="sell-modal-title">
        <button className="sell-modal__close" type="button" onClick={onClose} aria-label="Kapat"><Icon name="x" /></button>
        {progress === "success" ? (
          <div className="sell-modal__success">
            <span><Icon name="check" size={36} /></span>
            <small>TALEBİN BİZE ULAŞTI</small>
            <h2>Fotoğraflarını inceliyoruz.</h2>
            <p>Uzman ekibimiz eşyanı değerlendirecek ve en kısa sürede telefonla sana ulaşacak.</p>
            <button className="button button--dark" onClick={onClose}>Tamam, kapat</button>
          </div>
        ) : (
          <>
            <header className="sell-modal__header">
              <span className="eyebrow">ÜCRETSİZ DEĞERLEME</span>
              <h2 id="sell-modal-title">Eşyanı göster,<br /><em>teklifimizi iletelim.</em></h2>
              <p>Fotoğrafları yükle, kısa bilgileri doldur. Konya içindeki eşyalar için hızlıca değerlendirme yapalım.</p>
            </header>
            <form className="sell-form" onSubmit={submit}>
              {authenticated && (
                <div className="sell-form__member">
                  <span>{registeredName.slice(0, 1).toLocaleUpperCase("tr-TR")}</span>
                  <div>
                    <small>KAYITLI HESAP</small>
                    <strong>Merhaba, {registeredName}</strong>
                    {session?.user.email && <em>{session.user.email}</em>}
                  </div>
                  <Icon name="check" size={19} />
                </div>
              )}
              <div className="sell-form__grid">
                {!authenticated && <label><span>Ad Soyad *</span><input name="fullName" required placeholder="Adınız soyadınız" /></label>}
                <label><span>Telefon *</span><input name="phone" required inputMode="tel" placeholder="05xx xxx xx xx" /></label>
                <label><span>İlçe / Mahalle</span><input name="district" placeholder="Örn. Selçuklu" /></label>
                <label><span>Eşya kategorisi *</span><select name="category" required defaultValue=""><option value="" disabled>Seçiniz</option>{CATEGORIES.map(x => <option key={x}>{x}</option>)}</select></label>
                <label><span>Marka / Model</span><input name="brandModel" placeholder="Biliyorsanız yazın" /></label>
                <label><span>Eşyanın durumu *</span><select name="condition" required defaultValue=""><option value="" disabled>Seçiniz</option><option>Çok iyi</option><option>İyi</option><option>Kullanılmış</option><option>Tamir gerekli</option></select></label>
              </div>
              <div className="sell-upload" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}>
                <input ref={inputRef} hidden type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple onChange={(e: ChangeEvent<HTMLInputElement>) => addFiles(e.target.files)} />
                {previews.length ? (
                  <div className="sell-upload__previews">{previews.map((src, i) => <figure key={src}><img src={src} alt={`Eşya fotoğrafı ${i + 1}`} /><button type="button" aria-label="Fotoğrafı kaldır" onClick={() => setFiles(current => current.filter((_, index) => index !== i))}><Icon name="x" size={14} /></button></figure>)}{files.length < 6 && <button type="button" className="sell-upload__add" onClick={() => inputRef.current?.click()}><Icon name="plus" /><span>Ekle</span></button>}</div>
                ) : (
                  <button type="button" className="sell-upload__empty" onClick={() => inputRef.current?.click()}><span><Icon name="image" size={28} /></span><strong>Eşyanın fotoğraflarını ekle</strong><small>Sürükleyip bırak veya seç · En fazla 6 fotoğraf</small></button>
                )}
              </div>
              <label className="sell-form__wide"><span>Kısa açıklama *</span><textarea name="description" required minLength={10} placeholder="Yaşı, çalışma durumu, varsa kusurları..." /></label>
              <label className="sell-form__wide"><span>Beklediğiniz fiyat (opsiyonel)</span><input name="expectedPrice" type="number" min="0" placeholder="₺ 0" /></label>
              {error && <p className="sell-form__error">{error}</p>}
              {submitting && <div className="sell-form__progress" aria-live="polite"><div><span style={{ width: `${uploadPercent}%` }} /></div><small>{uploadPercent < 15 ? "Fotoğraflar hazırlanıyor" : `Fotoğraflar gönderiliyor · %${uploadPercent}`}</small></div>}
              <button className="button button--dark sell-form__submit" disabled={submitting}>{submitting ? `Gönderiliyor · %${uploadPercent}` : "Ücretsiz teklif iste"}<Icon name="arrow-right" /></button>
              <small className="sell-form__legal">Göndererek bilgilerinizin değerlendirme ve iletişim amacıyla işlenmesini kabul edersiniz.</small>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
