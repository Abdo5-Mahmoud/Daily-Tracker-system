# Grilling Architectural Quiz: Liskov Substitution Principle (LSP) 🧠🎯

> **Topic**: Liskov Substitution Principle (LSP), Behavioral Subtyping, Preconditions & Postconditions  
> **Status**: Ready for Sunday Morning Review ⏳

---

## 🧭 The 3 Grilling Angles

### Angle 1: Mental Intuition & The Business Value
**Question**:
"ليه رمي استثناء زي `throw new Error('Method not supported')` داخل دالة في فئة فرعية يعتبر خيانة لمبدأ ليسكوف وقنبلة موقوتة في الأنظمة الموزعة ومشاريع التجارة الإلكترونية، وإزاي ده بيكسر ثقة الكود في العقد المبرم؟"

ببساطة لاننا منتظرين behavior مختلف حسب الكونتراكت المتفق عليه ولما النظام يرمي استثناء ده بيعمل breakdown في العقد ده مما يسبب سوء فهم


---

### Angle 2: Failure Edge-Cases & Compile-Time Traps
**Question**:
"إزاي الـ TypeScript Compiler ممكن يخدعك ويسمح بالكود يمر 100% بدون أي أخطاء أنواع، بينما في وقت التشغيل (Runtime) السيستم يقع بكارثة بسبب كسر مبدأ ليسكوف؟ إيه الفرق بين التوافق الشكلي للأنواع (Type Compatibility) والتوافق السلوكي (Behavioral Compatibility)؟"

التوافق الشكلي في Runtime بيعمل تشيك على التايبس او اللي راجع, مش بيعمل تشيك على behavior فببساطة هو بيخدعك ويسمح بالكود يمر 100% بدون أي أخطاء أنواع, بينما في وقت التشغيل (Runtime) السيستم يقع بكارثة بسبب كسر مبدأ ليسكوف 


---

### Angle 3: Architecture Trade-Offs (Segregation vs Capabilities)
**Question**:
"لو عندنا 10 بوابات دفع، 3 منهم بيدعموا الاسترداد، و 7 لا يدعموا، إمتى نفضل فصل الواجهات بالكامل (Interface Segregation) كعلاج لكسر ليسكوف، وإمتى نستخدم نمط فحص القدرات (Capability / Feature Checking Pattern)؟ إيه عيوب ومزايا كل خيار؟"

فصل الواجهات بالكامل علاج ل LSP لان ده بيخلي ال behavior المتوقع مطابق لل contract ببساطة, اما بالنسبة ل ISP فهو عدم وضع capabilities مش محتاجينها او ملهاش استخدام جوه interface واحد