# Grilling Architectural Quiz: Open/Closed Principle (OCP) 🧠🎯

> **Topic**: Open/Closed Principle (OCP), Registry Pattern, Extensibility without Regression  
> **Status**: Pending Review (To be completed after solution implementation)

---

## 🧭 The 3 Grilling Angles

### Angle 1: Mental Intuition & The Business Value
**Question**:
"ليه بنقول إن الـ `switch-case` داخل دالة الدفع `checkout` يعتبر قنبلة موقوتة في المشاريع الكبيرة، وإزاي مبدأ الـ OCP بيحمي الشركات من خسائر مالية عند إضافة طريقة دفع جديدة؟"

---

### Angle 2: Failure Edge-Cases & Security
**Question**:
"لو عميل أو هاكر بعت في الـ payload طريقة دفع غير مسجلة أصلاً زي `method: 'crypto'`، إيه الكارثة اللي هتحصل لو استدعينا الدالة مباشرة بدون حارس في الـ Registry، وإزاي نصمم معالجة الخطأ دي هندسياً؟"

---

### Angle 3: Architecture Trade-Offs (OCP vs Over-Engineering)
**Question**:
"إمتى تطبيق مبدأ الـ OCP واستخدام Registry أو نمط الاستراتيجية يعتبر تعقيد زايد (Over-Engineering) ومضيعة وقت، وإمتى بيكون قرار معماري إجباري لا مفر منه؟"
