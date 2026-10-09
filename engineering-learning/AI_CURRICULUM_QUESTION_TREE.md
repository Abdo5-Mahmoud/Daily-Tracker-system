# AI Engineering Curriculum - Dialogue & Question Tree

> شجرة تفاعلية ترصد كل سؤال ونقاش وحسم معماري في رحلة تعلم هندسة الذكاء الاصطناعي.
> متصلة بامتداد ميرو الرسمي لإنتاج المخططات الهندسية مباشرة على لوحات العمل.

---

## 1. Visual Question Graph (Mermaid)

```mermaid
flowchart TD
    Root["Modern AI Engineering Curriculum"]

    %% Question 1 Branch
    Root --> Q1["Question 1: MCP Core Architecture & Transport"]
    Q1 --> Q1_Doubt["Abdo's Doubt & Friction:
    - What is the difference between Agent and MCP Client?
    - How does Host discover servers?
    - stdio vs SSE transport?"]
    Q1_Doubt --> Q1_Analysis["Blue's Architecture Breakdown:
    - Agent = LLM Brain
    - MCP Client = Host Runtime (IDE)
    - MCP Server = Tool Execution Process
    - Config = Service Discovery Registry"]
    Q1_Analysis --> Q1_Resolution["Abdo's Consensus:
    - Fully understood & validated mental model"]
    Q1_Resolution --> Q1_Handbook["Handbook Logged:
    - Section 1: Model Context Protocol
    - Status: Completed & Pushed to GitHub"]

    %% Question 2 Branch
    Root --> Q2["Question 2: Production Agent Harness & Anti-Hallucination"]
    Q2 --> Q2_Doubt["Abdo's Deep Question:
    - Harness runs on Host/MCP Client, not inside LLM?
    - How to prevent amnesia and hallucinations without prompt loops?"]
    Q2_Doubt --> Q2_Analysis["Blue's 5-Pillar Production Architecture:
    1. External State Machine (Append-only DAG)
    2. Tool Output Truncation & Summarization
    3. Zod Schema Interception (Type Safety)
    4. Terminal Verification Gate (Evidence-based)
    5. Circuit Breaker (15-20 min hard cap)"]
    Q2_Analysis --> Q2_Pending["Current Status:
    - Under Discussion & Active Review
    - Awaiting Abdo's confirmation before handbook integration"]

    %% Styling
    classDef rootStyle fill:#2d3748,stroke:#cbd5e0,stroke-width:2px,color:#fff;
    classDef resolvedStyle fill:#1c4532,stroke:#38a169,stroke-width:2px,color:#fff;
    classDef pendingStyle fill:#744210,stroke:#d69e2e,stroke-width:2px,color:#fff;
    classDef nodeStyle fill:#1a202c,stroke:#4a5568,stroke-width:1px,color:#e2e8f0;

    class Root rootStyle;
    class Q1,Q1_Doubt,Q1_Analysis,Q2,Q2_Doubt,Q2_Analysis nodeStyle;
    class Q1_Resolution,Q1_Handbook resolvedStyle;
    class Q2_Pending pendingStyle;
```

---

## 2. Dialogue Log & Progression Table

| المعرف | السؤال والنقطة المحورية | فرع النقاش والتشكيك | النتيجة والحسم | حالة التوثيق |
| :--- | :--- | :--- | :--- | :--- |
| **Q1** | MCP Architecture & Transports | التفريق الدقيق بين الوكيل والمضيف والسيرفر | تثبيت النموذج الذهني والتمييز بين النقل المحلي والشبكي | موثق في الكتيب الرئيسي |
| **Q2** | Host Agent Harness & Hallucination | كيفية بناء هارنيس صلب على المضيف يمنع التوهان | ركائز الهارنيس الخمس مع حواجز الأمان وفحص المخرجات | قيد المراجعة والنقاش |

---

## 3. Miro AI Extension & MCP Bridge (الربط المباشر مع ميرو)

تم تفعيل وتثبيت حزمة ميرو الرسمية للذكاء الاصطناعي:
`miroapp/miro-ai`

مسارات التثبيت والربط المفعلة في بيئة العمل:

1. مسار الامتداد الرسمي:
`C:\Users\A5\.gemini\extensions\miro\`

2. مسار الإضافة العامة:
`C:\Users\A5\.gemini\config\plugins\miro\`

3. مهارات مساحة العمل المفعلة:
`.agents/skills/miro-code-explain-on-board/`
`.agents/skills/miro-code-review/`
`.agents/skills/miro-code-spec/`

4. عنوان الخادم لبروتوكول السياق:
```text
https://mcp.miro.com/
```

---

## 4. How to Sync Tree to Miro Board (طريقة المزامنة على اللوحة)

### الخيار الأول: المزامنة المباشرة بالرابط

عند تزويد الوكيل برابط اللوحة الخاصة بك في ميرو:
```text
https://miro.com/app/board/<board_id>/
```
يقوم الوكيل بقراءة اللوحة وتوليد عناصر المخطط وتحديث الشجرة مباشرة عبر أداة:
`miro-code-explain-on-board`

### الخيار الثاني: الاستيراد الفوري عبر ميرميد

1. افتح أي لوحة عمل في منصة:
Miro
2. من شريط الأدوات الجانبي، اختر تطبيق:
Mermaid
3. انسخ كود الـ
Mermaid
الموجود في القسم الأول بالكامل وضعه في التطبيق داخل ميرو.
4. سيتم رسم الشجرة التفاعلية فوراً وتستطيع ترتيب العقد والبطاقات بحرية كاملة.
