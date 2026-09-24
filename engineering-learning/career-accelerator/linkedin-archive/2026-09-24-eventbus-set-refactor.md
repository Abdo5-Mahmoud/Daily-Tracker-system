# LinkedIn Post: EventBus Refactor (Set vs Array & Memory Leaks in TypeScript) 📡⚡

> **Date**: 2026-09-24  
> **Status**: Ready to Publish  
> **Topic**: Data Structures (Set vs Array), Observer Pattern, Memory Management, Teardown Pattern  

---

## 📌 النسخة العربية (للنشر على لينكد إن)

```text
لما بنتعلم الـ Observer Pattern أو نيجي نبني EventBus مخصص في TypeScript، أول تفكير بديهي بيجي في بالنا هو تخزين الـ Listeners في مصفوفة عادية (Array).

لكن وأنا براجع وبختبر كود الـ EventBus، لاحظت 3 تفاصيل صغيرة بتفرق جداً في كفاءة الذاكرة والأداء في بيئة الإنتاج:

1. تكرار نفس الـ Handler بالخطأ:
لو نفس الـ Listener اتعمله subscribe مرتين، الـ Array هتخزنه مرتين وهيتنفذ مرتين مع كل حدث.

2. بطء إلغاء الاشتراك (O(N) Unsubscribe):
عشان تشيل Handler من Array، بتضطر تعمل .filter() أو .splice()، وده بيمر على كل العناصر كل مرة.

3. تسريب الذاكرة الصامت (Memory Leak):
لو كل الـ Listeners اتلغوا لحدث معين، الـ Map بتفضل محتفظة بالمفتاح والمصفوفة الفاضية في الذاكرة للأبد!

عشان كده عدلت الكود بالـ 3 تحسينات دول:

✅ الاستبدال بـ Set بدلاً من Array:
- الـ Set بتمنع التكرار تلقائياً (Guaranteed Unique Handlers).
- عمليات الإضافة والحذف بقت بتتم بزمن ثابت O(1) عبر .add() و .delete() مباشرة على نفس المرجع في الذاكرة (In-place mutation).

✅ نمط الـ Teardown Function (نفس فكرة useEffect في React):
خليت دالة subscribe ترجع دالة تفكيك جاهزة:
return () => this.unsubscribe(eventName, handler);
بحيث اللي يناديها يقدر يلغي الاشتراك بسطر واحد بدون ما يبعت نفس الـ Handler تاني.

✅ تنظيف الذاكرة عند الصفر:
أول ما عدد الـ Handlers في الـ Set يوصل 0:
if (handlers?.size === 0) this.listeners.delete(eventName);
بمسح المفتاح بالكامل من الـ Map عشان أسمح للـ Garbage Collector يفرغ المساحة فوراً.

الحاجات دي علمتني إن فهم تفاصيل تراكيب البيانات (Data Structures) زي الفرق بين Set و Array مش مجرد أسئلة نظرية للإنترفيو، بل هي اللي بتحدد استقرار التطبيق واستهلاكه للذاكرة في الإنتاج الحقيقي.

شاركوني في الكومنتس: إيه أكتر تفصيلة صغيرة في Data Structure حسيتوا إنها فرقت معاكم في كفاءة الكود؟

#TypeScript #SoftwareEngineering #DataStructures #DesignPatterns #CleanCode #LearningInPublic #WebDevelopment
```

---

## 📌 English Version (For International Reach / ATS Matching)

```text
When implementing a custom EventBus or applying the Observer Pattern in TypeScript, the intuitive first instinct is often to store subscribers in a standard Array.

However, during a recent architectural review, I analyzed three subtle bottlenecks and memory implications that arise in production:

1. Duplicate Listener Invocations:
If the same callback is subscribed twice, an Array duplicates the reference, triggering multiple executions per published event.

2. Linear-Time Teardowns (O(N)):
Unsubscribing from an Array requires `.filter()` or `.splice()`, scanning elements linearly on every removal.

3. Silent Memory Leaks:
When all handlers for a given event are removed, the parent Map still retains empty array allocations indefinitely in heap memory.

Here are the 3 structural upgrades I engineered:

✅ Migrated from Array to Set (O(1) In-Place Mutations):
Using a `Set` guarantees listener uniqueness out of the box and optimizes insertions/removals to strict O(1) time complexity (`handlers.add()` and `handlers.delete()`) directly against the heap reference.

✅ Self-Teardown Subscription Pattern:
Refactored `subscribe` to return an unsubscribe teardown function (mirroring the React `useEffect` clean-up contract):
`return () => this.unsubscribe(eventName, handler);`
This simplifies consumer ergonomics and guarantees clean teardown scopes.

✅ Zero-Listener Garbage Collection:
Upon deleting a handler, if `handlers?.size === 0`, we immediately call `this.listeners.delete(eventName)`. This drops the key reference, enabling the JavaScript Garbage Collector to reclaim heap memory immediately.

Understanding internal data structure mechanics like `Set` reference semantics vs. `Array` allocations turns theoretical knowledge into robust, production-grade architectures.

How do you manage event lifecycle cleanup and memory boundaries in your production event pipelines?

#TypeScript #SoftwareEngineering #DesignPatterns #CleanArchitecture #Performance #LearningInPublic #WebDev
```
