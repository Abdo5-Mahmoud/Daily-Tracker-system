"use client";

import Image from "next/image";
import { useMemo, useRef, useState, type FormEvent } from "react";
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
    payment_not_configured: "الدفع المسبق غير متاح حاليًا.",
    inventory_unavailable: "المخزون غير متاح مؤقتًا. حاول مرة أخرى بعد قليل.",
    rate_limit_unavailable: "استقبال الطلبات متوقف مؤقتًا. حاول مرة أخرى بعد قليل.",
    proof_upload_failed: "تعذر حفظ صورة التحويل. حاول مرة أخرى.",
    rate_limited: "تم استلام محاولات كثيرة. حاول مرة أخرى بعد قليل.",
    request_too_large: "حجم الطلب أكبر من المسموح.",
    validation_error: "راجع البيانات المدخلة وحاول مرة أخرى.",
  };
  return messages[code] || "حصل خطأ مؤقت. حاول مرة أخرى.";
}

const definitePreCommitErrors = new Set([
  "validation_error", "payment_not_configured", "pricing_not_approved", "out_of_stock",
  "inventory_unavailable", "not_configured", "rate_limited", "rate_limit_unavailable",
  "request_too_large", "proof_upload_failed",
]);
const proofChunkBytes = 1024 * 1024;
const idempotencyStorageKey = "flora-home:order-attempt:v1";

