# Challenge: Event-Driven Order Processing with Observer Pattern 📡⚡

> **Date**: 2026-09-18  
> **Topic**: Behavioral Design Patterns - The Observer Pattern (EventBus Architecture)  
> **Author / Student**: Abdullah Mahmoud Fawzy (Abdo)  
> **Mentor**: Blue (بلو)  
> **Target Solution File**: [solution-2026-09-18-observer-event-bus.ts](../my-solutions/solution-2026-09-18-observer-event-bus.ts)  
> **Knowledge Reference**: [LEARNING_NOTES.md](../../LEARNING_NOTES.md) | [MASTER_KNOWLEDGE_BASE.md](../../MASTER_KNOWLEDGE_BASE.md)  

---

## 🎯 Business Context & The Real-World Problem (CasaArt Decor)

في منصة ومحل الديكور الخاص بنا (**CasaArt Decor**)، عندما يشتري العميل منتجات (مثل: تحف كريستال، تابلوهات، أباجورات إضاءة)، يقوم نظام الدفع والطلب (`CheckoutService`) بإنهاء المعاملة.

بمجرد اكتمال الطلب، توجد خدمات وأقسام مستقلة تماماً داخل المحل تحتاج للتفاعل مع هذا الحدث:
1. **قسم المخزن (Inventory / Stock)**: يخصم الكميات المباعة من رصيد المستودع.
2. **خدمة رسائل الواتساب (WhatsApp Notifications)**: ترسل رسالة فورية للعميل برقم الأوردر وتفاصيل الشحن.
3. **دفتر الحسابات والإيرادات (Accounting / Audit)**: يسجل الإيراد المالي للتقرير اليومي.

---

### ❌ The Anti-Pattern: الكود الهش المرتبط ببعضه (Tight Coupling)

في المشاريع غير الاحترافية، تجد المطور يضع استدعاءات مباشرة لكل الخدمات داخل دالة إتمام الطلب:

```typescript
// ❌ كود كارثي داخل CheckoutService:
await inventoryService.deductStock(order);
await whatsAppService.sendOrderConfirmation(order);
await accountingService.recordRevenue(order);
```

#### لماذا هذا التصميم فاشل ومعطّل للنمو؟
1. **كسر مبدأ المسؤولية الواحدة (SRP)**: أصبح `CheckoutService` يعرف تفاصيل الواتساب وتفاصيل الحسابات وتفاصيل المخزن.
2. **كسر مبدأ الفتح والإغلاق (OCP)**: كلما أردنا إضافة خدمة جديدة (مثلاً: إرسال كوبون خصم بعد الشراء)، سنضطر لفتح كود الشيك أوت والتعديل عليه.
3. **غياب عزل الأخطاء (No Fault Isolation)**: لو تعطلت شبكة الواتساب ورمت `Error`، سيتوقف الكود بالكامل ويفشل الأوردر للعميل رغم أن الدفع تم بالفعل!

---

## 🧠 The Architectural Mental Model (النموذج الذهني للحل)

الحل الاحترافي هو **Observer Pattern (Event-Driven Architecture)** عبر وسيط مركزي (`EventBus`):

```
       [ CheckoutService ]  ---> (يطلق حدث: "order:placed")
                |
          [ EventBus ] (يحتوي على قاموس لتسجيل المشتركين)
         /      |      \
        v       v       v
[ WhatsApp ] [ Stock ] [ Accounting ]
```

1. **الناشر (`Publisher`)**: يعرف فقط أنه أطلق حدثاً ومعه بيانات الطلب، ولا يدري من يستمع إليه ولا يعتمد على أحد.
2. **المستمعون (`Listeners / Observers`)**: كل قسم يشترك بنفسه في الحدث الذي يهمه عبر دالة الاشتراك.
3. **الوسيط (`EventBus`)**: يحتفظ بـ `Map` يسجل لكل اسم حدث قائمة الدوال المستمعة له.
4. **عزل الأخطاء (`Fault Isolation`)**: عندما ينفذ `EventBus` الدوال المستمعة، يقوم بحماية التنفيذ بـ `try/catch` لكل مستمع بشكل مستقل، حتى لا يعطل خطأ في مستمع تنفيذ بقية المستمعين.

---

## 📋 Specific Requirements (المطلوب تنفيذه)

افتح ملف الحل الفارغ:  
[solution-2026-09-18-observer-event-bus.ts](../my-solutions/solution-2026-09-18-observer-event-bus.ts)  
وقم ببناء المنظومة كاملة خطوة بخطوة:

### 1. Phase 1: Domain Entities & Event Payloads
- عرّف بيانات الطلب `Order` (مثل: `orderId`, `customerName`, `customerPhone`, `totalAmount`, `items`).
- عرّف نوع أو كائن بيانات الحدث `OrderPlacedPayload`.

### 2. Phase 2: EventBus Contract (Interfaces)
- صمّم دالة أو نوع المستمع `EventHandler`: دالة تأخذ البيانات المنشورة وتنفذ المطلوب.
- صمّم عقد الوسيط `IEventBus`:
  - `subscribe(eventName: string, handler: EventHandler): void` (أو إرجاع دالة تنظيف لإلغاء الاشتراك).
  - `unsubscribe(eventName: string, handler: EventHandler): void`
  - `publish(eventName: string, data: any): void`

### 3. Phase 3: The Concrete EventBus Class
- ابنِ كلاس `EventBus` مع خاصية داخلية خاصة تخزن المستمعين (مثلاً: `Map<string, EventHandler[]>`).
- اكتب كود دالة `subscribe` (إضافة الدالة للمستمعين).
- اكتب كود دالة `unsubscribe` (حذف الدالة من مصفوفة المستمعين).
- اكتب كود دالة `publish`:
  - تجلب المستمعين الخاصين بهذا الحدث.
  - تمر عليهم بحلقة تكرار (`for` أو `forEach`).
  - **مطلب إجباري (Fault Isolation)**: ضع استدعاء المستمع داخل `try/catch` حتى إذا رمت دالة معينة خطأ يتم تسجيله في الكونسول ولا يتوقف البقية.

### 4. Phase 4: Independent Domain Listeners
- صمم مستمع الواتساب: يطبع رسالة ترحيب بالطلب على الكونسول.
- صمم مستمع المخزن: يطبع خصم المنتجات من الرصيد.
- صمم مستمع متعمد الخطأ (Faulty Listener): مستمع يرمي `new Error("WhatsApp Gateway Down!")` لاختبار عزل الأعطال.

### 5. Phase 5: Verification & Simulation (دالة التجربة والاختبار)
- اكتب دالة تجربة عملية `main()` تثبت:
  1. اشتراك مستمع المخزن ومستمع الواتساب.
  2. إطلاق حدث طلب جديد وتأكيد استقبال المستمعين للبيانات وطباعتها.
  3. إلغاء اشتراك مستمع (`unsubscribe`)، ثم إطلاق حدث جديد والتأكد أنه لم يعد يستلم الحدث.
  4. تفعيل المستمع الذي يرمي خطأ، وإثبات أن الحدث استمر ونفذ باقي المستمعين بنجاح دون انهيار التطبيق.

---

## 🏆 Definition of Done (DoD)
- [ ] الكود خالي من الأخطاء ومكتوب بلغة TypeScript نقية.
- [ ] الكود مبني بجهد ذاتي بالكامل داخل ملف الحلول الشخصية (`Tier 3: Solo-Authored`).
- [ ] يمكن تشغيل الملف واختباره مباشرة باستخدام `npx tsx` أو `ts-node`.
