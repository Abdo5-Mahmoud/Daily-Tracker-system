# Master Knowledge Base & Engineering Compass 🧭🧠

> **الغرض**: الدليل المرجعي الشامل وخريطة المحتوى المركزية (Map of Content - MOC) لكل ما تعلمته، بنيته، وثقته في مساحة العمل. افتح هذا الملف في أي وقت لمراجعة شبكة المفاهيم الهندسية، السير الذاتية، سكريبتات المقابلات، وبيزنس المتجر في بيئة واحدة متكاملة ومترابطة داخل Obsidian.

---

## 🗺️ خريطة ربط الأهداف الكبرى بالمهارات والملفات التنفيذية (Goals-to-Skills Matrix)

| الركيزة الاستراتيجية (Goal) | المهارة الموجهة (Skill) | ملفات المعمارية والتنفيذ في مساحة العمل | مؤشر الحالة |
| :--- | :--- | :--- | :--- |
| **1. Devfolio AI & هندسة الواجهات** | [abdo-personal-mentor](.agents/skills/abdo-personal-mentor/SKILL.md) | • [LEARNING_NOTES.md](engineering-learning/LEARNING_NOTES.md)<br>• [DEVFOLIO_AGENT_SYSTEM_PROMPT.md](engineering-learning/DEVFOLIO_AGENT_SYSTEM_PROMPT.md)<br>• [PROGRESS_TRACKER.md](PROGRESS_TRACKER.md) | 🟢 **100% مكتمل ولايف** (38/38 اختبارات خضراء) |
| **2. إتقان الإنجليزية وجاهزية المقابلات** | [abdo-personal-mentor](.agents/skills/abdo-personal-mentor/SKILL.md) | • [ENGLISH_MASTERY_LOG.md](engineering-learning/ENGLISH_MASTERY_LOG.md)<br>• [CAREER_ACCELERATION_PLAN.md](engineering-learning/CAREER_ACCELERATION_PLAN.md) | 🟡 **نشط يومياً** (ترقية العبارات ومحاكاة الإنترفيو) |
| **3. اقتناص الدخل (وظيفة / فريلانس)** | [abdo-personal-mentor](.agents/skills/abdo-personal-mentor/SKILL.md) | • [targeted-cvs/README.md](engineering-learning/targeted-cvs/README.md)<br>• [LINKEDIN_CONTENT_PLAYBOOK.md](engineering-learning/career-accelerator/LINKEDIN_CONTENT_PLAYBOOK.md) | 🚀 **نشط يومياً** (معدل تقديمين مستهدفين يومياً) |
| **4. متجر أرتيفلورا وأمازون (Flora_Home)** | [amazon-ecommerce-growth](.agents/skills/amazon-ecommerce-growth/SKILL.md) | • [STORE_GROWTH_PLAN.md](local-business-store/STORE_GROWTH_PLAN.md)<br>• [AMAZON_EGYPT_LISTING_BLUEPRINT_PLANT_30CM.md](local-business-store/AMAZON_EGYPT_LISTING_BLUEPRINT_PLANT_30CM.md)<br>• [AMAZON_MARKET_AUDIT_FLOWER_VASES.md](local-business-store/AMAZON_MARKET_AUDIT_FLOWER_VASES.md)<br>• [WORKFLOW.md](local-business-store/store-marketing/WORKFLOW.md)<br>• [AI_AGENTS_SPECIFICATIONS.md](local-business-store/store-marketing/AI_AGENTS_SPECIFICATIONS.md) | 🌿 **نشط ميدانياً** (نشر ريلز + إدراج أول منتج) |

---

## 📑 الفهرس السريع (Quick Navigation)