type ProofUploadSession = { uploadId: string; uploadToken: string };

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
  const [selection, setSelection] = useState<Selection>(emptySelection);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("COD");
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [successOrderId, setSuccessOrderId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const idempotencyKeyRef = useRef<string | null>(null);

  const pricing = useMemo(
    () => calculatePricing(selection, catalog.pricing, paymentMethod),
    [catalog.pricing, paymentMethod, selection],
  );
  const active = catalog.variants.find((variant) => variant.id === activeVariant) || catalog.variants[0];
  const hasSelection = pricing.totalUnits > 0;
  const hasStock = catalog.variants.some((variant) => variant.availableStock > 0);
  const inventoryReady = catalog.inventoryStatus === "live";
  const paymentReady = paymentMethod === "COD" || catalog.settings.instaPayConfigured;
  const orderReady = catalog.pricing.approved && hasSelection && hasStock && inventoryReady && paymentReady;
  const whatsappUrl = catalog.settings.supportWhatsapp ? `https://wa.me/${catalog.settings.supportWhatsapp}` : "";

  if (!active) return null;

  function setQuantity(id: VariantId, value: number) {
    const variant = catalog.variants.find((item) => item.id === id);
    const max = variant?.availableStock || 0;
    setSelection((current) => ({ ...current, [id]: Math.max(0, Math.min(max, value)) }));
  }

  function selectVariant(id: VariantId) {
    setActiveVariant(id);
    const variant = catalog.variants.find((item) => item.id === id);
    if (variant && variant.availableStock > 0 && selection[id] === 0) setQuantity(id, 1);
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
    if (!orderReady) {
      setFeedback({ type: "error", message: "الطلب غير متاح قبل اعتماد السعر والمخزون." });
      return;
    }

    const form = event.currentTarget;
    const proofInput = form.elements.namedItem("proofImage");
    const proofFile = proofInput instanceof HTMLInputElement ? proofInput.files?.[0] : undefined;
    if (proofFile && (!/^image\/[a-z0-9.+-]+$/i.test(proofFile.type) || proofFile.size > 5 * 1024 * 1024)) {
      setFeedback({ type: "error", message: "صورة التحويل يجب أن تكون صورة وألا تتجاوز خمسة ميبيبايت." });
      return;
    }

    const idempotencyKey = currentAttemptKey(idempotencyKeyRef.current);
    idempotencyKeyRef.current = idempotencyKey;
    let proofSession: ProofUploadSession | null = null;
    let orderRequestStarted = false;
    setSubmitting(true);
    try {
      const formData = new FormData(form);
      formData.set("idempotencyKey", idempotencyKey);
      formData.set("paymentMethod", paymentMethod);
      formData.set("source", new URLSearchParams(window.location.search).get("utm_source") || "direct");
      for (const id of variantOrder) formData.set(`${id}Qty`, String(selection[id]));

      if (proofFile && proofFile.size > 0) {
        const sessionResponse = await fetch("/api/order-proof/session", { method: "POST" });
        const sessionBody = await sessionResponse.json() as ProofUploadSession & { code?: string };
        if (!sessionResponse.ok || !sessionBody.uploadId || !sessionBody.uploadToken) {
          throw new Error(sessionBody.code || "proof_upload_failed");
        }
        proofSession = { uploadId: sessionBody.uploadId, uploadToken: sessionBody.uploadToken };
        const chunkCount = Math.ceil(proofFile.size / proofChunkBytes);

        for (let index = 0; index < chunkCount; index += 1) {
          const start = index * proofChunkBytes;
          const chunk = proofFile.slice(start, Math.min(start + proofChunkBytes, proofFile.size));
          const chunkForm = new FormData();
          chunkForm.set("uploadId", proofSession.uploadId);
          chunkForm.set("uploadToken", proofSession.uploadToken);
          chunkForm.set("index", String(index));
          chunkForm.set("chunkCount", String(chunkCount));
          chunkForm.set("proofChunk", chunk, "proof-part");
          const chunkResponse = await fetch("/api/order-proof/chunk", { method: "POST", body: chunkForm });
          if (!chunkResponse.ok) {
            const chunkBody = await chunkResponse.json().catch(() => ({})) as { code?: string };
            throw new Error(chunkBody.code || "proof_upload_failed");
          }
        }

        formData.delete("proofImage");
        formData.set("proofUploadId", proofSession.uploadId);
        formData.set("proofUploadToken", proofSession.uploadToken);
        formData.set("proofUploadChunkCount", String(chunkCount));
        formData.set("proofUploadFileType", proofFile.type);
      }

      orderRequestStarted = true;
      const response = await fetch("/api/orders", { method: "POST", body: formData });
      const body = await response.json().catch(() => ({})) as { code?: string; message?: string; orderId?: string };
      if (!response.ok) {
        const message = body.code === "validation_error" && body.message ? body.message : errorMessage(body.code || "internal_error");
        setFeedback({ type: "error", message });
        if (definitePreCommitErrors.has(body.code || "")) {
          idempotencyKeyRef.current = null;
          clearAttemptKey();
          if (proofSession) {
            await fetch("/api/order-proof/chunk", {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(proofSession),
            }).catch(() => undefined);
          }
        }
        return;
      }

      setSuccessOrderId(body.orderId || null);
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
        if (proofSession) {
          await fetch("/api/order-proof/chunk", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(proofSession),
          }).catch(() => undefined);
        }
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
        <div className="hero-art"><Image src={active.image} alt={active.label} width={720} height={720} priority /></div>
      </section>

      <section className="product-layout" aria-label="تفاصيل المنتج والطلب">
        <div className="product-panel">
          <div className="section-heading"><span className="eyebrow">اختار الشكل</span><h2>ثلاث نسخ، نفس الإحساس الهادئ</h2></div>
          <div className="variant-grid">
            {catalog.variants.map((variant) => (
              <article className={`variant-card ${activeVariant === variant.id ? "selected" : ""}`} key={variant.id}>
                <button className="variant-select" type="button" onClick={() => selectVariant(variant.id)}>
                  <Image src={variant.image} alt={variant.label} width={360} height={360} />
                  <span className="variant-name">{variant.label}</span>
                  <span className="variant-description">{variant.description}</span>
                </button>
                <div className="quantity-control">
                  <button type="button" aria-label={`زيادة ${variant.label}`} onClick={() => setQuantity(variant.id, selection[variant.id] + 1)} disabled={selection[variant.id] >= variant.availableStock}>+</button>
                  <strong>{selection[variant.id]}</strong>
                  <button type="button" aria-label={`تقليل ${variant.label}`} onClick={() => setQuantity(variant.id, selection[variant.id] - 1)} disabled={selection[variant.id] === 0}>−</button>
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
            ))}
          </div>

          <div className="detail-card">
            <div className="detail-image-grid">
              <Image src={active.lifestyleImage} alt={`تنسيق ${active.label} على مكتب`} width={900} height={900} />
              <Image src={active.dimensionsImage} alt={`مقاسات ${active.label}`} width={900} height={900} />
            </div>
            <div><span className="eyebrow">تفاصيل عملية</span><h3>ارتفاع تقريبي ٣٠ سم</h3><p>تنسيق كامل يوصل جاهز للعرض. التنظيف يكون بمسحة خفيفة، من غير غسيل مباشر أو مياه داخل الفازة.</p></div>
          </div>
        </div>

        <form className="checkout-card" onSubmit={submitOrder}>
          <div className="section-heading"><span className="eyebrow">اطلبها من الوراق</span><h2>بيانات التوصيل</h2></div>
          <div className="summary-box">
            <div><span>عدد القطع</span><strong>{pricing.totalUnits}</strong></div>
            <div><span>العرض</span><strong>{pricing.bundleLabel || "اختار قطعة"}</strong></div>
            <div><span>المنتجات</span><strong>{money(pricing.productSubtotal)}</strong></div>
            <div><span>الشحن</span><strong>{pricing.shipping ? money(pricing.shipping) : "مجاني"}</strong></div>
            {pricing.prepaidDiscount > 0 && <div><span>خصم التحويل</span><strong>− {money(pricing.prepaidDiscount)}</strong></div>}
            <div className="total-row"><span>الإجمالي</span><strong>{money(pricing.total)}</strong></div>
          </div>

          <fieldset className="payment-options">
            <legend>طريقة الدفع</legend>
            <label><input type="radio" name="paymentChoice" checked={paymentMethod === "COD"} onChange={() => setPaymentMethod("COD")} /> الدفع عند الاستلام</label>
            {catalog.settings.instaPayConfigured && <label><input type="radio" name="paymentChoice" checked={paymentMethod === "InstaPay"} onChange={() => setPaymentMethod("InstaPay")} /> تحويل مسبق وخصم {money(catalog.pricing.prepaidDiscount)}</label>}
          </fieldset>

          {paymentMethod === "InstaPay" && catalog.settings.instaPayConfigured && <div className="instapay-box">
            <span className="eyebrow">بيانات التحويل</span>
            <p>حوّل المبلغ الظاهر فوق، وبعدها اكتب آخر أربعة أرقام من المرجع.</p>
            <div className="instapay-detail"><span>المعرف</span><strong dir="ltr">{catalog.settings.instaPayIdentifier}</strong></div>
            <div className="instapay-detail"><span>اسم المستلم</span><strong>{catalog.settings.instaPayRecipient}</strong></div>
            <button className="copy-button" type="button" onClick={copyInstapayIdentifier}>{copied ? "تم النسخ" : "انسخ معرف التحويل"}</button>
          </div>}

          <label>الاسم بالكامل<input name="customerName" required maxLength={120} placeholder="اكتب اسمك" /></label>
          <label>رقم الموبايل<input name="phonePrimary" required inputMode="tel" placeholder="01xxxxxxxxx" /></label>
          <label>رقم بديل اختياري<input name="phoneSecondary" inputMode="tel" placeholder="01xxxxxxxxx" /></label>
          <label>المحافظة<select name="governorate" defaultValue="Cairo"><option value="Cairo">القاهرة</option><option value="Giza">الجيزة</option></select></label>
          <label>العنوان بالتفصيل<textarea name="addressDetails" required minLength={10} maxLength={1000} placeholder="المنطقة والشارع ورقم العقار وأقرب علامة" /></label>

          {paymentMethod === "InstaPay" && <>
            <label>آخر أربعة أرقام من مرجع التحويل<input name="paymentReference" inputMode="numeric" maxLength={4} required placeholder="1234" /></label>
            <label>صورة التحويل {catalog.settings.instaPayProofRequired ? "مطلوبة" : "اختيارية"}<input name="proofImage" type="file" accept="image/*" required={catalog.settings.instaPayProofRequired} /></label>
          </>}

          <div className="honeypot" aria-hidden="true"><label>اترك هذا الحقل فارغًا<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
          {catalog.inventoryStatus === "unavailable" && <p className="notice warning">المخزون المباشر غير متاح، والطلبات متوقفة لحين ربط البوابة الحية.</p>}
          {catalog.inventoryStatus === "local" && <p className="notice warning">الأرقام المعروضة للمعاينة المحلية فقط. الطلبات لا تعمل من غير ربط المخزون الحي.</p>}
          {catalog.inventoryStatus === "live" && !catalog.pricing.approved && <p className="notice warning">الطلب متوقف مؤقتًا لحين اعتماد التكلفة والسعر.</p>}
          {catalog.inventoryStatus === "live" && catalog.pricing.approved && !hasStock && <p className="notice warning">المخزون المباشر لم يتم إدخاله بعد.</p>}
          {feedback?.type === "error" && <p className="notice error" role="alert">{feedback.message}</p>}
          {feedback?.type === "success" && <div className="success-card" role="status">
            <span className="eyebrow">تم استلام الطلب</span>
            <h3>رقم الطلب</h3>
            <strong className="order-id" dir="ltr">{successOrderId || "سيتم تأكيده معاك"}</strong>
            <p>{catalog.settings.deliveryEstimate ? `موعد الوصول المتوقع: ${catalog.settings.deliveryEstimate}` : "موعد الوصول هيتأكد معاك قبل الشحن."}</p>
            {whatsappUrl && <a className="secondary-button" href={whatsappUrl} target="_blank" rel="noreferrer">تواصل مع أرتفلورا على واتساب</a>}
          </div>}
          <button className="primary-button" type="submit" disabled={submitting || !orderReady}>{submitting ? "جاري التسجيل..." : "سجل الطلب"}</button>
          {catalog.amazonLinkEnabled && <a className="secondary-button" href={catalog.amazonUrl} target="_blank" rel="noreferrer">أو اطلبها من أمازون</a>}
        </form>
      </section>

      <footer className="site-footer">فلورا هوم · تنسيق جاهز للمكتب والبيت</footer>
    </main>
  );
}
