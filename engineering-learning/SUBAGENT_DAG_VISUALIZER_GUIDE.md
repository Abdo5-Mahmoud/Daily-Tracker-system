# Subagent Task DAG Visualizer & Observability Guide 🧭⚡

> نظرة عامة ودليل مرجعي لتتبع ومراقبة الوكلاء الفرعيين وتحويل المهام والتبعيات إلى رسم بياني مرئي.

---

## 1. System Overview & Architecture

عند تشغيل مهام متعددة للوكلاء، يتم تمثيل المهام كمخطط توجيهي غير دائري:
```text
Directed Acyclic Graph (DAG)
```
حالات المهام المعتمدة:
```text
[RUNNING] -> الوكيل يعمل حالياً ويستهلك وقت وموارد
[BLOCKED] -> المهمة محجوبة وتنتظر مخرجات مهمة سابقة
[AWAITING_REVIEW] -> الكود تم توليده وينتظر تدقيق المراجع
[COMPLETED] -> المهمة انتهت بنجاح واجتازت بوابة التحقق
[FAILED] -> المهمة فشلت ويتم إعادة تدويرها أو إيقاف السلسلة
```

---

## 2. Running the Visualizer Engine

لتوليد جدول المراقبة والرسم البياني الحي في أي وقت:

```bash
node scripts/generate_subagent_dag.js
```

### Live Terminal Observability Output:
```text
================================================================================
             SUBAGENT TASK DAG & REAL-TIME OBSERVABILITY MONITOR                
================================================================================
ID       | STATUS     | AGENT                      | ELAPSED | TOKENS  | BLOCKED BY
---------|------------|----------------------------|---------|---------|-----------
TASK-01  | [COMPLETED] | Backend Scraper Subagent   | 14s     | 3200    | None
TASK-02  | [RUNNING]  | Data Parser Subagent       | 8s      | 1850    | TASK-01
TASK-03  | [BLOCKED]  | Nemotron Audit Subagent    | 0s      | 0       | TASK-02
TASK-04  | [BLOCKED]  | Creative AI Subagent       | 0s      | 0       | TASK-03
================================================================================
```

---

## 3. Miro Board Synchronization

يقوم المحرك بتوليد كود ملون الحالات:
- الأخضر للمهام المكتملة.
- الأزرق للمهام الجارية.
- البرتقالي للمهام المحجوبة.
- البنفسجي للمهام التي تنتظر المراجعة.

يمكن نسخ الكود ووضعه في التطبيق داخل لوحة ميرو:
https://miro.com/app/board/uXjVEe8VGfc=/

---

## 4. Open-Source Ecosystem for Agent Observability

قائمة بأبرز الأدوات مفتوحة المصدر في جيت هاب:

### Langfuse
```text
Repository: langfuse/langfuse
Usage: منصة تتبع ومراقبة كاملة للوكلاء والتوكنز وأشجار الاستدعاء
License: Self-Hosted / Open Source
```

### LangGraphics
```text
Repository: langgraphics/visualizer
Usage: جراف تفاعلي متحرك لمسارات تشغيل الوكلاء
License: 100% Free
```

### ATSMATRIX
```text
Repository: atsmatrix/agent-visualizer
Usage: رسم بياني عالي السرعة متعدد الوكلاء بحركات فيزيائية
License: Open Source
```

### Miro MCP
```text
Repository: miroapp/miro-ai
Usage: مزامنة مباشرة للمخططات على لوحات ميرو
License: 100% Free
```
