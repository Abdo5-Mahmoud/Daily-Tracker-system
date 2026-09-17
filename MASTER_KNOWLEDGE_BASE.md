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

### المفاهيم التي أتقنتها وطبقتها عملياً بالكود:

#### أ. هندسة الخوادم والسيرفرليس (Serverless & Backend Nuances)
- **Mongoose Cache Poisoning**:
  - *المشكلة*: إعادة بناء اتصال قاعدة البيانات في كل ريكويست في بيئة السيرفرليس مما يؤدي لنفاد الاتصالات وتسمم الذاكرة.
  - *الحل*: حفظ وعد الاتصال `cached.promise` في النطاق العام للعملية `globalThis`.
  - *الملف*: `devfolio/lib/mongodb.ts`
- **Serverless Container Freeze & `after()`**:
  - *المشكلة*: الدوال غير المتزامنة التي تعمل بدون `await` تتجمد عند إرسال الرد للمستخدم في السيرفرليس.
  - *الحل*: استخدام دالة `after()` في Next.js 15/16 لتنفيذ المهام الخلفية (مثل إشعارات تيليجرام) دون تأخير الرد للعميل.
  - *الملف*: `devfolio/lib/telegram.ts`
- **In-Memory Rate Limiting & Memory Cleanup**:
  - *المشكلة*: استهلاك موارد السيرفر وهجمات إغراق الطلبات وتضخم الذاكرة `Memory Leak` بمرور الوقت.
  - *الحل*: بناء محدد طلبات بخوارزمية النافذة المنزلقة مع دالة تنظيف دورية للسجلات القديمة `cleanupStaleRecords` وحفظ الحالة في `globalThis`.
  - *الملف*: `devfolio/lib/rate-limiter.ts`
- **Honeypot Bot Trap**:
  - *المشكلة*: السبام والبوتات التي تملأ فورم التواصل.
  - *الحل*: حقل مخفي للمستخدم يملأه البوت تلقائياً فيتم إسقاط الطلب بصمت بدون تكلفة `CAPTCHA`.
  - *الملف*: `devfolio/features/contact/`

#### ب. مبادئ التصميم وأنماط البرمجيات (SOLID & Design Patterns)
- **Single Responsibility Principle (SRP)**:
  - *المفهوم*: فصل المسؤوليات إلى 4 طبقات نقية:
    `Controller -> Service -> Repository -> Validator`
  - *ملف الحل*: [solution-2026-09-10-srp-user-service.ts](file:///c:/Users/A5/Desktop/growth-workspace-withAI/engineering-learning/daily-challenges/solutions/solution-2026-09-10-srp-user-service.ts)
  - *ملف الكويز*: [quiz-2026-09-10-srp-user-service.md](file:///c:/Users/A5/Desktop/growth-workspace-withAI/engineering-learning/daily-challenges/grilling-quizzes/quiz-2026-09-10-srp-user-service.md)
- **Open/Closed Principle (OCP)**:
  - *المفهوم*: فتح الكود للإضافة وإغلاقه أمام التعديل. التخلص من `switch-case` المعقدة باستخدام نمط السجل والاستراتيجية `Strategy & Registry Pattern`.
  - *ملف الحل*: [solution-2026-09-11-ocp-payment-gateway.ts](file:///c:/Users/A5/Desktop/growth-workspace-withAI/engineering-learning/daily-challenges/solutions/solution-2026-09-11-ocp-payment-gateway.ts)
  - *ملف الكويز*: [quiz-2026-09-11-ocp-payment-gateway.md](file:///c:/Users/A5/Desktop/growth-workspace-withAI/engineering-learning/daily-challenges/grilling-quizzes/quiz-2026-09-11-ocp-payment-gateway.md)
- **Strategy & Gateway Pattern في المساعد الذكي**:
  - *المفهوم*: عزل مزودي الذكاء الاصطناعي (Gemini / Groq / Mock) عبر واجهة موحدة `LLMProviderStrategy` وبوابة اتصالات معزولة `GeminiClient` مع معالجة أخطاء المجال `LLMError`.
  - *الملف*: `devfolio/features/ai-workflow/lib/llm.ts`

---

## 2. 🧪 الاختبارات وجودة الكود (Testing & Quality)

- **أجنحة اختبارات ديفوليو (5 Test Suites / 38 Tests Passing 100%)**:
  - `__tests__/smoke.test.ts`: اختبار تشغيل واستجابة المسارات الأساسية.
  - `__tests__/auth.test.ts`: اختبار أمان الجلسات وحماية الكوكيز.
  - `__tests__/api-boundaries.test.ts`: اختبار حدود واجهات البرمجة والتحقق من المدخلات.
  - `__tests__/ai-assistant.test.ts`: اختبار المزود الوهمي ومحدد الطلبات الحسابي بدقة 100%.
  - `__tests__/projects-validation.test.ts`: اختبار سلامة بيانات المشاريع ومخطط Zod.
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
  (برومبت صلب يجبر الإيجنت على نبرة المنتور الصارم، منع التطبيل، عدم كسر الاختبارات الـ 38، ورادار المفاهيم المعمارية).
- **دستور المنتور الهندسي الشامل**:  
  🔗 [MASTER_ENGINEERING_MENTOR_SYSTEM_PROMPT.md](file:///c:/Users/A5/Desktop/growth-workspace-withAI/MASTER_ENGINEERING_MENTOR_SYSTEM_PROMPT.md)

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
- **الجدول الزمني الصارم لليوم**:  
  🔗 [DAILY_CALENDAR_SCHEDULE.md](file:///c:/Users/A5/Desktop/growth-workspace-withAI/DAILY_CALENDAR_SCHEDULE.md)

---

> 💡 **نصيحة ذهبية**: أي مفهوم جديد تتعلمه أو تحدي تخلصه، هنربطه فوراً بهذا الملف، ليكون بوصلتك الهندسية الدائمة طوال رحلتك.
