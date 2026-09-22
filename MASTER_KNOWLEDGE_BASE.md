# Master Knowledge Base & Engineering Compass 🧭🧠

> **الغرض**: الدليل المرجعي الشامل والموحد لكل ما تعلمته، بنيته، وثقته في مساحة العمل. افتح هذا الملف في أي وقت لمراجعة المفاهيم الهندسية، السير الذاتية، سكريبتات المقابلات، ومسار مشاريعك في مكان واحد منظم.

---

## 📑 الفهرس السريع (Quick Navigation)

1. [🏛️ المعمارية والمفاهيم الهندسية المكتملة](#1-المعمارية-والمفاهيم-الهندسية-المكتملة)
2. [🧪 الاختبارات وجودة الكود (Testing & Quality)](#2-الاختبارات-وجودة-الكود-testing--quality)
3. [🎯 السير الذاتية المستهدفة والوظائف (Targeted CVs & Job Hunt)](#3-السير-الذاتية-المستهدفة-والوظائف-targeted-cvs--job-hunt)
4. [🎙️ تدريب الإنجليزية والمقابلات (English Mastery)](#4-تدريب-الإنجليزية-والمقابلات-english-mastery)
5. [🤖 برومبتات ودساتير الوكلاء الأذكياء (Agentic Prompts)](#5-برومبتات-ودساتير-الوكلاء-الأذكياء-agentic-prompts)
6. [🏪 تسويق وبيزنس محل الديكور (Local Business)](#6-تسويق-وبيزنس-محل-الديكور-local-business)
7. [📊 ملفات المتابعة وإدارة اليوم (Daily Command Center)](#7-ملفات-المتابعة-وإدارة-اليوم-daily-command-center)

---

## 1. 🏛️ المعمارية والمفاهيم الهندسية المكتملة

الملف المرجعي الرئيسي للشرح التفصيلي والأمثلة:  
🔗 [engineering-learning/LEARNING_NOTES.md](file:///c:/Users/A5/Desktop/growth-workspace-withAI/engineering-learning/LEARNING_NOTES.md)

### المفاهيم المعمارية ومستويات إسنادها:

#### أ. هندسة الخوادم وعديمة الخادم (Serverless & Backend Nuances)
- `[Tier 2: AI-Audited]` **Mongoose Cache Poisoning & In-Flight Promise Caching**:
  - *المشكلة*: إعادة بناء الاتصال في كل ريكويست، وتسمم الذاكرة بوعود فاشلة، وخطر سباق الطلبات المتزامنة `Connection Stampede`.
  - *الحل*: حفظ الوعد غير المتزامن فوراً في `globalThis` لمنع تكرار الاتصال، وتفريغه إلى `null` في `.catch` عند حدوث أي خطأ.
  - *الشرح المفصل*: [LEARNING_NOTES.md (Concept 02)](file:///c:/Users/A5/Desktop/growth-workspace-withAI/engineering-learning/LEARNING_NOTES.md#02-mongoose-promise-caching--cache-poisoning-nextjs-serverless)
  - *الملف المرجعي*: [`devfolio/lib/mongodb.ts`](file:///c:/Users/A5/Desktop/growth-workspace-withAI/devfolio/lib/mongodb.ts)
- `[Tier 2: AI-Audited]` **Serverless Container Freeze & `after()`**:
  - *المشكلة*: الدوال غير المتزامنة التي تعمل بدون `await` تتجمد عند إرسال الرد للمستخدم في السيرفرليس.
  - *الحل*: استخدام دالة `after()` في Next.js 15/16 لتنفيذ المهام الخلفية (مثل إشعارات تيليجرام) دون تأخير الرد للعميل.
  - *الملف*: [`devfolio/lib/telegram.ts`](file:///c:/Users/A5/Desktop/growth-workspace-withAI/devfolio/lib/telegram.ts)
- `[Tier 2: AI-Audited]` **In-Memory Rate Limiting & Memory Cleanup**:
  - *المشكلة*: استهلاك موارد السيرفر وهجمات إغراق الطلبات وتضخم الذاكرة `Memory Leak` بمرور الوقت.
  - *الحل*: بناء محدد طلبات بخوارزمية النافذة المنزلقة مع دالة تنظيف دورية للسجلات القديمة وحفظ الحالة في `globalThis`.
  - *الملف*: [`devfolio/lib/rate-limiter.ts`](file:///c:/Users/A5/Desktop/growth-workspace-withAI/devfolio/lib/rate-limiter.ts)
- `[Tier 2: AI-Audited]` **Honeypot Bot Trap**:
  - *المشكلة*: السبام والبوتات التي تملأ فورم التواصل.
  - *الحل*: حقل مخفي للمستخدم يملأه البوت تلقائياً فيتم إسقاط الطلب بصمت بدون تكلفة `CAPTCHA`.
  - *الملف*: `devfolio/features/contact/`

#### ب. مبادئ التصميم وأنماط البرمجيات (SOLID & Design Patterns)
- `[Tier 2: AI-Audited]` **Single Responsibility Principle (SRP)**:
  - *المفهوم*: فصل المسؤوليات إلى 4 طبقات نقية:
    `Controller -> Service -> Repository -> Validator`
  - *ملف الحل*: [solution-2026-09-10-srp-user-service.ts](file:///c:/Users/A5/Desktop/growth-workspace-withAI/engineering-learning/daily-challenges/solutions/solution-2026-09-10-srp-user-service.ts)
  - *ملف الكويز*: [quiz-2026-09-10-srp-user-service.md](file:///c:/Users/A5/Desktop/growth-workspace-withAI/engineering-learning/daily-challenges/grilling-quizzes/quiz-2026-09-10-srp-user-service.md)
- `[Tier 2: AI-Audited]` **Open/Closed Principle (OCP)**:
  - *المفهوم*: فتح الكود للإضافة وإغلاقه أمام التعديل. التخلص من `switch-case` المعقدة باستخدام نمط السجل والاستراتيجية `Strategy & Registry Pattern`.
  - *ملف الحل*: [solution-2026-09-11-ocp-payment-gateway.ts](file:///c:/Users/A5/Desktop/growth-workspace-withAI/engineering-learning/daily-challenges/solutions/solution-2026-09-11-ocp-payment-gateway.ts)
  - *ملف الكويز*: [quiz-2026-09-11-ocp-payment-gateway.md](file:///c:/Users/A5/Desktop/growth-workspace-withAI/engineering-learning/daily-challenges/grilling-quizzes/quiz-2026-09-11-ocp-payment-gateway.md)
- `[Tier 2: AI-Audited]` **Strategy & Gateway Pattern في المساعد الذكي**:
  - *المفهوم*: عزل مزودي الذكاء الاصطناعي عبر واجهة موحدة `LLMProviderStrategy` وبوابة اتصالات معزولة `GeminiClient` مع معالجة أخطاء المجال `LLMError`.
  - *الملف*: [`devfolio/features/ai-workflow/lib/llm.ts`](file:///c:/Users/A5/Desktop/growth-workspace-withAI/devfolio/features/ai-workflow/lib/llm.ts)
- `[Tier 3: Solo-Authored]` **The Adapter Pattern & Anti-Corruption Layer (Bosta & Stripe)**:
  - *المفهوم*: ترويض الواجهات والمكتبات الخارجية غير المتوافقة دون تلويث كود النظام الداخلي، مع عزل أخطاء المزود الخارجي في طبقة حماية (`ACL`).
  - *الشرح المفصل*: [LEARNING_NOTES.md (Concept 13)](file:///c:/Users/A5/Desktop/growth-workspace-withAI/engineering-learning/LEARNING_NOTES.md#13-the-adapter-pattern--anti-corruption-layer-bosta-shipping--stripe-integration)
  - *ملفات الحل*: [`solution-2026-09-17-decor-shipping-engine.ts`](file:///c:/Users/A5/Desktop/growth-workspace-withAI/engineering-learning/daily-challenges/my-solutions/solution-2026-09-17-decor-shipping-engine.ts) | [`solution-2026-09-17-adapter-payment-gateway.ts`](file:///c:/Users/A5/Desktop/growth-workspace-withAI/engineering-learning/daily-challenges/my-solutions/solution-2026-09-17-adapter-payment-gateway.ts)
- `[Tier 3: Solo-Authored]` **The Observer Pattern & Type-Safe EventBus with Fault Isolation**:
  - *المفهوم*: معمارية موجهة بالأحداث، وسيط مركزي مع حلقة تكرار تعزل الأعطال `Fault Isolation` عبر `try/catch` لكل مستمع بشكل مستقل، مع أمان تام للأنواع باستخدام `keyof Events` و `Events[K]`.
  - *الشرح المفصل*: [LEARNING_NOTES.md (Concept 14)](file:///c:/Users/A5/Desktop/growth-workspace-withAI/engineering-learning/LEARNING_NOTES.md#14-the-observer-pattern--type-safe-eventbus-with-fault-isolation)
  - *ملف الحل*: [`solution-2026-09-18-observer-event-bus.ts`](file:///c:/Users/A5/Desktop/growth-workspace-withAI/engineering-learning/daily-challenges/my-solutions/solution-2026-09-18-observer-event-bus.ts)
- `[Tier 3: Solo-Authored]` **Liskov Substitution Principle (LSP) & Behavioral Subtyping**:
  - *المفهوم*: الفئات الفرعية يجب أن تستبدل الفئات الأصلية دون كسر العقد السلوكي أو رمي استثناءات غير متوقعة. التخلص من فخ `instanceof` عبر تجزئة الواجهات.
  - *الشرح المفصل*: [LEARNING_NOTES.md (Concept 15)](file:///c:/Users/A5/Desktop/growth-workspace-withAI/engineering-learning/LEARNING_NOTES.md#15-liskov-substitution-principle-lsp--behavioral-subtyping)
  - *ملف الحل*: [`solution-2026-09-13-lsp-refund-gateway.ts`](file:///c:/Users/A5/Desktop/growth-workspace-withAI/engineering-learning/daily-challenges/solutions/solution-2026-09-13-lsp-refund-gateway.ts)
- `[Tier 3: Solo-Authored]` **Architectural Integration: Unified Order Fulfillment Engine**:
  - *المفهوم*: تجميع وتكامل أنماط التصميم الثلاثة في تدفق واحد متماسك (Strategy لاختيار الناقل + Adapter لترجمة شروط بوسطة + Observer لبث الأحداث دون ارتباط مباشر مع عزل الأعطال).
  - *الشرح المفصل*: [LEARNING_NOTES.md (Concept 16)](file:///c:/Users/A5/Desktop/growth-workspace-withAI/engineering-learning/LEARNING_NOTES.md#16-architectural-integration-unified-order-fulfillment-engine-strategy--adapter--observer)
  - *ملف الحل*: [`solution-2026-09-22-unified-order-fulfillment-engine.ts`](file:///c:/Users/A5/Desktop/growth-workspace-withAI/engineering-learning/daily-challenges/my-solutions/solution-2026-09-22-unified-order-fulfillment-engine.ts)

#### ج. خارطة مشاريع الفول ستاك ونظام أجايل (Fullstack Projects & Agile Roadmap)
- **محرك متجر الديكور وسبرنتات أجايل الرأسية (Decor Store Commerce Engine)**:
  - *المنهجية*: نظام سبرنتات أسبوعية بتقسيم الشرائح الرأسية (Vertical Slices) لخدمة المحل كعميل أول:
    `PostgreSQL + Prisma -> Auth/RBAC -> Concurrency/Locking -> TanStack Query/Docker`
  - *الوثيقة الكاملة للمسار*: [ROADMAP_AND_AGILE_SPRINTS.md](file:///c:/Users/A5/Desktop/growth-workspace-withAI/engineering-learning/decor-store-engine/ROADMAP_AND_AGILE_SPRINTS.md)

---

## 2. 🧪 الاختبارات وجودة الكود (Testing & Quality)

- **أجنحة اختبارات ديفوليو (5 Test Suites / 38 Tests Passing 100%)**:
  - *تصنيف الإسناد*: `[Tier 1: AI-Generated Scaffolding]` (تم توليد الهيكل والاختبارات كمرجع لضمان سلامة المشروع، وليست من تأليف عبده المنفرد من الصفر).
  - `__tests__/smoke.test.ts`: اختبار تشغيل واستجابة المسارات الأساسية.
  - `__tests__/auth.test.ts`: اختبار أمان الجلسات وحماية الكوكيز.
  - `__tests__/api-boundaries.test.ts`: اختبار حدود واجهات البرمجة والتحقق من المدخلات.
  - `__tests__/ai-assistant.test.ts`: اختبار المزود الوهمي ومحدد الطلبات الحسابي بدقة 100%.
  - `__tests__/projects-validation.test.ts`: اختبار سلامة بيانات المشاريع ومخطط Zod.
- **منصة الاختبار مقابل الحالة الاختبارية (Test Harness vs. Test Case)**:
  - *تصنيف الإسناد*: `[Tier 2: AI-Audited]`
  - *المفهوم*: بناء منصة بيئة عزل وحواضن تشغيل محكمة (`Test Harness`) لحماية الإنتاج من الخصم المالي، وتلويث الداتابيز، والاختبارات المتذبذبة.
  - *الشرح الكامل*: [LEARNING_NOTES.md (Concept 12)](file:///c:/Users/A5/Desktop/growth-workspace-withAI/engineering-learning/LEARNING_NOTES.md#12-test-harness-vs-test-case-isolated-execution-rigs--production-risk-elimination)
- **أمر التشغيل المعتمد**:
  ```bash
  npm test
  ```

---

## 3. 🎯 السير الذاتية المستهدفة والوظائف (Targeted CVs & Job Hunt)

دليل بروتوكول التقديم المباشر:  
🔗 [engineering-learning/targeted-cvs/README.md](file:///c:/Users/A5/Desktop/growth-workspace-withAI/engineering-learning/targeted-cvs/README.md)

### ملفات السير الذاتية الجاهزة حسب الدور:
1. **الواجهات الأمامية (Frontend Specialist)**:
   - النص المصدر: [CV_FRONTEND_REACT_SPECIALIST.md](file:///c:/Users/A5/Desktop/growth-workspace-withAI/engineering-learning/targeted-cvs/CV_FRONTEND_REACT_SPECIALIST.md)
   - ملف الـ PDF المعتمد (المستخدم في فودافون وبينو):  
     📄 [Abdullah_Mahmoud_Fawzy_FRONTEND_DEVELOPER.pdf](file:///c:/Users/A5/Desktop/growth-workspace-withAI/Abdullah_Mahmoud_Fawzy_FRONTEND_DEVELOPER.pdf)
2. **الفول ستاك (Fullstack TypeScript Engineer)**:
   - النص المصدر: [CV_FULLSTACK_TYPESCRIPT_ENGINEER.md](file:///c:/Users/A5/Desktop/growth-workspace-withAI/engineering-learning/targeted-cvs/CV_FULLSTACK_TYPESCRIPT_ENGINEER.md)
   - ملف الـ PDF المعتمد:  
     📄 [Abdullah_Mahmoud_Fawzy_FullStack.pdf](file:///c:/Users/A5/Desktop/growth-workspace-withAI/Abdullah_Mahmoud_Fawzy_FullStack.pdf)
3. **السيرة الأساسية الكاملة (All-Rounder Master CV)**:
   - 📄 [Abdullah_Mahmoud_Fawzy_CV.pdf](file:///c:/Users/A5/Desktop/growth-workspace-withAI/Abdullah_Mahmoud_Fawzy_CV.pdf)

### سجل التقديمات الرسمية النشطة:
- ✅ **شركة فودافون (Vodafone)**: تم التقديم لوظيفة مطور واجهات أمامية بالسيرة المخصصة.
- ✅ **شركة بينو تكنولوجيز دبي (BENO Technologies)**: تم التقديم لوظيفة مطور واجهات مبتدئ مع رسالة تعريفية مخصصة للعمل الذكي بالذكاء الاصطناعي والتواصل مع زميل جامعة حلوان.
- ✅ **شركة هاير فيد (Hire Feed)**: تم التقديم لوظيفة مطور جافاسكريبت فرونت إند عن بُعد (Remote).
- ⏳ **شركة بت 68 (BIT68)**: جاهز للإرسال المباشر لمسؤولة التوظيف (نوران) لوظيفة مطور فول ستاك.

---

## 4. 🎙️ تدريب الإنجليزية والمقابلات (English Mastery)

- **سجل التدريب اللغوي وترقية العبارات**:  
  🔗 [engineering-learning/ENGLISH_MASTERY_LOG.md](file:///c:/Users/A5/Desktop/growth-workspace-withAI/engineering-learning/ENGLISH_MASTERY_LOG.md)
  (يحتوي على مقارنات الصيغ الركيكة مقابل الصيغ الاحترافية لكبار المهندسين وسجل الأخطاء المتكررة).
- **دستور منشورات لينكد إن (Learning in Public Playbook)**:  
  🔗 [engineering-learning/career-accelerator/LINKEDIN_CONTENT_PLAYBOOK.md](file:///c:/Users/A5/Desktop/growth-workspace-withAI/engineering-learning/career-accelerator/LINKEDIN_CONTENT_PLAYBOOK.md)
  (القواعد الأربع لنبرة عبده الصادقة، ونموذج منشور حماية المساعد الذكي الجاهز للنشر).

---

## 5. 🤖 برومبتات ودساتير الوكلاء الأذكياء (Agentic Prompts)

- **دستور وكيل ديفوليو (Cursor / Windsurf / Claude)**:  
  🔗 [engineering-learning/DEVFOLIO_AGENT_SYSTEM_PROMPT.md](file:///c:/Users/A5/Desktop/growth-workspace-withAI/engineering-learning/DEVFOLIO_AGENT_SYSTEM_PROMPT.md)
  (برومبت صلب يجبر الإيجنت على نبرة المنتور الصارم، منع التطبيل، عدم كسر الاختبارات الـ 38، ورادار المفاهيم المعمارية، ومصفوفة الوكلاء المجانية).
- **دستور المنتور ومصفوفة تشغيل الوكلاء المجانية (Multi-Agent Operations Matrix)**:  
  🔗 [abdo-personal-mentor/SKILL.md (Section 11)](file:///c:/Users/A5/Desktop/growth-workspace-withAI/.agents/skills/abdo-personal-mentor/SKILL.md)
  (هيكلية قيادة الوكلاء: Antigravity كقائد أعلى، JEV للتصنيف والمشاورة الحتمية، Qwen 3.8 للكود الثقيل، Nemotron 550B للتدقيق وحالات الحافة، Gemini 2.5 Flash للمسح الشامل، و Codex للترقيع السريع).

---

## 6. 🏪 تسويق وبيزنس محل الديكور (Local Business)

- **خطة نمو المحل والتسويق**:  
  🔗 [local-business-store/STORE_GROWTH_PLAN.md](file:///c:/Users/A5/Desktop/growth-workspace-withAI/local-business-store/STORE_GROWTH_PLAN.md)
- **مواصفات وكلاء الذكاء الاصطناعي للمحل (إخراج الفيديو والصور)**:  
  🔗 [local-business-store/store-marketing/AI_AGENTS_SPECIFICATIONS.md](file:///c:/Users/A5/Desktop/growth-workspace-withAI/local-business-store/store-marketing/AI_AGENTS_SPECIFICATIONS.md)
- **كتالوج المنتجات ونصوص البوستات**:  
  🔗 [local-business-store/store-marketing/WORKFLOW.md](file:///c:/Users/A5/Desktop/growth-workspace-withAI/local-business-store/store-marketing/WORKFLOW.md)

---

## 7. 📊 ملفات المتابعة وإدارة اليوم (Daily Command Center)

- **لوحة تتبع التقدم والمهام الحية**:  
  🔗 [PROGRESS_TRACKER.md](file:///c:/Users/A5/Desktop/growth-workspace-withAI/PROGRESS_TRACKER.md)
- **بروفايل ومعلومات عبده الدائمة**:  
  🔗 [USER_CONTEXT_PROFILE.md](file:///c:/Users/A5/Desktop/growth-workspace-withAI/USER_CONTEXT_PROFILE.md)

---

> 💡 **نصيحة ذهبية**: أي مفهوم جديد تتعلمه أو تحدي تخلصه، هنربطه فوراً بهذا الملف، ليكون بوصلتك الهندسية الدائمة طوال رحلتك.
