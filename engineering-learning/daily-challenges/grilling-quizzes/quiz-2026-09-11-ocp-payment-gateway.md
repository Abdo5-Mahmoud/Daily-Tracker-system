# Grilling Architectural Quiz: Open/Closed Principle (OCP) 🧠🎯

> **Topic**: Open/Closed Principle (OCP), Registry Pattern, Extensibility without Regression  
> **Status**: Passed & Approved (Evaluated by Master Mentor) ✅

---

## 🧭 The 3 Grilling Angles

### Angle 1: Mental Intuition & The Business Value
**Question**:
"ليه بنقول إن الـ `switch-case` داخل دالة الدفع `checkout` يعتبر قنبلة موقوتة في المشاريع الكبيرة، وإزاي مبدأ الـ OCP بيحمي الشركات من خسائر مالية عند إضافة طريقة دفع جديدة؟"

Because when modifying a central swith statement increase the risk of blast radius on any change,
OCP allows us to add a new payment providers by extending the current code, which increases the reliability of the system and prevents financial losses.
---

### Angle 2: Failure Edge-Cases & Security
**Question**:
"لو عميل أو هاكر بعت في الـ payload طريقة دفع غير مسجلة أصلاً زي `method: 'crypto'`، إيه الكارثة اللي هتحصل لو استدعينا الدالة مباشرة بدون حارس في الـ Registry، وإزاي نصمم معالجة الخطأ دي هندسياً؟"

Because the system will crash with TypeError: Cannot read properties of undefined (reading 'processPayment'), so to avoid this issue we use the registry pattern to only approved payment methods and throw a custom error if the payment method is not supported.

---

### Angle 3: Architecture Trade-Offs (OCP vs Over-Engineering)
**Question**:
"إمتى تطبيق مبدأ الـ OCP واستخدام Registry أو نمط الاستراتيجية يعتبر تعقيد زايد (Over-Engineering) ومضيعة وقت، وإمتى بيكون قرار معماري إجباري لا مفر منه؟"

It will be an over-engineering if the system is small and the number of payment providers is not increasing, 
but it will be an architectural decision that will save us a lot of time and effort if the system is growing and the number of payment providers is increasing.