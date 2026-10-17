# مركز أدوات وسكريبتات مساحة العمل (Workspace Tools & MCP Hub) 🛠️⚡

> **المسار الأساسي**: `scripts/`
> **خادم البروتوكول (MCP Server)**: `scripts/workspace_mcp_server.py`
> **حالة الربط**: مسجل ونشط في `~/.gemini/config/mcp_config.json` باسم `workspace-tools`

---

## 1. خادم أدوات الـ MCP الموحد (`workspace-tools`)

تم تجميع وبرمجة خادم بروتوكول موحد (`JSON-RPC 2.0` عبر `stdio`) بدون أي مكتبات خارجية ثقيلة، ليتيح للوكيل الذكي استدعاء أدوات مساحة العمل مباشرة:

| اسم الأداة (MCP Tool) | الوظيفة الهندسية والتجارية |
| :--- | :--- |
| `market_summary` | استخراج تقرير ملخص فوري لأسعار وفئات أمازون مصر من قاعدة `amazon_market.db`. |
| `market_sponsored_radar` | رصد الإعلانات الممولة النشطة للمنافسين ومراتب ظهورهم وأسعارهم الحالية. |
| `market_sql_query` | تنفيذ استعلامات قراءة آمنة (`SELECT`) على قاعدة البيانات لتحليل متقدم. |
| `unit_economics_calculator` | حساب اقتصاديات الوحدة وهوامش الربح الصافية وعمولات أمازون مصر (`FBA` مقابل `Easy Ship`). |
| `audit_language_formatting` | فحص صارم للملفات للتأكد من عدم اختلاط العربي والإنجليزي في سطر واحد (قاعدة 100%). |
| `audit_image_compliance` | تدقيق مواصفات صور المنتجات لأمازون (أبعاد 1000+ بكسل، مربعة 1:1، صيغة اللون). |

### تشغيل واختبار الخادم:
```bash
# تشغيل حزمة الاختبارات الآلية الشاملة
python scripts/test_workspace_mcp.py
```

---

## 2. الهيكل التنظيمي للأدوات (`scripts/`)

```text
scripts/
├── workspace_mcp_server.py      # خادم الـ MCP الأساسي للورك سبيس
├── test_workspace_mcp.py        # هارفست الاختبارات الآلية للـ MCP
├── marketing_calculator.py      # حاسبة تسعير التجارة الإلكترونية واقتصاديات الوحدة
├── generate_campaign_pack.py    # توليد حزم الحملات الإعلانية ومحتوى السوشيال ميديا
├── generate_workspace_mental_model.py # توليد الخريطة العقلية للورك سبيس
├── generate_subagent_dag.js     # رسم مخططات تدفق الوكلاء الفرعيين (Mermaid DAG)
├── audit_text_formatting.js     # سكريبت تدقيق نقاء لغة السطور
├── audit_image_quality.ps1      # تدقيق جودة صور المنتجات
├── optimize_hero_image.ps1      # ضغط وتحسين الصور البصرية
├── manage_task_lifecycle.ps1    # إدارة دورة حياة المهام
├── test_mcp_connectivity.ps1   # فحص اتصال نهايات الـ MCP
├── update-superpowers.ps1       # تحديث مستودع السوبر باورز
│
├── amazon-tracker/              # حزمة رادار واستخبارات أمازون مصر
│   ├── index.js                 # محرك الزحف اليومي المجدول
│   ├── ad_radar.js              # رصد الإعلانات الممولة
│   ├── analyzer.js              # تحليل لقطات الأسعار
│   ├── db.js                    # التعامل مع قاعدة بيانات SQLite
│   ├── db_quick_query.py        # واجهة الاستعلام السريع من سطر الأوامر
│   ├── amazon_competitor_analyzer.py # سكرابر وتحليل أسعار المنافسين
│   └── reporter.js              # توليد التقارير اليومية
│
└── image-processing/            # حزمة معالجة وتفريغ صور المنتجات
    ├── remove_background.py     # تفريغ خلفيات المنتجات وتركيب الخلفية البيضاء النقية
    └── requirements.txt         # متطلبات بيئة الذكاء الاصطناعي لمعالجة الصور
```

---

## 3. أمثلة الاستخدام السريع من سطر الأوامر (CLI Examples)

### استعلام سريع عن أسعار السوق والإعلانات:
```bash
python scripts/amazon-tracker/db_quick_query.py --summary
python scripts/amazon-tracker/db_quick_query.py --sponsored
```

### فحص نقاء التنسيق اللغوي لملف:
```bash
node scripts/audit_text_formatting.js "AGENTS.md"
```

### اختبار محاكي تفريغ خلفية الصور:
```bash
python scripts/image-processing/remove_background.py --test
```
