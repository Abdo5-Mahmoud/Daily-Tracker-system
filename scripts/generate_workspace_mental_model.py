#!/usr/bin/env python3
"""
Workspace Mental Model & Cognitive Pipeline Generator
Maps workspace files into 4 directed flow pipelines (DAGs):
1. E-Commerce & Retail Growth (Flora_Home / Amazon Egypt)
2. Fullstack Engineering & Math Foundations
3. Career Acceleration & Outbound Pipeline
4. Autonomous Multi-Agent Orchestration Engine
"""

import os
import sys
import json
from pathlib import Path

# Ensure UTF-8 output on Windows
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

WORKSPACE_ROOT = Path(__file__).resolve().parent.parent

PIPELINES = [
    {
        "id": "ecommerce",
        "title_ar": "خط إنتاج تجارة الديكور وأمازون مصر",
        "title_en": "E-Commerce & Retail Growth Pipeline (Flora_Home)",
        "color": "#10b981",
        "stages": [
            {
                "step": 1,
                "name_ar": "التوريد ومصانع الكراتين والتغليف",
                "name_en": "Sourcing & Packaging Supply Chain",
                "file": "local-business-store/packaging-and-suppliers/EGYPT_PACKAGING_CARTON_SUPPLIERS_GUIDE.md",
                "desc_ar": "أسعار ومقاسات الكراتين الجاهزة ومصانع شارع الجيش وبدائل الإسطمبات المخصصة."
            },
            {
                "step": 2,
                "name_ar": "اقتصاديات الوحدة وحساب الهامش الصافي",
                "name_en": "Unit Economics & Margin Calculation",
                "file": "local-business-store/amazon-operations/AMAZON_MARKET_AUDIT_FLOWER_VASES.md",
                "desc_ar": "معادلة عمولة أمازون وشحن إيزي شيب وحاجز الـ 199 جنيهاً لمنع خسارة رأس المال."
            },
            {
                "step": 3,
                "name_ar": "تجهيز الإدراج والكلمات المفتاحية",
                "name_en": "Amazon Egypt Listing & SEO Blueprint",
                "file": "local-business-store/amazon-operations/AMAZON_EGYPT_LISTING_BLUEPRINT_PLANT_30CM.md",
                "desc_ar": "العنوان المعتمد والنقاط المميزة والكلمات المفتاحية الخلفية لمنتج الـ 30 سم."
            },
            {
                "step": 4,
                "name_ar": "الإعلانات الممولة والاستهداف الدقيق",
                "name_en": "Sponsored Products PPC Launch Spec",
                "file": "local-business-store/amazon-operations/AMAZON_PPC_LAUNCH_CAMPAIGN_SPEC.md",
                "desc_ar": "حملة الـ 50 جنيهاً اليومية والمزايدة الدقيقة لخطف المركز الأول في نتائج البحث."
            },
            {
                "step": 5,
                "name_ar": "رادار الاستخبارات وقاعدة بيانات المنافسين",
                "name_en": "Live Market Intelligence Database",
                "file": "local-business-store/market-intelligence/SPONSORED_ADS_COMPETITOR_RADAR.md",
                "desc_ar": "مراقبة أكثر من ألفي لقطة للمنافسين ورصد تغيرات الأسعار وغياب الإعلانات."
            }
        ]
    },
    {
        "id": "engineering",
        "title_ar": "خط إنتاج التعلم الهندسي والتطوير الشامل",
        "title_en": "Fullstack Engineering & Math Foundations Pipeline",
        "color": "#3b82f6",
        "stages": [
            {
                "step": 1,
                "name_ar": "أسس الرياضيات والخوارزميات وهياكل البيانات",
                "name_en": "Math Foundations & Algorithms Handbook",
                "file": "engineering-learning/ALGORITHMS_AND_DATA_STRUCTURES_MASTER_HANDBOOK.md",
                "desc_ar": "التحليل الرياضي للتعقيد الحسابي والكاش السريع والمطابقة النصية."
            },
            {
                "step": 2,
                "name_ar": "مبادئ التصميم النظيف وفصل المسؤوليات",
                "name_en": "SOLID Principles Master Handbook",
                "file": "engineering-learning/SOLID_PRINCIPLES_MASTER_HANDBOOK.md",
                "desc_ar": "عزل طبقات النظم وحقن الاعتماديات وفصل واجهات الاستخدام."
            },
            {
                "step": 3,
                "name_ar": "أنماط التصميم المعمارية المعتمدة",
                "name_en": "Design Patterns Master Handbook",
                "file": "engineering-learning/DESIGN_PATTERNS_MASTER_HANDBOOK.md",
                "desc_ar": "الأنماط الإنشائية والهيكلية والسلوكية للإنتاج الحقيقي."
            },
            {
                "step": 4,
                "name_ar": "تصميم النظم الموزعة والتوسع الأفقي",
                "name_en": "System Design Master Handbook",
                "file": "engineering-learning/SYSTEM_DESIGN_MASTER_HANDBOOK.md",
                "desc_ar": "التخزين المؤقت وتحديد معدل الطلبات والأقفال على مستوى الصفوف."
            },
            {
                "step": 5,
                "name_ar": "المشروع التطبيقي الحقيقي في الإنتاج",
                "name_en": "Production Flagship: DevFolio AI",
                "file": "engineering-learning/DEVFOLIO_AGENT_SYSTEM_PROMPT.md",
                "desc_ar": "مشروع حي منشور على السحابة يطبق كامل المعايير البرمجية مع اختبارات مؤكدة."
            }
        ]
    },
    {
        "id": "career",
        "title_ar": "خط إنتاج التوظيف واقتناص الدخل الهندسي",
        "title_en": "Career Acceleration & Job Hunting Pipeline",
        "color": "#f59e0b",
        "stages": [
            {
                "step": 1,
                "name_ar": "إتقان الإنجليزية الهندسية والترقي اللغوي",
                "name_en": "Professional English Mastery Log",
                "file": "engineering-learning/ENGLISH_MASTERY_LOG.md",
                "desc_ar": "ترقية الصياغة اليومية لنبرة المهندس الأول والتحضير للمقابلات العالمية."
            },
            {
                "step": 2,
                "name_ar": "صناعة السير الذاتية الموجهة للشركات",
                "name_en": "Targeted ATS Resumes Dossier",
                "file": "engineering-learning/targeted-cvs/README.md",
                "desc_ar": "صياغة مؤشرات الإنجاز الرقمية لتجاوز أنظمة الفرز الآلي بنجاح."
            },
            {
                "step": 3,
                "name_ar": "بناء السلطة المعرفية على لينكد إن",
                "name_en": "LinkedIn Authority & Content Playbook",
                "file": "engineering-learning/career-accelerator/LINKEDIN_CONTENT_PLAYBOOK.md",
                "desc_ar": "صناعة محتوى تقني جذاب يعكس العمق الرياضي والهندسي الحقيقي."
            },
            {
                "step": 4,
                "name_ar": "مسار التقدم الوظيفي وقنص الفرص",
                "name_en": "Active Job Application Pipeline",
                "file": "engineering-learning/JOB_APPLICATIONS_PIPELINE.md",
                "desc_ar": "تتبع خطابات التقديم ومراحل المقابلات التقنية وردود مسؤولي التوظيف."
            }
        ]
    },
    {
        "id": "orchestration",
        "title_ar": "خط إنتاج الأتمتة والوكلاء الأذكياء",
        "title_en": "Autonomous Multi-Agent Orchestration Pipeline",
        "color": "#8b5cf6",
        "stages": [
            {
                "step": 1,
                "name_ar": "دستور مساحة العمل وتوجيهات الوكلاء",
                "name_en": "Workspace Directives & Orchestration Rules",
                "file": "AGENTS.md",
                "desc_ar": "قواعد التنسيق الصارمة ونبرة الكلام وتوزيع المهام بين الوكلاء."
            },
            {
                "step": 2,
                "name_ar": "منظومة القدرات الفائقة ومهارات الدومين",
                "name_en": "Superpowers Framework & Domain Skills",
                "file": ".agents/skills/abdo-personal-mentor/SKILL.md",
                "desc_ar": "المهارات المتخصصة لتوجيه المذاكرة وهندسة التجارة والتحليل الميداني."
            },
            {
                "step": 3,
                "name_ar": "محرك مسار الاعتماديات الموجّه للوكلاء",
                "name_en": "Subagent DAG Dependency Generator",
                "file": "scripts/generate_subagent_dag.js",
                "desc_ar": "أداة توليد المخططات الانسيابية لمهام الوكلاء المتوازية وتتبع الاستهلاك."
            },
            {
                "step": 4,
                "name_ar": "لوحة رصد التقدم ومحاسبة ديون المهام",
                "name_en": "Progress Tracker & Task Debt Ledger",
                "file": "PROGRESS_TRACKER.md",
                "desc_ar": "تتبع الإنجاز اليومي وتدوير المهام غير المكتملة دون أن تضيع."
            }
        ]
    }
]

