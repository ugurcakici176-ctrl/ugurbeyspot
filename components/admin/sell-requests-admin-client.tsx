"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AdminPageHeading from "@/components/admin/admin-page-heading";
import Icon from "@/components/ui/icon";
import { deleteSellRequest, getSellRequests, updateSellRequest } from "@/lib/sell-requests";
import type { SellRequest, SellRequestStatus } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";

const LABELS: Record<SellRequestStatus, string> = { new: "Yeni", reviewing: "İnceleniyor", offered: "Teklif Verildi", completed: "Tamamlandı", rejected: "Uygun Değil" };

export default function SellRequestsAdminClient() {
  const [items, setItems] = useState<SellRequest[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | SellRequestStatus>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<SellRequestStatus>("new");
  const [note, setNote] = useState("");
  const [price, setPrice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const next = await getSellRequests();
    setItems(next);
    setSelectedId((current) => current && next.some(x => x.id === current) ? current : next[0]?.id || null);
    setLoading(false);
  }, []);
  // Firestore is an external data source; load once when the admin view mounts.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);
  const selected = items.find(x => x.id === selectedId) || null;
  // Keep the editable draft synchronized with the record selected in the list.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (selected) { setStatus(selected.status); setNote(selected.adminNote || ""); setPrice(selected.offeredPrice?.toString() || ""); } }, [selected]);
  const visible = useMemo(() => items.filter(x => (filter === "all" || x.status === filter) && `${x.fullName} ${x.phone} ${x.category} ${x.brandModel || ""}`.toLocaleLowerCase("tr").includes(search.toLocaleLowerCase("tr"))), [items, filter, search]);

  async function save() {
    if (!selected) return;
    setSaving(true);
    await updateSellRequest(selected.id, status, note, price ? Number(price) : undefined);
    await load();
    setSaving(false);
  }
  async function remove() {
    if (!selected || !window.confirm("Bu satış talebi ve fotoğrafları kalıcı olarak silinsin mi?")) return;
    setSaving(true); await deleteSellRequest(selected); await load(); setSaving(false);
  }

  return <div className="sell-admin">
    <AdminPageHeading eyebrow="MÜŞTERİ TALEPLERİ" title="Eşya Satış Talepleri" description="Müşterilerin fotoğraflı eşya bildirimlerini inceleyin, fiyat teklifini ve süreci yönetin." />
    <div className="sell-admin__metrics">
      <div><span>Toplam Talep</span><strong>{items.length}</strong><Icon name="inbox" /></div>
      <div><span>Yeni Bekleyen</span><strong>{items.filter(x => x.status === "new").length}</strong><Icon name="sparkles" /></div>
      <div><span>Teklif Verilen</span><strong>{items.filter(x => x.status === "offered").length}</strong><Icon name="tag" /></div>
    </div>
    <div className="sell-admin__toolbar">
      <label><Icon name="search" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="İsim, telefon, kategori ara..." /></label>
      <select value={filter} onChange={e => setFilter(e.target.value as typeof filter)}><option value="all">Tüm durumlar</option>{Object.entries(LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
    </div>
    <div className="sell-admin__workspace">
      <div className="sell-admin__list">
        {loading ? <p>Satış talepleri yükleniyor...</p> : visible.length === 0 ? <p>Bu filtrede talep bulunamadı.</p> : visible.map(item => <button key={item.id} className={item.id === selectedId ? "is-active" : ""} onClick={() => setSelectedId(item.id)}>
          <img src={item.images[0]?.url} alt="" /><span><small>{item.category} · {formatDate(item.createdAt)}</small><strong>{item.fullName}</strong><em>{item.brandModel || item.description}</em></span><b data-status={item.status}>{LABELS[item.status]}</b>
        </button>)}
      </div>
      {selected ? <aside className="sell-admin__detail">
        <div className="sell-admin__gallery">{selected.images.map((image, index) => <a href={image.url} target="_blank" rel="noreferrer" key={image.id}><img src={image.url} alt={`Eşya fotoğrafı ${index + 1}`} /></a>)}</div>
        <div className="sell-admin__identity"><div><small>{selected.category}</small><h2>{selected.brandModel || "Marka / model belirtilmedi"}</h2><p>{selected.description}</p></div><a className="button button--dark" href={`tel:${selected.phone}`}><Icon name="phone" /> Ara</a></div>
        <dl><div><dt>Müşteri</dt><dd>{selected.fullName}</dd></div><div><dt>Telefon</dt><dd>{selected.phone}</dd></div><div><dt>Konum</dt><dd>{selected.district || "Belirtilmedi"}</dd></div><div><dt>Durum</dt><dd>{selected.condition}</dd></div><div><dt>Beklenti</dt><dd>{selected.expectedPrice ? formatCurrency(selected.expectedPrice) : "Belirtilmedi"}</dd></div></dl>
        <div className="sell-admin__edit"><label><span>Süreç durumu</span><select value={status} onChange={e => setStatus(e.target.value as SellRequestStatus)}>{Object.entries(LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label><span>Teklif fiyatı</span><input type="number" min="0" value={price} onChange={e => setPrice(e.target.value)} placeholder="₺ 0" /></label><label className="wide"><span>Admin notu</span><textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Eksik bilgi, görüşme notu..." /></label></div>
        <div className="sell-admin__actions"><button className="button" onClick={remove} disabled={saving}><Icon name="trash" /> Sil</button><button className="button button--dark" onClick={save} disabled={saving}><Icon name="save" /> {saving ? "Kaydediliyor..." : "Değişiklikleri kaydet"}</button></div>
      </aside> : <div className="sell-admin__detail sell-admin__empty">İncelemek için bir talep seçin.</div>}
    </div>
  </div>;
}
