"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { getVariantGallery, nextGalleryIndex, previousGalleryIndex } from "@/lib/gallery";
import { getIncentiveMessage } from "@/lib/incentives";
import { calculatePricing } from "@/lib/pricing";
import type { Catalog, PaymentMethod, Selection, VariantId } from "@/lib/types";

const emptySelection: Selection = { bubble: 0, diamond: 0, fluted: 0 };
const variantOrder: VariantId[] = ["bubble", "diamond", "fluted"];

function money(value: number): string {
  return new Intl.NumberFormat("ar-EG", { style: "currency", currency: "EGP", maximumFractionDigits: 0 }).format(value);
}

function errorMessage(code: string): string {
  const messages: Record<string, string> = {
    pricing_not_approved: "الأسعار تحت المراجعة حاليًا، لذلك لم يتم فتح الطلبات بعد.",
    out_of_stock: "الكمية المطلوبة لم تعد متاحة.",
    duplicate_order: "الطلب تم استقباله بالفعل.",
    not_configured: "نظام الطلبات لم يتم ربطه بعد.",
    payment_not_configured: "بيانات دفع عربون الشحن غير مكتملة حاليًا.",
    inventory_unavailable: "المخزون غير متاح مؤقتًا. حاول مرة أخرى بعد قليل.",
    store_disabled: "الطلبات متوقفة مؤقتًا. حاول مرة أخرى بعد قليل.",
    rate_limit_unavailable: "استقبال الطلبات متوقف مؤقتًا. حاول مرة أخرى بعد قليل.",
    rate_limited: "تم استلام محاولات كثيرة. حاول مرة أخرى بعد قليل.",
    request_too_large: "حجم الطلب أكبر من المسموح.",
    validation_error: "راجع البيانات المدخلة وحاول مرة أخرى.",
  };
  return messages[code] || "حصل خطأ مؤقت. حاول مرة أخرى.";
}

const definitePreCommitErrors = new Set([
  "validation_error", "payment_not_configured", "pricing_not_approved", "out_of_stock",
  "inventory_unavailable", "not_configured", "rate_limited", "rate_limit_unavailable",
  "request_too_large", "store_disabled",
]);
const idempotencyStorageKey = "flora-home:order-attempt:v1";

function currentAttemptKey(current: string | null): string {
  let key = current;
  try { key = key || window.sessionStorage.getItem(idempotencyStorageKey); } catch { /* Use the in-memory key. */ }
  key ||= crypto.randomUUID();
  try { window.sessionStorage.setItem(idempotencyStorageKey, key); } catch { /* Use the in-memory key. */ }
  return key;
}

function clearAttemptKey(): void {
  try { window.sessionStorage.removeItem(idempotencyStorageKey); } catch { /* Keep checkout usable. */ }
}