def generate_markdown_compass():
    lines = []
    lines.append("# خريطة النماذج العقلية لمساحة العمل 🧭🧠")
    lines.append("")
    lines.append("> هذا الملف هو البوصلة العقلية الشاملة لمساحة عمل المهندس عبد الله محمود فوزي.")
    lines.append("> يعرض هذا النظام ملفات المشروع كخطوط إنتاج معرفية مترابطة وفق نموذج المسار الموجّه الخالي من الحلقات.")
    lines.append("")
    lines.append("---")
    lines.append("")

    for pipe in PIPELINES:
        lines.append(f"## 🚀 {pipe['title_ar']}")
        lines.append(f"```text")
        lines.append(f"{pipe['title_en']}")
        lines.append(f"```")
        lines.append("")
        
        # Mermaid Flowchart
        lines.append("```mermaid")
        lines.append("flowchart LR")
        for i, stage in enumerate(pipe["stages"]):
            node_id = f"{pipe['id']}_{stage['step']}"
            label = f"\"{stage['step']}. {stage['name_ar']}\""
            lines.append(f"    {node_id}[{label}]")
            if i > 0:
                prev_id = f"{pipe['id']}_{pipe['stages'][i-1]['step']}"
                lines.append(f"    {prev_id} --> {node_id}")
        lines.append("```")
        lines.append("")

        # Detailed Stages Breakdown with strict line purity
        for stage in pipe["stages"]:
            full_path = WORKSPACE_ROOT / stage["file"]
            exists_badge = "الحالة: متوفر ونشط على القرص" if full_path.exists() else "الحالة: قيد التجهيز"
            lines.append(f"### {stage['step']}. {stage['name_ar']}")
            lines.append(f"{stage['desc_ar']}")
            lines.append(f"{exists_badge}")
            lines.append(f"- مسار الملف:")
            lines.append(f"[{stage['file']}](file:///{full_path.as_posix()})")
            lines.append("")
        lines.append("---")
        lines.append("")

    output_path = WORKSPACE_ROOT / "WORKSPACE_MENTAL_MODEL.md"
    with open(output_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")
    print(f"[✓] Generated Mental Model Markdown: {output_path}")

def generate_interactive_html():
    pipelines_json = json.dumps(PIPELINES, ensure_ascii=False, indent=2)
    html_content = f"""<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>بوصلة النماذج العقلية لمساحة العمل | Abdo Engineering Workspace</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
  <style>
    :root {{
      --bg: #090d16;
      --card-bg: rgba(18, 26, 43, 0.75);
      --card-border: rgba(255, 255, 255, 0.08);
      --text: #f1f5f9;
      --text-muted: #94a3b8;
      --primary: #3b82f6;
      --success: #10b981;
      --amber: #f59e0b;
      --purple: #8b5cf6;
    }}
    * {{
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }}
    body {{
      background: var(--bg);
      color: var(--text);
      font-family: 'Cairo', sans-serif;
      min-height: 100vh;
      padding: 2.5rem 1.5rem;
      background-image: 
        radial-gradient(at 0% 0%, rgba(59, 130, 246, 0.12) 0px, transparent 50%),
        radial-gradient(at 100% 100%, rgba(139, 92, 246, 0.1) 0px, transparent 50%);
    }}
    header {{
      max-width: 1200px;
      margin: 0 auto 3rem auto;
      text-align: center;
    }}
    h1 {{
      font-size: 2.4rem;
      font-weight: 900;
      letter-spacing: -0.5px;
      background: linear-gradient(135deg, #60a5fa, #c084fc, #34d399);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 0.75rem;
    }}
    .subtitle {{
      color: var(--text-muted);
      font-size: 1.1rem;
      max-width: 700px;
      margin: 0 auto;
    }}
    .container {{
      max-width: 1240px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 3rem;
    }}
    .pipeline-card {{
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 16px;
      padding: 2rem;
      backdrop-filter: blur(16px);
      box-shadow: 0 12px 36px rgba(0, 0, 0, 0.4);
      transition: transform 0.2s ease, border-color 0.2s ease;
    }}
    .pipeline-card:hover {{
      border-color: rgba(255, 255, 255, 0.18);
    }}
    .pipeline-header {{
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.75rem;
      border-bottom: 1px solid var(--card-border);
      padding-bottom: 1rem;
    }}
    .pipeline-title {{
      font-size: 1.4rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }}
    .pipeline-badge {{
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.85rem;
      padding: 0.35rem 0.75rem;
      border-radius: 20px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--card-border);
    }}
    .flow-grid {{
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1.25rem;
      position: relative;
    }}
    .stage-node {{
      background: rgba(10, 16, 28, 0.85);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
      transition: all 0.25s ease;
    }}
    .stage-node:hover {{
      transform: translateY(-4px);
      border-color: var(--primary);
      box-shadow: 0 8px 24px rgba(59, 130, 246, 0.2);
    }}
    .stage-step {{
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.8rem;
      color: var(--text-muted);
      margin-bottom: 0.5rem;
    }}
    .stage-name {{
      font-weight: 700;
      font-size: 1.05rem;
      margin-bottom: 0.5rem;
      color: #fff;
    }}
    .stage-desc {{
      font-size: 0.88rem;
      color: var(--text-muted);
      line-height: 1.5;
      margin-bottom: 1rem;
    }}
    .stage-file {{
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.75rem;
      background: rgba(0, 0, 0, 0.4);
      padding: 0.4rem 0.6rem;
      border-radius: 6px;
      color: #38bdf8;
      word-break: break-all;
      text-decoration: none;
      display: inline-block;
      border: 1px solid rgba(56, 189, 248, 0.2);
      transition: background 0.2s ease;
    }}
    .stage-file:hover {{
      background: rgba(56, 189, 248, 0.15);
      color: #fff;
    }}
  </style>
</head>
<body>
  <header>
    <h1>بوصلة النماذج العقلية لمساحة العمل 🧭🧠</h1>
    <p class="subtitle">خريطة التدفق المعرفي لخطوط الإنتاج الأربعة — كل ملف محطة محددة في رحلة الإنجاز</p>
  </header>

  <div class="container" id="app"></div>

  <script>
    const data = {pipelines_json};
    const app = document.getElementById('app');

    data.forEach(pipe => {{
      const card = document.createElement('div');
      card.className = 'pipeline-card';
      
      let nodesHtml = '';
      pipe.stages.forEach(st => {{
        nodesHtml += `
          <div class="stage-node">
            <div>
              <div class="stage-step" style="color: ${{pipe.color}};">STAGE 0${{st.step}}</div>
              <div class="stage-name">${{st.name_ar}}</div>
              <div class="stage-desc">${{st.desc_ar}}</div>
            </div>
            <a class="stage-file" href="${{st.file}}" title="فتح الملف">${{st.file}}</a>
          </div>
        `;
      }});

      card.innerHTML = `
        <div class="pipeline-header">
          <div class="pipeline-title" style="color: ${{pipe.color}};">
            <span>●</span> ${{pipe.title_ar}}
          </div>
          <div class="pipeline-badge" style="color: ${{pipe.color}};">${{pipe.title_en}}</div>
        </div>
        <div class="flow-grid">${{nodesHtml}}</div>
      `;
      app.appendChild(card);
    }});
  </script>
</body>
</html>
"""
    output_html = WORKSPACE_ROOT / "WORKSPACE_MENTAL_MODEL.html"
    with open(output_html, "w", encoding="utf-8") as f:
        f.write(html_content)
    print(f"[✓] Generated Interactive HTML: {output_html}")

if __name__ == "__main__":
    generate_markdown_compass()
    generate_interactive_html()
