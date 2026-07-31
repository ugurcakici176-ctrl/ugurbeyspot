"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import AdminPageHeading from "@/components/admin/admin-page-heading";
import Icon from "@/components/ui/icon";
import { useAdminSession } from "@/hooks/use-admin-session";
import { getCategories } from "@/lib/categories";
import { ROUTES } from "@/lib/constants";
import type { LiveAnalyticsSummary } from "@/lib/live-analytics";
import { getContactMessages } from "@/lib/messages";
import { getProducts } from "@/lib/products";
import type { Category, ContactMessage, Product } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function DashboardClient() {
  const { session } = useAdminSession();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<LiveAnalyticsSummary | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [analyticsError, setAnalyticsError] = useState(false);

  useEffect(() => {
    let active = true;

    void Promise.all([
      getProducts({ includePassive: true }),
      getCategories({ includePassive: true }),
      getContactMessages(),
    ])
      .then(([productData, categoryData, messageData]) => {
        if (!active) return;
        setProducts(productData);
        setCategories(categoryData);
        setMessages(messageData);
      })
      .catch((reason: unknown) => {
        console.error("Dashboard could not be loaded:", reason);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!session?.user) return;

    let active = true;

    const loadAnalytics = async () => {
      try {
        const token = await session.user.getIdToken();
        const response = await fetch("/api/admin/analytics", {
          headers: { authorization: `Bearer ${token}` },
          cache: "no-store",
        });

        if (!response.ok) throw new Error(`Analytics request failed: ${response.status}`);
        const data = (await response.json()) as LiveAnalyticsSummary;

        if (active) {
          setAnalytics(data);
          setAnalyticsError(false);
        }
      } catch (reason) {
        console.error("Analytics could not be loaded:", reason);
        if (active) setAnalyticsError(true);
      } finally {
        if (active) setAnalyticsLoading(false);
      }
    };

    void loadAnalytics();
    const interval = window.setInterval(() => void loadAnalytics(), 15_000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [session]);

  const summary = useMemo(
    () => ({
      totalProducts: products.length,
      activeProducts: products.filter((item) => item.status === "active").length,
      soldOutProducts: products.filter(
        (item) =>
          item.status === "sold_out" ||
          item.stockStatus === "out_of_stock",
      ).length,
      totalCategories: categories.length,
      newMessages: messages.filter((item) => item.status === "new").length,
    }),
    [categories, messages, products],
  );

  const cards = [
    { label: "Toplam Ürün", value: summary.totalProducts, icon: "package" },
    { label: "Aktif Ürün", value: summary.activeProducts, icon: "check" },
    { label: "Tükenen Ürün", value: summary.soldOutProducts, icon: "package" },
    { label: "Kategori", value: summary.totalCategories, icon: "tag" },
    { label: "Yeni Mesaj", value: summary.newMessages, icon: "inbox" },
  ];

  const maxTrendVisitors = Math.max(
    1,
    ...(analytics?.trend.map((item) => item.visitors) || []),
  );

  return (
    <>
      <AdminPageHeading
        eyebrow="GENEL BAKIŞ"
        title="Mağaza Kontrol Merkezi"
        description="Ürün, kategori ve mesaj durumlarını tek ekranda takip edin."
        actions={
          <Link href={ROUTES.adminNewProduct} className="admin-primary-button">
            <Icon name="plus" size={18} />
            Yeni Ürün
          </Link>
        }
      />

      <div className="admin-stat-grid">
        {cards.map((card) => (
          <article className="admin-stat-card" key={card.label}>
            <span><Icon name={card.icon} size={21} /></span>
            <strong>{loading ? "—" : card.value}</strong>
            <small>{card.label}</small>
          </article>
        ))}
      </div>

      <section className="admin-panel admin-analytics-panel">
        <div className="admin-panel__heading">
          <div>
            <span>CANLI ANALİTİK</span>
            <h2>Ziyaretçi Trafiği</h2>
          </div>
          <small>
            {analytics
              ? `Son güncelleme ${new Date(analytics.lastUpdatedAt).toLocaleTimeString("tr-TR", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}`
              : "Veri bekleniyor"}
          </small>
        </div>

        <div className="admin-live-metrics">
          <article>
            <span className="admin-live-dot" aria-hidden="true" />
            <div>
              <strong>{analyticsLoading ? "—" : analytics?.activeNow ?? 0}</strong>
              <small>Şu an sitede</small>
            </div>
          </article>
          <article>
            <Icon name="users" size={20} />
            <div>
              <strong>{analyticsLoading ? "—" : analytics?.todayVisitors ?? 0}</strong>
              <small>Bugün ziyaretçi</small>
            </div>
          </article>
          <article>
            <Icon name="eye" size={20} />
            <div>
              <strong>{analyticsLoading ? "—" : analytics?.todayPageViews ?? 0}</strong>
              <small>Bugün sayfa görüntüleme</small>
            </div>
          </article>
        </div>

        {analyticsError ? (
          <p className="admin-analytics-note">
            Canlı trafik verisi şu anda alınamadı. Firebase sunucu bağlantısını
            ve yayın ortamı yetkilerini kontrol edin.
          </p>
        ) : (
          <div className="admin-analytics-grid">
            <div>
              <h3>Son 14 gün</h3>
              <div className="admin-traffic-chart" aria-label="Son 14 günlük ziyaretçi grafiği">
                {analytics?.trend.map((item) => (
                  <div className="admin-traffic-chart__item" key={item.date}>
                    <span
                      style={{ height: `${Math.max(4, (item.visitors / maxTrendVisitors) * 100)}%` }}
                      title={`${item.date}: ${item.visitors} ziyaretçi`}
                    />
                    <small>{item.date.slice(8)}</small>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3>Bugün en çok açılan sayfalar</h3>
              <div className="admin-top-pages">
                {analytics?.topPaths.map((item) => (
                  <div key={item.path}>
                    <span title={item.path}>{item.path}</span>
                    <strong>{item.views}</strong>
                  </div>
                ))}
                {!analyticsLoading && !analytics?.topPaths.length && (
                  <p>Analitik izni veren ilk ziyaretçinin verisi burada görünecek.</p>
                )}
              </div>
            </div>
          </div>
        )}

        <p className="admin-analytics-consent">
          Sayaç yalnızca analitik çerez izni veren ziyaretçileri ölçer. Google
          arama kelimeleri ve tıklamalar için Search Console bağlantısı ayrıca gerekir.
        </p>
      </section>

      <div className="admin-dashboard-grid">
        <section className="admin-panel">
          <div className="admin-panel__heading">
            <div>
              <span>ÜRÜNLER</span>
              <h2>Son Eklenenler</h2>
            </div>
            <Link href={ROUTES.adminProducts}>Tümünü Gör</Link>
          </div>

          <div className="admin-list">
            {products.slice(0, 5).map((product) => (
              <Link
                className="admin-list__row"
                href={ROUTES.editProduct(product.id)}
                key={product.id}
              >
                <span className="admin-list__image">
                  {product.images[0] ? (
                    <img
                      src={product.images[0].url}
                      alt={product.images[0].alt || product.title}
                    />
                  ) : (
                    <Icon name="package" size={19} />
                  )}
                </span>

                <div className="admin-list__content">
                  <strong>{product.title}</strong>
                  <small>{formatDate(product.createdAt)}</small>
                </div>

                <span className="admin-list__value">
                  {formatCurrency(product.price)}
                </span>
              </Link>
            ))}
            {!loading && products.length === 0 && (
              <div className="admin-dashboard-empty">
                <span><Icon name="package" size={22} /></span>
                <strong>Henüz ürün eklenmedi</strong>
                <small>İlk ürününüzü ekleyerek mağaza vitrininizi hazırlayın.</small>
                <Link href={ROUTES.adminNewProduct}>Yeni ürün ekle</Link>
              </div>
            )}
          </div>
        </section>

        <section className="admin-panel">
          <div className="admin-panel__heading">
            <div>
              <span>İLETİŞİM</span>
              <h2>Son Mesajlar</h2>
            </div>
            <Link href={ROUTES.adminMessages}>Tümünü Gör</Link>
          </div>

          <div className="admin-list">
            {messages.slice(0, 5).map((message) => (
              <Link
                className="admin-list__row"
                href={ROUTES.adminMessages}
                key={message.id}
              >
                <span className="admin-list__image">
                  <Icon name="message-circle" size={19} />
                </span>
                <div className="admin-list__content">
                  <strong>{message.fullName}</strong>
                  <small>{message.subject}</small>
                </div>
                <span className={`admin-status admin-status--${message.status}`}>
                  {message.status}
                </span>
              </Link>
            ))}
            {!loading && messages.length === 0 && (
              <div className="admin-dashboard-empty">
                <span><Icon name="inbox" size={22} /></span>
                <strong>Henüz mesaj yok</strong>
                <small>Yeni müşteri mesajları burada listelenecek.</small>
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