export function ProductFunnel({ catalog }: { catalog: Catalog }) {
  const [activeVariant, setActiveVariant] = useState<VariantId>("bubble");
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [selection, setSelection] = useState<Selection>(emptySelection);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("COD");
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [successOrderId, setSuccessOrderId] = useState<string | null>(null);
  const [successWhatsappUrl, setSuccessWhatsappUrl] = useState<string>("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [lightbox, setLightbox] = useState<{ src: string; alt: string; title: string } | null>(null);
  const idempotencyKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!lightbox) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setLightbox(null);
    }
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [lightbox]);

  const pricing = useMemo(
    () => calculatePricing(selection, catalog.pricing, paymentMethod),
    [catalog.pricing, paymentMethod, selection],
  );
  const active = catalog.variants.find((variant) => variant.id === activeVariant) || catalog.variants[0];
  const heroVariant = catalog.variants[0] || active;
  const hasSelection = pricing.totalUnits > 0;
  const hasStock = catalog.variants.some((variant) => variant.availableStock > 0);
  const inventoryReady = catalog.inventoryStatus === "live";
  const paymentReady = catalog.settings.instaPayConfigured;
  const orderReady = catalog.settings.storeEnabled && catalog.pricing.approved && hasSelection && hasStock && inventoryReady && paymentReady && Boolean(catalog.settings.supportWhatsapp);

  if (!active) return null;

  function setQuantity(id: VariantId, value: number) {
    const variant = catalog.variants.find((item) => item.id === id);
    const max = variant?.availableStock || 0;
    setSelection((current) => ({ ...current, [id]: Math.max(0, Math.min(max, value)) }));
  }

  function selectVariant(id: VariantId) {
    setActiveVariant(id);
    setGalleryIndex(0);
  }

  const galleryItems = getVariantGallery(active);
  const activeGalleryItem = galleryItems[galleryIndex] || galleryItems[0];

  function showPreviousImage() {
    setGalleryIndex((current) => previousGalleryIndex(current, galleryItems.length));
  }

  function showNextImage() {
    setGalleryIndex((current) => nextGalleryIndex(current, galleryItems.length));
  }

  async function copyInstapayIdentifier() {
    try {
      await navigator.clipboard.writeText(catalog.settings.instaPayIdentifier);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setFeedback({ type: "error", message: "لم نقدر ننسخ المعرف تلقائيًا. انسخه يدويًا." });
    }
  }

  async function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    setSuccessOrderId(null);
    setSuccessWhatsappUrl("");
    if (!orderReady) {
      setFeedback({ type: "error", message: "الطلب غير متاح قبل اعتماد السعر والمخزون." });
      return;
    }

    const form = event.currentTarget;
    const idempotencyKey = currentAttemptKey(idempotencyKeyRef.current);
    idempotencyKeyRef.current = idempotencyKey;
    let orderRequestStarted = false;
    setSubmitting(true);
    try {
      const formData = new FormData(form);
      formData.set("idempotencyKey", idempotencyKey);
      formData.set("paymentMethod", paymentMethod);
      formData.set("source", new URLSearchParams(window.location.search).get("utm_source") || "direct");
      for (const id of variantOrder) formData.set(`${id}Qty`, String(selection[id]));

      orderRequestStarted = true;
      const response = await fetch("/api/orders", { method: "POST", body: formData });
      const body = await response.json().catch(() => ({})) as { code?: string; message?: string; orderId?: string; whatsappUrl?: string };
      if (!response.ok) {
        const message = body.code === "validation_error" && body.message ? body.message : errorMessage(body.code || "internal_error");
        setFeedback({ type: "error", message });
        if (definitePreCommitErrors.has(body.code || "")) {
          idempotencyKeyRef.current = null;
          clearAttemptKey();
        }
        return;
      }

      setSuccessOrderId(body.orderId || null);
      setSuccessWhatsappUrl(body.whatsappUrl || "");
      setFeedback({ type: "success", message: "تم تسجيل طلبك بنجاح." });
      idempotencyKeyRef.current = null;
      clearAttemptKey();
      setSelection(emptySelection);
      setPaymentMethod("COD");
      form.reset();
    } catch (error) {
      if (!orderRequestStarted) {
        idempotencyKeyRef.current = null;
        clearAttemptKey();
      }
      const code = error instanceof Error ? error.message : "internal_error";
      setFeedback({ type: "error", message: errorMessage(code) });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="site-shell">
      <section className="hero-section">
        <div className="hero-copy">
          <span className="eyebrow">فلورا هوم</span>
          <h1>تفصيلة صغيرة تغيّر شكل المكان كله</h1>
          <p>تنسيق ليليام أبيض جاهز للعرض، من غير مياه أو متابعة يومية، بثلاثة أشكال تختار منهم الشكل اللي يناسب مكتبك أو بيتك.</p>
          <div className="trust-row">
            <span>جاهز للعرض</span>
            <span>شحن القاهرة والجيزة</span>
            <span>{catalog.settings.deliveryEstimate || "تأكيد الموعد قبل الشحن"}</span>
          </div>
        </div>
        <div className="hero-art">
          <button
            type="button"
            className="hero-art-button"
            onClick={() => setLightbox({ src: heroVariant.lifestyleImage, alt: "تنسيق ليليام أبيض في الديكور", title: "تنسيق ليليام أبيض في الديكور" })}
            aria-label="تكبير صورة تنسيق ليليام الأبيض"
          >
            <Image src={heroVariant.lifestyleImage} alt="تنسيق ليليام أبيض في الديكور" width={900} height={900} priority />
            <span className="zoom-badge">🔍 إلهام للمكان</span>
          </button>
        </div>
      </section>

      <section className="product-layout" aria-label="تفاصيل المنتج والطلب">
        <div className="product-panel">
          <div className="configurator-layout">
            <section className="gallery-panel" aria-label="معرض صور المنتج">
              <div className="gallery-main">
                <button
                  type="button"
                  className="gallery-image-button"
                  onClick={() => setLightbox({ src: activeGalleryItem.src, alt: activeGalleryItem.alt, title: `${active.label} · ${activeGalleryItem.label}` })}
                  aria-label={`تكبير ${activeGalleryItem.label} لشكل ${active.label}`}
                >
                  <Image src={activeGalleryItem.src} alt={activeGalleryItem.alt} width={1000} height={1000} priority={galleryIndex === 0} />
                </button>
                <button type="button" className="gallery-arrow gallery-arrow-prev" onClick={showPreviousImage} aria-label="الصورة السابقة">‹</button>
                <button type="button" className="gallery-arrow gallery-arrow-next" onClick={showNextImage} aria-label="الصورة التالية">›</button>
                <span className="gallery-label">{activeGalleryItem.label}</span>
              </div>
              <div className="gallery-thumbnails" role="tablist" aria-label="صور الشكل الحالي">
                {galleryItems.map((item, index) => (
                  <button
                    type="button"
                    className={`gallery-thumbnail ${galleryIndex === index ? "selected" : ""}`}
                    key={item.id}
                    role="tab"
                    aria-selected={galleryIndex === index}
                    onClick={() => setGalleryIndex(index)}
                  >
                    <Image src={item.src} alt="" width={160} height={160} />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
              <p className="gallery-caption">اضغط على الصور أو اسحب بينها لمشاهدة الشكل في الديكور والمقاسات.</p>
            </section>

            <section className="selection-panel" aria-label="اختيار الشكل والكمية">
              <div className="section-heading"><span className="eyebrow">اختار الشكل</span><h2>ثلاث نسخ، نفس الإحساس الهادئ</h2></div>

              <div className="incentive-bar" role="status" aria-live="polite">
                <div className="incentive-bar-text">
                  <span>{getIncentiveMessage(pricing.totalUnits, catalog.pricing)}</span>
                </div>
                <div className="incentive-progress" aria-hidden="true">
                  <div
                    className="incentive-progress-fill"
                    style={{ width: `${Math.min(100, Math.max(8, (pricing.totalUnits / Math.max(1, catalog.pricing.freeShippingThreshold)) * 100))}%` }}
                  />
                </div>
              </div>

              <div className="variant-grid">
                {catalog.variants.map((variant) => {
                  const qty = selection[variant.id];
                  const inCart = qty > 0;
                  const isPreview = activeVariant === variant.id;
                  return (
                    <article className={`variant-card ${isPreview ? "preview-active" : ""} ${inCart ? "selected" : ""}`} key={variant.id}>
                      <button className="variant-select" type="button" onClick={() => selectVariant(variant.id)} aria-pressed={isPreview}>
                        <Image src={variant.image} alt={variant.label} width={180} height={180} />
                        <span className="variant-copy">
                          <span className="variant-header-row">
                            <span className="variant-name">{variant.label}</span>
                            {inCart && <span className="cart-badge">في طلبك ({qty})</span>}
                          </span>
                          <span className="variant-description">{variant.description}</span>
                        </span>
                      </button>
                      <div className="quantity-control">
                        {qty === 0 ? (
                          <button
                            type="button"
                            className="add-to-order-btn"
                            onClick={() => {
                              setActiveVariant(variant.id);
                              setQuantity(variant.id, 1);
                            }}
                            disabled={variant.availableStock === 0}
                          >
                            + أضف للطلب
                          </button>
                        ) : (
                          <div className="stepper-group">
                            <button type="button" aria-label={`تقليل ${variant.label}`} onClick={() => setQuantity(variant.id, qty - 1)}>−</button>
                            <span className="stepper-count">{qty}</span>
                            <button type="button" aria-label={`زيادة ${variant.label}`} onClick={() => setQuantity(variant.id, qty + 1)} disabled={qty >= variant.availableStock}>+</button>
                          </div>
                        )}
                      </div>
                      <small>
                        {catalog.inventoryStatus === "unavailable"
                          ? "المخزون غير متاح مؤقتًا"
                          : catalog.inventoryStatus === "local"
                            ? "معاينة محلية فقط؛ الطلبات متوقفة"
                          : variant.availableStock > 0
                            ? `متاح ${variant.availableStock} قطعة`
                            : "المخزون المباشر لم يُعتمد بعد"}
                      </small>
                    </article>
                  );
                })}
              </div>
            </section>
          </div>
        </div>

        <form className="checkout-card" id="checkout" onSubmit={submitOrder}>
          <div className="section-heading"><span className="eyebrow">اطلبها من الوراق</span><h2>بيانات التوصيل</h2></div>
          <div className="summary-box">
            <div><span>عدد القطع</span><strong>{pricing.totalUnits}</strong></div>
            <div><span>العرض</span><strong>{pricing.bundleLabel || "اختار قطعة"}</strong></div>
            <div><span>المنتجات</span><strong>{money(pricing.productSubtotal)}</strong></div>
            <div><span>الشحن</span><strong>{pricing.shipping ? money(pricing.shipping) : "مجاني"}</strong></div>
            {pricing.prepaidDiscount > 0 && <div><span>خصم التحويل</span><strong>− {money(pricing.prepaidDiscount)}</strong></div>}
            {paymentMethod === "COD" && <div><span>عربون الشحن الآن</span><strong>{money(pricing.shippingDeposit)}</strong></div>}
            {paymentMethod === "COD" && <div><span>المتبقي عند التسليم</span><strong>{money(pricing.codRemaining)}</strong></div>}
            <div className="total-row"><span>الإجمالي</span><strong>{money(pricing.total)}</strong></div>
          </div>

          <fieldset className="payment-options">
            <legend>طريقة الدفع</legend>
            <label className="payment-radio-label">
              <input type="radio" name="paymentChoice" checked={paymentMethod === "COD"} onChange={() => setPaymentMethod("COD")} />
              <span>الدفع عند الاستلام (سداد الشحن مقدماً والباقي عند المعاينة)</span>
            </label>
            {catalog.settings.instaPayConfigured && (
              <label className="payment-radio-label">
                <input type="radio" name="paymentChoice" checked={paymentMethod === "InstaPay"} onChange={() => setPaymentMethod("InstaPay")} />
                <span>تحويل كامل عبر إنستاباي (وفر {money(catalog.pricing.prepaidDiscount)})</span>
              </label>
            )}
          </fieldset>

          {paymentMethod === "COD" && (
            catalog.settings.instaPayConfigured ? (
            <div className="cod-trust-box">
              <div className="cod-trust-header">
                <span className="trust-shield">🛡️</span>
                <strong>ضمان جدية الحجز والمعاينة</strong>
              </div>
              <p>
                يتم سداد عربون الشحن فقط <strong>({money(pricing.shippingDeposit)})</strong> عبر إنستاباي لتأكيد تجهيز التغليف وخروج المندوب، وسداد باقي الحساب <strong>({money(pricing.codRemaining)})</strong> كاش عند استلام ومعاينة الفازة بنفسك.
              </p>
            </div>
            ) : (
              <p className="notice warning">بيانات دفع عربون الشحن غير مكتملة، لذلك استقبال الطلبات متوقف مؤقتًا.</p>
            )
          )}

          {paymentMethod === "InstaPay" && catalog.settings.instaPayConfigured && <div className="instapay-box">
            <span className="eyebrow">بيانات التحويل</span>
            <p>حوّل المبلغ الظاهر فوق، وبعدها اضغط زر واتساب في صفحة التأكيد وأرسل صورة التحويل وبيانات الراسل.</p>
            <div className="instapay-detail"><span>المعرف</span><strong dir="ltr">{catalog.settings.instaPayIdentifier}</strong></div>
            <div className="instapay-detail"><span>اسم المستلم</span><strong>{catalog.settings.instaPayRecipient}</strong></div>
            <button className="copy-button" type="button" onClick={copyInstapayIdentifier}>{copied ? "تم النسخ" : "انسخ معرف التحويل"}</button>
          </div>}

          <label>الاسم بالكامل<input name="customerName" required maxLength={120} placeholder="اكتب الاسم ثلاثي" /></label>
          <label>رقم الموبايل الأساسي<input name="phonePrimary" required inputMode="tel" placeholder="01xxxxxxxxx (11 رقم)" /><span className="input-hint">لتأكيد موعد التسليم والمتابعة</span></label>
          <label>رقم بديل اختياري<input name="phoneSecondary" inputMode="tel" placeholder="01xxxxxxxxx" /></label>
          <label>المحافظة<select name="governorate" defaultValue="Cairo"><option value="Cairo">القاهرة</option><option value="Giza">الجيزة</option></select></label>
          <label>العنوان بالتفصيل<textarea name="addressDetails" required minLength={10} maxLength={1000} placeholder="المنطقة، الشارع، رقم العمارة والشقة، وأقرب علامة مميزة" /><span className="input-hint">لتسهيل وصول المندوب لباب بيتك مباشرة</span></label>

          {paymentMethod === "InstaPay" && <label>آخر أربعة أرقام من مرجع التحويل اختياريًا<input name="paymentReference" inputMode="numeric" maxLength={4} placeholder="1234" /></label>}

          <div className="honeypot" aria-hidden="true"><label>اترك هذا الحقل فارغًا<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
          {catalog.inventoryStatus === "unavailable" && <p className="notice warning">المخزون المباشر غير متاح، والطلبات متوقفة لحين ربط البوابة الحية.</p>}
          {catalog.inventoryStatus === "local" && <p className="notice warning">الأرقام المعروضة للمعاينة المحلية فقط. الطلبات لا تعمل من غير ربط المخزون الحي.</p>}
          {catalog.inventoryStatus === "live" && !catalog.pricing.approved && <p className="notice warning">الطلب متوقف مؤقتًا لحين اعتماد التكلفة والسعر.</p>}
          {catalog.inventoryStatus === "live" && !catalog.settings.storeEnabled && <p className="notice warning">{catalog.settings.sitePausedMessage}</p>}
          {catalog.inventoryStatus === "live" && catalog.pricing.approved && !hasStock && <p className="notice warning">المخزون المباشر لم يتم إدخاله بعد.</p>}
          {feedback?.type === "error" && <p className="notice error" role="alert">{feedback.message}</p>}
          {feedback?.type === "success" && <div className="success-card" role="status">
            <span className="eyebrow">تم استلام الطلب</span>
            <h3>رقم الطلب</h3>
            <strong className="order-id" dir="ltr">{successOrderId || "سيتم تأكيده معاك"}</strong>
            <p>{catalog.settings.deliveryEstimate ? `موعد الوصول المتوقع: ${catalog.settings.deliveryEstimate}` : "موعد الوصول هيتأكد معاك قبل الشحن."}</p>
            {successWhatsappUrl && <a className="secondary-button" href={successWhatsappUrl} target="_blank" rel="noreferrer">أرسل إثبات العربون على واتساب</a>}
          </div>}
          <button className="primary-button" type="submit" disabled={submitting || !orderReady}>{submitting ? "جاري التسجيل..." : "سجل الطلب"}</button>
          {catalog.amazonLinkEnabled && <a className="secondary-button" href={catalog.amazonUrl} target="_blank" rel="noreferrer">أو اطلبها من أمازون</a>}
        </form>
      </section>

      <div className="mobile-order-bar" aria-live="polite">
        <div><span>ملخص الطلب</span><strong>{pricing.totalUnits > 0 ? money(pricing.total) : "اختار الشكل"}</strong></div>
        <button type="button" onClick={() => document.getElementById("checkout")?.scrollIntoView({ behavior: "smooth", block: "start" })}>راجع الطلب</button>
      </div>

      <footer className="site-footer">فلورا هوم · تنسيق جاهز للمكتب والبيت</footer>

      {lightbox && (
        <div
          className="lightbox-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={lightbox.title}
          onClick={() => setLightbox(null)}
        >
          <div className="lightbox-content" onClick={(event) => event.stopPropagation()}>
            <div className="lightbox-header">
              <span className="lightbox-title">{lightbox.title}</span>
              <button
                type="button"
                className="lightbox-close"
                onClick={() => setLightbox(null)}
                aria-label="إغلاق نافذة المعاينة"
              >
                ✕
              </button>
            </div>
            <div className="lightbox-image-wrapper">
              <Image
                src={lightbox.src}
                alt={lightbox.alt}
                width={1400}
                height={1400}
                className="lightbox-image"
                priority
              />
            </div>
            <span className="lightbox-hint">اضغط في أي مكان خارج الصورة أو زر (✕) للعودة</span>
          </div>
        </div>
      )}
    </main>
  );
}