1. [🏛️ المعمارية والمفاهيم الهندسية المكتملة](#1-المعمارية-والمفاهيم-الهندسية-المكتملة)
2. [🧪 الاختبارات وجودة الكود (Testing & Quality)](#2-الاختبارات-وجودة-الكود-testing--quality)
3. [🎯 السير الذاتية المستهدفة والوظائف (Targeted CVs & Job Hunt)](#3-السير-الذاتية-المستهدفة-والوظائف-targeted-cvs--job-hunt)
4. [🎙️ تدريب الإنجليزية والمقابلات (English Mastery)](#4-تدريب-الإنجليزية-والمقابلات-english-mastery)
5. [🤖 برومبتات ودساتير الوكلاء الأذكياء (Agentic Prompts)](#5-برومبتات-ودساتير-الوكلاء-الأذكياء-agentic-prompts)
6. [🏪 تسويق وبيزنس محل أرتيفلورا وأمازون مصر (Local & E-Commerce Business)](#6-تسويق-وبيزنس-محل-أرتيفلورا-وأمازون-مصر-local--e-commerce-business)
7. [📊 ملفات المتابعة وإدارة اليوم (Daily Command Center)](#7-ملفات-المتابعة-وإدارة-اليوم-daily-command-center)

---

## 1. 🏛️ المعمارية والمفاهيم الهندسية المكتملة

الملف المرجعي الرئيسي للشرح التفصيلي والأمثلة:  
🔗 [engineering-learning/LEARNING_NOTES.md](engineering-learning/LEARNING_NOTES.md)

### المفاهيم المعمارية ومستويات إسنادها:

#### أ. هندسة الخوادم وعديمة الخادم (Serverless & Backend Nuances)
- `[Tier 2: AI-Audited]` **Mongoose Cache Poisoning & In-Flight Promise Caching**:
  - *المشكلة*: إعادة بناء الاتصال في كل ريكويست، وتسمم الذاكرة بوعود فاشلة، وخطر سباق الطلبات المتزامنة `Connection Stampede`.
  - *الحل*: حفظ الوعد غير المتزامن فوراً في `globalThis` لمنع تكرار الاتصال، وتفريغه إلى `null` في `.catch` عند حدوث أي خطأ.
  - *الشرح المفصل*: [LEARNING_NOTES.md (Concept 02)](engineering-learning/LEARNING_NOTES.md#02-mongoose-promise-caching--cache-poisoning-nextjs-serverless)
- `[Tier 2: AI-Audited]` **Serverless Container Freeze & `after()`**:
  - *المشكلة*: الدوال غير المتزامنة التي تعمل بدون `await` تتجمد عند إرسال الرد للمستخدم في السيرفرليس.
  - *الحل*: استخدام دالة `after()` في Next.js 15/16 لتنفيذ المهام الخلفية دون تأخير الرد للعميل.
- `[Tier 2: AI-Audited]` **In-Memory Rate Limiting & Memory Cleanup**:
  - *المشكلة*: استهلاك موارد السيرفر وهجمات إغراق الطلبات وتضخم الذاكرة `Memory Leak` بمرور الوقت.
  - *الحل*: بناء محدد طلبات بخوارزمية النافذة المنزلقة مع دالة تنظيف دورية للسجلات القديمة وحفظ الحالة في `globalThis`.
- `[Tier 2: AI-Audited]` **Honeypot Bot Trap**:
  - *المشكلة*: السبام والبوتات التي تملأ فورم التواصل.
  - *الحل*: حقل مخفي للمستخدم يملأه البوت تلقائياً فيتم إسقاط الطلب بصمت بدون تكلفة `CAPTCHA`.

#### ب. مبادئ التصميم وأنماط البرمجيات (SOLID & Design Patterns)
- `[Tier 2: AI-Audited]` **Single Responsibility Principle (SRP)**:
  - *المفهوم*: فصل المسؤوليات إلى 4 طبقات نقية:
    `Controller -> Service -> Repository -> Validator`
  - *ملف الحل*: [solution-2026-09-10-srp-user-service.ts](engineering-learning/daily-challenges/solutions/solution-2026-09-10-srp-user-service.ts)
  - *ملف الكويز*: [quiz-2026-09-10-srp-user-service.md](engineering-learning/daily-challenges/grilling-quizzes/quiz-2026-09-10-srp-user-service.md)
- `[Tier 2: AI-Audited]` **Open/Closed Principle (OCP)**:
  - *المفهوم*: فتح الكود للإضافة وإغلاقه أمام التعديل. التخلص من `switch-case` المعقدة باستخدام نمط السجل والاستراتيجية `Strategy & Registry Pattern`.
  - *ملف الحل*: [solution-2026-09-11-ocp-payment-gateway.ts](engineering-learning/daily-challenges/solutions/solution-2026-09-11-ocp-payment-gateway.ts)
  - *ملف الكويز*: [quiz-2026-09-11-ocp-payment-gateway.md](engineering-learning/daily-challenges/grilling-quizzes/quiz-2026-09-11-ocp-payment-gateway.md)
- `[Tier 2: AI-Audited]` **Strategy & Gateway Pattern في المساعد الذكي**:
  - *المفهوم*: عزل مزودي الذكاء الاصطناعي عبر واجهة موحدة `LLMProviderStrategy` وبوابة اتصالات معزولة `GeminiClient` مع معالجة أخطاء المجال `LLMError`.
- `[Tier 3: Solo-Authored]` **The Adapter Pattern & Anti-Corruption Layer (Bosta & Stripe)**:
  - *المفهوم*: ترويض الواجهات والمكتبات الخارجية غير المتوافقة دون تلويث كود النظام الداخلي، مع عزل أخطاء المزود الخارجي في طبقة حماية (`ACL`).
  - *الشرح المفصل*: [LEARNING_NOTES.md (Concept 13)](engineering-learning/LEARNING_NOTES.md#13-the-adapter-pattern--anti-corruption-layer-bosta-shipping--stripe-integration)
  - *ملفات الحل*: [solution-2026-09-17-decor-shipping-engine.ts](engineering-learning/daily-challenges/my-solutions/solution-2026-09-17-decor-shipping-engine.ts) | [solution-2026-09-17-adapter-payment-gateway.ts](engineering-learning/daily-challenges/my-solutions/solution-2026-09-17-adapter-payment-gateway.ts)
- `[Tier 3: Solo-Authored]` **The Observer Pattern & Type-Safe EventBus with Fault Isolation**:
  - *المفهوم*: معمارية موجهة بالأحداث، وسيط مركزي مع حلقة تكرار تعزل الأعطال `Fault Isolation` عبر `try/catch` لكل مستمع بشكل مستقل، مع أمان تام للأنواع باستخدام `keyof Events` و `Events[K]`.
  - *الشرح المفصل*: [LEARNING_NOTES.md (Concept 14)](engineering-learning/LEARNING_NOTES.md#14-the-observer-pattern--type-safe-eventbus-with-fault-isolation)
  - *ملف الحل*: [solution-2026-09-18-observer-event-bus.ts](engineering-learning/daily-challenges/my-solutions/solution-2026-09-18-observer-event-bus.ts)
- `[Tier 3: Solo-Authored]` **Liskov Substitution Principle (LSP) & Behavioral Subtyping**:
  - *المفهوم*: الفئات الفرعية يجب أن تستبدل الفئات الأصلية دون كسر العقد السلوكي أو رمي استثناءات غير متوقعة. التخلص من فخ `instanceof` عبر تجزئة الواجهات.
  - *الشرح المفصل*: [LEARNING_NOTES.md (Concept 15)](engineering-learning/LEARNING_NOTES.md#15-liskov-substitution-principle-lsp--behavioral-subtyping)
  - *ملف الحل*: [solution-2026-09-13-lsp-refund-gateway.ts](engineering-learning/daily-challenges/solutions/solution-2026-09-13-lsp-refund-gateway.ts)
- `[Tier 3: Solo-Authored]` **Architectural Integration: Unified Order Fulfillment Engine**:
  - *المفهوم*: تجميع وتكامل أنماط التصميم الثلاثة في تدفق واحد متماسك (Strategy لاختيار الناقل + Adapter لترجمة شروط بوسطة + Observer لبث الأحداث دون ارتباط مباشر مع عزل الأعطال).
  - *الشرح المفصل*: [LEARNING_NOTES.md (Concept 16)](engineering-learning/LEARNING_NOTES.md#16-architectural-integration-unified-order-fulfillment-engine-strategy--adapter--observer)
  - *ملف الحل*: [solution-2026-09-22-unified-order-fulfillment-engine.ts](engineering-learning/daily-challenges/my-solutions/solution-2026-09-22-unified-order-fulfillment-engine.ts)

#### ج. خارطة مشاريع الفول ستاك ونظام أجايل (Fullstack Projects & Agile Roadmap)
- **محرك متجر الديكور وسبرنتات أجايل الرأسية (Decor Store Commerce Engine)**:
  - *المنهجية*: نظام سبرنتات أسبوعية بتقسيم الشرائح الرأسية (Vertical Slices) لخدمة المتجر كعميل أول:
    `PostgreSQL + Prisma -> Auth/RBAC -> Concurrency/Locking -> TanStack Query/Docker`
  - *الوثيقة الكاملة للمسار*: [ROADMAP_AND_AGILE_SPRINTS.md](engineering-learning/decor-store-engine/ROADMAP_AND_AGILE_SPRINTS.md)

---

## 2. 🧪 الاختبارات وجودة الكود (Testing & Quality)

- **أجنحة اختبارات ديفوليو (5 Test Suites / 38 Tests Passing 100%)**:
  - *تصنيف الإسناد*: `[Tier 1: AI-Generated Scaffolding]` (تم توليد الهيكل والاختبارات كمرجع لضمان سلامة المشروع).
  - `__tests__/smoke.test.ts`: اختبار تشغيل واستجابة المسارات الأساسية.
  - `__tests__/auth.test.ts`: اختبار أمان الجلسات وحماية الكوكيز.
  - `__tests__/api-boundaries.test.ts`: اختبار حدود واجهات البرمجة والتحقق من المدخلات.
  - `__tests__/ai-assistant.test.ts`: اختبار المزود الوهمي ومحدد الطلبات الحسابي بدقة 100%.
  - `__tests__/projects-validation.test.ts`: اختبار سلامة بيانات المشاريع ومخطط Zod.
- **منصة الاختبار مقابل الحالة الاختبارية (Test Harness vs. Test Case)**:
  - *تصنيف الإسناد*: `[Tier 2: AI-Audited]`
  - *المفهوم*: بناء منصة بيئة عزل وحواضن تشغيل محكمة (`Test Harness`) لحماية الإنتاج من الخصم المالي، وتلويث الداتابيز، والاختبارات المتذبذبة.
  - *الشرح الكامل*: [LEARNING_NOTES.md (Concept 12)](engineering-learning/LEARNING_NOTES.md#12-test-harness-vs-test-case-isolated-execution-rigs--production-risk-elimination)

---

## 3. 🎯 السير الذاتية المستهدفة والوظائف (Targeted CVs & Job Hunt)

دليل بروتوكول التقديم المباشر:  
🔗 [engineering-learning/targeted-cvs/README.md](engineering-learning/targeted-cvs/README.md)

### ملفات السير الذاتية الجاهزة حسب الدور:
1. **الواجهات الأمامية (Frontend Specialist)**:
   - النص المصدر: [CV_FRONTEND_REACT_SPECIALIST.md](engineering-learning/targeted-cvs/CV_FRONTEND_REACT_SPECIALIST.md)
   - ملف الـ PDF المعتمد: [Abdullah_Mahmoud_Fawzy_FRONTEND_DEVELOPER.pdf](engineering-learning/targeted-cvs/Abdullah_Mahmoud_Fawzy_FRONTEND_DEVELOPER.pdf)
2. **الفول ستاك (Fullstack TypeScript Engineer)**:
   - النص المصدر: [CV_FULLSTACK_TYPESCRIPT_ENGINEER.md](engineering-learning/targeted-cvs/CV_FULLSTACK_TYPESCRIPT_ENGINEER.md)
   - ملف الـ PDF المعتمد: [Abdullah_Mahmoud_Fawzy_FullStack.pdf](engineering-learning/targeted-cvs/Abdullah_Mahmoud_Fawzy_FullStack.pdf)
3. **السيرة المخصصة لفودافون (Vodafone Frontend Specialist)**:
   - النص المصدر: [CV_VODAFONE_FRONTEND_DEVELOPER.md](engineering-learning/targeted-cvs/CV_VODAFONE_FRONTEND_DEVELOPER.md)

### سجل التقديمات الرسمية النشطة:
- ✅ **شركة فودافون (Vodafone)**: تم التقديم لوظيفة مطور واجهات أمامية بالسيرة المخصصة.
- ✅ **شركة بينو تكنولوجيز دبي (BENO Technologies)**: تم التقديم لوظيفة مطور واجهات مبتدئ مع خطاب تقديم ذكي.
- ✅ **شركة سكيليزي بالدقي (Scalezy)**: تم التقديم المباشر لوظيفة مطور متكامل مبتدئ عبر الواتساب.
- ✅ **شركة بيكسيبو (Pixibo)**: تم التقديم لوظيفة مطور واجهات مبتدئ عبر سمارت ريكروترز.
- ✅ **شركة شركتي (Sherkety)**: تم التقديم لتدريب المطور المتكامل والذكاء الاصطناعي عبر وظف.
- ✅ **أمير سامي (Amir Sami)**: تم التقديم لوظيفة مطور واجهات عن بُعد بالكامل عبر الواتساب.
- ✅ **عمر بكري (Omar Bakry)**: تم التقديم لفرصة مطور واجهات دوام جزئي عن بُعد عبر لينكد إن.
- ✅ **شركة فونديرًا (Vondera)**: تم التقديم لوظيفة مطور ويب وتهيئة التجار عبر الإيميل المباشر للمؤسس محمد الشريف بسيرة مطور الواجهات.

---

## 4. 🎙️ تدريب الإنجليزية والمقابلات (English Mastery)

- **سجل التدريب اللغوي وترقية العبارات**:  
  🔗 [engineering-learning/ENGLISH_MASTERY_LOG.md](engineering-learning/ENGLISH_MASTERY_LOG.md)  
  (يحتوي على مقارنات الصيغ الركيكة مقابل الصيغ الاحترافية لكبار المهندسين وسجل الأخطاء المتكررة).
- **خطة تسريع المسار المهني واقتناص الوظائف**:  
  🔗 [engineering-learning/CAREER_ACCELERATION_PLAN.md](engineering-learning/CAREER_ACCELERATION_PLAN.md)
- **دستور منشورات لينكد إن (Learning in Public Playbook)**:  
  🔗 [engineering-learning/career-accelerator/LINKEDIN_CONTENT_PLAYBOOK.md](engineering-learning/career-accelerator/LINKEDIN_CONTENT_PLAYBOOK.md)

---

## 5. 🤖 برومبتات ودساتير الوكلاء الأذكياء (Agentic Prompts)

- **دستور وكيل ديفوليو (Cursor / Windsurf / Claude)**:  
  🔗 [engineering-learning/DEVFOLIO_AGENT_SYSTEM_PROMPT.md](engineering-learning/DEVFOLIO_AGENT_SYSTEM_PROMPT.md)  
  (برومبت صلب يجبر الإيجنت على نبرة المنتور الصارم، منع التطبيل، حماية الاختبارات الـ 38، ورادار المفاهيم المعمارية).
- **دستور المنتور ومصفوفة تشغيل الوكلاء المجانية (Multi-Agent Operations Matrix)**:  
  🔗 [.agents/skills/abdo-personal-mentor/SKILL.md](.agents/skills/abdo-personal-mentor/SKILL.md)  
  (قيادة الوكلاء: Antigravity كقائد أعلى، JEV للتصنيف والمشاورة، Qwen 3.8 للكود، Nemotron 550B للتدقيق، و Gemini 2.5 Flash للمسح).

---

## 6. 🏪 تسويق وبيزنس محل أرتيفلورا وأمازون مصر (Local & E-Commerce Business)

- **مركز قيادة وفهرس ملفات بيزنس المتجر**:  
  🔗 [local-business-store/README.md](local-business-store/README.md)
- **خطة نمو المحل والتسويق والأتمتة**:  
  🔗 [local-business-store/STORE_GROWTH_PLAN.md](local-business-store/STORE_GROWTH_PLAN.md)
- **مخطط إدراج أول منتج رسمي على أمازون مصر**:  
  🔗 [local-business-store/AMAZON_EGYPT_LISTING_BLUEPRINT_PLANT_30CM.md](local-business-store/AMAZON_EGYPT_LISTING_BLUEPRINT_PLANT_30CM.md)
- **دراسة ومسح سوق أمازون مصر لفئات الفازات والبوكيهات الصغيرة**:  
  🔗 [local-business-store/AMAZON_MARKET_AUDIT_FLOWER_VASES.md](local-business-store/AMAZON_MARKET_AUDIT_FLOWER_VASES.md)
- **دليل كراتين الشحن والتغليف وموردي الجملة والطباعة**:  
  🔗 [local-business-store/PACKAGING_AND_SUPPLIERS_GUIDE.md](local-business-store/PACKAGING_AND_SUPPLIERS_GUIDE.md)
- **دليل مهارة التجارة الإلكترونية وأمازون مصر**:  
  🔗 [.agents/skills/amazon-ecommerce-growth/SKILL.md](.agents/skills/amazon-ecommerce-growth/SKILL.md)
- **مواصفات وكلاء الذكاء الاصطناعي للمحل (إخراج الفيديو والصور)**:  
  🔗 [local-business-store/store-marketing/AI_AGENTS_SPECIFICATIONS.md](local-business-store/store-marketing/AI_AGENTS_SPECIFICATIONS.md)
- **بروتوكول التصوير وكتالوج المنتجات ونصوص البوستات**:  
  🔗 [local-business-store/store-marketing/WORKFLOW.md](local-business-store/store-marketing/WORKFLOW.md)

---

## 7. 📊 ملفات المتابعة وإدارة اليوم (Daily Command Center)

- **لوحة تتبع التقدم والمهام الحية**:  
  🔗 [PROGRESS_TRACKER.md](PROGRESS_TRACKER.md)
- **بروفايل ومعلومات عبده الدائمة والواقعية**:  
  🔗 [USER_CONTEXT_PROFILE.md](USER_CONTEXT_PROFILE.md)
- **الجدول الزمني بالدقيقة للبلوكات اليومية**:  
  🔗 [DAILY_CALENDAR_SCHEDULE.md](DAILY_CALENDAR_SCHEDULE.md)

---

> 💡 **قانون الربط الشبكي**: أي ملاحظة أو مفهوم يتم إنشاؤه يتم ربطه تبادلياً بهذا الملف وبسجل الإنجاز والمهارة الموجهة لتبقى خريطة أوبسيديان العصبية (Graph View) مترابطة وواضحة دائماً.
