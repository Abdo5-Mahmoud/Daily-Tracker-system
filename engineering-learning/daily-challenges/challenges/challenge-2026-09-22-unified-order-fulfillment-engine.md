# Challenge: Unified Order Fulfillment Engine 🚚⚡📡

> **Date**: 2026-09-22  
> **Topic**: Architectural Integration: Strategy + Adapter + Observer (EventBus)  
> **Author / Student**: Abdullah Mahmoud Fawzy (Abdo)  
> **Methodology**: Tier 3 (Solo-Authored Implementation)  
> **Target Solution File**: [solution-2026-09-22-unified-order-fulfillment-engine.ts](../my-solutions/solution-2026-09-22-unified-order-fulfillment-engine.ts)  
> **Knowledge Reference**: [LEARNING_NOTES.md](../../LEARNING_NOTES.md) | [MASTER_KNOWLEDGE_BASE.md](../../MASTER_KNOWLEDGE_BASE.md)  

---

## 🎯 The Real-World Business Problem (CasaArt Decor)

في منصة ومحل الديكور الخاص بنا (**CasaArt Decor**)، قمنا سابقاً ببناء أجزاء منفصلة:
1. اخترنا شركة الشحن عبر نمط الاستراتيجية (`Strategy Pattern`).
2. قمنا بترويض مكتبة بوسطة (`Bosta SDK`) عبر نمط المحول (`Adapter Pattern`).
3. بنينا وسيط أحداث آمن للأنواع البرمجية مع عزل الأعطال (`Observer Pattern / EventBus`).

### ❌ The Legacy Flaw (المشكلة في الكود القديم):
في ملف الشحن القديم، كانت خدمة التنفيذ `FulfillmentService` تستدعي خدمة الواتساب مباشرة:
```typescript
class FulfillmentService {
  constructor(
    private carrierStrategy: CarrierStrategy,
    private notificationService: WhatsAppNotificationService, // ❌ ارتباط مباشر
  ) {}

  async shipOrder(order: Order, carrierName: string) {
    const carrier = this.carrierStrategy.getCarrier(carrierName);
    const result = await carrier.shipOrder(order);
    await this.notificationService.sendShipmentNotification(order, result); // ❌ كسر OCP & SRP
  }
}
```
**عيوب هذا التصميم:**
1. إذا أردنا إرسال بريد إلكتروني، أو تسجيل التكلفة في الدفاتر المحاسبية، سنضطر لفتح كود `FulfillmentService` وتعديله وحقن خدمات جديدة.
2. خدمة الشحن أصبحت مسؤولة عن الشحن والرسائل في نفس الوقت (كسر `Single Responsibility Principle`).

---

## 🧠 The Unified Architecture (المعمارية المتكاملة المطلوبة)

المطلوب دمج الأنماط الثلاثة في خط أنابيب نقي واحد:

```
[ Order ] 
    │
    ▼
[ FulfillmentEngine ] 
    │
    ├── 1. Carrier Strategy: يختار الناقل المطلوب ("Bosta" أو "Aramex")
    │         └── Adapter: يحول بيانات المتجر لتناسب شروط بوسطة (جرامات وعنوان مفصل)
    │
    └── 2. EventBus (Observer): بمجرد نجاح الشحن، يبث حدث "order:shipped"
              │
              ├── [ WhatsApp Listener ]: يطبع إشعار العميل مع كود التتبع
              ├── [ Accounting Listener ]: يسجل تكلفة بوليصة الشحن في الحسابات
              └── [ Faulty Listener ]: يرمي خطأ ويثبت أن عزل الأعطال يحمي المحرك
```

---

## 📋 Specific Requirements (مراحل التنفيذ في الشاشة البيضاء)

افتح ملف الحل الفارغ:  
[solution-2026-09-22-unified-order-fulfillment-engine.ts](../my-solutions/solution-2026-09-22-unified-order-fulfillment-engine.ts)

### Phase 1: Domain Models & Events Dictionary
- عرّف بيانات المنتج `Product` والطلب `Order` ونتيجة الشحن الموحدة `ShipmentResult`.
- عرّف قاموس أحداث النظام `ShopEvents`:
  - حدث إتمام الشحن `"order:shipped"` ويحمل: `orderId`, `customerPhone`, `carrierName`, `trackingCode`, `etaDays`.

### Phase 2: The Generic EventBus & Fault Isolation
- عرّف واجهة المستمع العام:
  `type EventHandler<T> = (data: T) => void;`
- اكتب كلاس `EventBus<Events>` مع حلقة التكرار `for...of` وحماية الاستدعاء داخل `try/catch` لكل مستمع بشكل مستقل (`Fault Isolation`).

### Phase 3: External Vendor & The Adapter Pattern
- مكتبة بوسطة الخارجية `BostaSDK` (تقبل الوزن بالجرام والعنوان ككائن `city, district, street, buildingNumber`).
- واجهة الشحن الموحدة `ShippingCarrier`.
- كلاس المحول `BostaShippingAdapter implements ShippingCarrier`.

### Phase 4: Carrier Strategy (Registry)
- كلاس اختيار واستبدال الناقل `CarrierStrategy`:
  - `register(name: string, carrier: ShippingCarrier): void`
  - `get(name: string): ShippingCarrier`

### Phase 5: The Orchestrator (Unified FulfillmentEngine)
- كلاس `FulfillmentEngine`:
  - يعتمد فقط في البناء على: `CarrierStrategy` و `EventBus`.
  - لا يعرف شيئاً عن الواتساب أو الحسابات إطلاقاً!
  - دالة `fulfill(order: Order, carrierName: string)`:
    1. تجلب الناقل من الاستراتيجية وتشحن الطلب.
    2. تبث حدث `"order:shipped"` عبر الـ `EventBus`.

### Phase 6: Verification & Simulation
- تشغيل سيناريو كامل:
  1. تسجيل مستمع الواتساب ومستمع الحسابات ومستمع معطوب يرمي خطأ.
  2. شحن الطلب وتأكيد تفاعل كل المستمعين وصمود النظام أمام الخطأ.

---

## 🏆 Definition of Done (DoD)
- [ ] الكود مكتوب من الصفر بيدك في ملف الحلول الشخصية (`Tier 3: Solo-Authored`).
- [ ] الكود يجمع الأنماط الثلاثة في تدفق واحد نظيف.
- [ ] تشغيل الكود بـ `npx tsx` بنتيجة خضراء كاملة `Exit Code 0`.
