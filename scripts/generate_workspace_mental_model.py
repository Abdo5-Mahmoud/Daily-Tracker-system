#!/usr/bin/env python3
"""
Workspace Mental Model & Cognitive Pipeline Generator (Obsidian Network Mesh Edition)
Maps workspace files into 4 directed flow pipelines (DAGs) and generates:
1. Obsidian-compatible Markdown with bidirectional links and cross-domain mesh.
2. Interactive HTML with Dual-Mode: Pipeline Cards View + Obsidian-Style Force Graph Physics Canvas.
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

CROSS_DOMAIN_BRIDGES = [
    {
        "name_ar": "جسر التجارة والهندسة البرمجية",
        "desc_ar": "يربط بيانات متجر أمازون بأدوات الاستعلام والتحليل الرياضي السريع.",
        "nodes": [
            {"name": "قاعدة بيانات سوق أمازون", "file": "local-business-store/market-intelligence/amazon_market.db"},
            {"name": "أداة الاستعلام السريع", "file": "local-business-store/scripts/db_quick_query.py"},
            {"name": "كتيب الخوارزميات وهياكل البيانات", "file": "engineering-learning/ALGORITHMS_AND_DATA_STRUCTURES_MASTER_HANDBOOK.md"}
        ]
    },
    {
        "name_ar": "جسر الهندسة والتوظيف",
        "desc_ar": "يربط المشروعات البرمجية الحقيقية بالسير الذاتية وفرص الدخل المباشر.",
        "nodes": [
            {"name": "مشروع ديفوليو المنشور", "file": "engineering-learning/DEVFOLIO_AGENT_SYSTEM_PROMPT.md"},
            {"name": "ملف السير الذاتية الموجهة", "file": "engineering-learning/targeted-cvs/README.md"},
            {"name": "مسار التقديمات الوظيفية", "file": "engineering-learning/JOB_APPLICATIONS_PIPELINE.md"}
        ]
    },
    {
        "name_ar": "جسر الإنجليزية والمقابلات المهنية",
        "desc_ar": "يربط التحدث اليومي بجاهزية المقابلات وبناء السلطة المعرفية على لينكد إن.",
        "nodes": [
            {"name": "سجل إتقان الإنجليزية اليومي", "file": "engineering-learning/ENGLISH_MASTERY_LOG.md"},
            {"name": "خطة تسريع المسار المهني", "file": "engineering-learning/CAREER_ACCELERATION_PLAN.md"},
            {"name": "دليل صناعة المحتوى على لينكد إن", "file": "engineering-learning/career-accelerator/LINKEDIN_CONTENT_PLAYBOOK.md"}
        ]
    },
    {
        "name_ar": "جسر الأتمتة الشاملة والوكلاء",
        "desc_ar": "العمود الفقري الحاكم الذي يراقب ديون المهام ويوجه خطط العمل في مساحة العمل كاملة.",
        "nodes": [
            {"name": "لوحة رصد التقدم ومحاسبة الديون", "file": "PROGRESS_TRACKER.md"},
            {"name": "دستور التوجيهات وقواعد العمل", "file": "AGENTS.md"},
            {"name": "محرك مسار الاعتماديات", "file": "scripts/generate_subagent_dag.js"}
        ]
    }
]

def generate_markdown_compass():
    lines = []
    lines.append("---")
    lines.append("tags:")
    lines.append("  - vault/hub")
    lines.append("  - moc/mental-model")
    lines.append("  - pipeline/all")
    lines.append("---")
    lines.append("")
    lines.append("# خريطة النماذج العقلية والترابط الشبكي لمساحة العمل 🧭🧠")
    lines.append("")
    lines.append("> هذا الملف هو البوصلة العقلية الشاملة وشبكة الترابط المتوافقة مع أوبسيديان لمساحة عمل المهندس عبد الله محمود فوزي.")
    lines.append("> يربط هذا النظام ملفات المشروع كخطوط إنتاج معرفية وشبكة علاقات عنكبوتية متكاملة.")
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

    # Cross Domain Mesh Section
    lines.append("## 🕸️ مصفوفة الترابط الشبكي البيني لأوبسيديان")
    lines.append("```text")
    lines.append("Obsidian Cross-Domain Mesh & Bidirectional Bridges")
    lines.append("```")
    lines.append("")
    
    for bridge in CROSS_DOMAIN_BRIDGES:
        lines.append(f"### {bridge['name_ar']}")
        lines.append(f"{bridge['desc_ar']}")
        for n in bridge["nodes"]:
            full_path = WORKSPACE_ROOT / n["file"]
            lines.append(f"- {n['name']}:")
            lines.append(f"[{n['file']}](file:///{full_path.as_posix()})")
        lines.append("")

    lines.append("---")
    lines.append("")

    output_path = WORKSPACE_ROOT / "WORKSPACE_MENTAL_MODEL.md"
    with open(output_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")
    print(f"[✓] Generated Mental Model Markdown: {output_path}")

def generate_interactive_html():
    # Build Graph Nodes & Edges for Force Graph Simulation
    graph_nodes = []
    graph_edges = []
    
    # Hub Node
    graph_nodes.append({
        "id": "hub_master",
        "label": "Master Knowledge Hub",
        "group": "hub",
        "color": "#eab308",
        "radius": 18,
        "file": "MASTER_KNOWLEDGE_BASE.md"
    })

    # Domain Anchor Nodes
    for pipe in PIPELINES:
        anchor_id = f"domain_{pipe['id']}"
        graph_nodes.append({
            "id": anchor_id,
            "label": pipe["title_ar"],
            "group": pipe["id"],
            "color": pipe["color"],
            "radius": 14,
            "file": pipe["stages"][0]["file"]
        })
        graph_edges.append({"source": "hub_master", "target": anchor_id})

        prev_node = anchor_id
        for st in pipe["stages"]:
            st_id = f"{pipe['id']}_{st['step']}"
            graph_nodes.append({
                "id": st_id,
                "label": f"{st['step']}. {st['name_ar']}",
                "group": pipe["id"],
                "color": pipe["color"],
                "radius": 9,
                "file": st["file"]
            })
            graph_edges.append({"source": prev_node, "target": st_id})
            prev_node = st_id

    # Cross-domain links
    graph_edges.append({"source": "ecommerce_5", "target": "engineering_1"})
    graph_edges.append({"source": "engineering_5", "target": "career_2"})
    graph_edges.append({"source": "career_1", "target": "career_4"})
    graph_edges.append({"source": "orchestration_4", "target": "hub_master"})

    graph_data_json = json.dumps({"nodes": graph_nodes, "edges": graph_edges}, ensure_ascii=False)
    pipelines_json = json.dumps(PIPELINES, ensure_ascii=False, indent=2)

    html_content = f"""<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>بوصلة النماذج العقلية والشبكة التفاعلية | Abdo Engineering Workspace</title>
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
      padding: 2rem 1.5rem;
      background-image: 
        radial-gradient(at 0% 0%, rgba(59, 130, 246, 0.12) 0px, transparent 50%),
        radial-gradient(at 100% 100%, rgba(139, 92, 246, 0.1) 0px, transparent 50%);
    }}
    header {{
      max-width: 1200px;
      margin: 0 auto 2rem auto;
      text-align: center;
    }}
    h1 {{
      font-size: 2.2rem;
      font-weight: 900;
      background: linear-gradient(135deg, #60a5fa, #c084fc, #34d399);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 0.5rem;
    }}
    .subtitle {{
      color: var(--text-muted);
      font-size: 1rem;
      margin-bottom: 1.5rem;
    }}
    .view-switcher {{
      display: inline-flex;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--card-border);
      border-radius: 30px;
      padding: 0.3rem;
      gap: 0.5rem;
      margin-bottom: 2rem;
    }}
    .tab-btn {{
      background: transparent;
      border: none;
      color: var(--text-muted);
      padding: 0.5rem 1.5rem;
      border-radius: 20px;
      font-family: 'Cairo', sans-serif;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s ease;
    }}
    .tab-btn.active {{
      background: var(--primary);
      color: #fff;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.35);
    }}
    .container {{
      max-width: 1240px;
      margin: 0 auto;
    }}
    /* Force Graph Canvas View */
    #graphView {{
      width: 100%;
      height: 700px;
      background: rgba(10, 16, 28, 0.9);
      border: 1px solid var(--card-border);
      border-radius: 16px;
      position: relative;
      overflow: hidden;
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.5);
      display: none;
    }}
    #graphCanvas {{
      width: 100%;
      height: 100%;
      display: block;
      cursor: grab;
    }}
    #graphCanvas:active {{
      cursor: grabbing;
    }}
    .graph-hud {{
      position: absolute;
      top: 1rem;
      right: 1rem;
      background: rgba(18, 26, 43, 0.85);
      border: 1px solid var(--card-border);
      border-radius: 10px;
      padding: 0.75rem 1.25rem;
      font-size: 0.85rem;
      color: var(--text-muted);
      backdrop-filter: blur(8px);
      pointer-events: none;
    }}
    /* Pipeline Cards View */
    #cardsView {{
      display: flex;
      flex-direction: column;
      gap: 2.5rem;
    }}
    .pipeline-card {{
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 16px;
      padding: 2rem;
      backdrop-filter: blur(16px);
      box-shadow: 0 12px 36px rgba(0, 0, 0, 0.4);
    }}
    .pipeline-header {{
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      border-bottom: 1px solid var(--card-border);
      padding-bottom: 1rem;
    }}
    .pipeline-title {{
      font-size: 1.3rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }}
    .pipeline-badge {{
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.8rem;
      padding: 0.3rem 0.6rem;
      border-radius: 20px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--card-border);
    }}
    .flow-grid {{
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1.25rem;
    }}
    .stage-node {{
      background: rgba(10, 16, 28, 0.85);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transition: all 0.25s ease;
    }}
    .stage-node:hover {{
      transform: translateY(-4px);
      border-color: var(--primary);
    }}
    .stage-step {{
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.75rem;
      margin-bottom: 0.4rem;
    }}
    .stage-name {{
      font-weight: 700;
      font-size: 1rem;
      margin-bottom: 0.4rem;
      color: #fff;
    }}
    .stage-desc {{
      font-size: 0.85rem;
      color: var(--text-muted);
      line-height: 1.4;
      margin-bottom: 1rem;
    }}
    .stage-file {{
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.72rem;
      background: rgba(0, 0, 0, 0.4);
      padding: 0.4rem 0.6rem;
      border-radius: 6px;
      color: #38bdf8;
      word-break: break-all;
      text-decoration: none;
      display: inline-block;
      border: 1px solid rgba(56, 189, 248, 0.2);
    }}
    .stage-file:hover {{
      background: rgba(56, 189, 248, 0.15);
      color: #fff;
    }}
  </style>
</head>
<body>
  <header>
    <h1>بوصلة النماذج العقلية والترابط الشبكي 🧭🧠</h1>
    <p class="subtitle">الملاحة البصرية المزدوجة — خطوط الإنتاج المتتابعة أو شبكة العقد الفيزيائية التفاعلية</p>
    <div class="view-switcher">
      <button class="tab-btn active" id="btnCards" onclick="switchView('cards')">عرض خطوط الإنتاج (Cards)</button>
      <button class="tab-btn" id="btnGraph" onclick="switchView('graph')">الشبكة الفيزيائية لأوبسيديان (Force Graph)</button>
    </div>
  </header>

  <div class="container">
    <div id="graphView">
      <canvas id="graphCanvas"></canvas>
      <div class="graph-hud">
        اسحب العقد بالماوس • حرّك الكانفاس للتنقل • متوافق مع شبكة أوبسيديان
      </div>
    </div>
    <div id="cardsView"></div>
  </div>

  <script>
    const data = {pipelines_json};
    const graphData = {graph_data_json};
    const cardsContainer = document.getElementById('cardsView');

    // Render Cards View
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
      cardsContainer.appendChild(card);
    }});

    // Tab Switcher
    function switchView(mode) {{
      const cardsView = document.getElementById('cardsView');
      const graphView = document.getElementById('graphView');
      const btnCards = document.getElementById('btnCards');
      const btnGraph = document.getElementById('btnGraph');

      if (mode === 'graph') {{
        cardsView.style.display = 'none';
        graphView.style.display = 'block';
        btnCards.classList.remove('active');
        btnGraph.classList.add('active');
        initForceGraph();
      }} else {{
        cardsView.style.display = 'flex';
        graphView.style.display = 'none';
        btnCards.classList.add('active');
        btnGraph.classList.remove('active');
      }}
    }}

    // Force-Directed Physics Simulation Canvas
    let animId = null;
    let canvas, ctx;
    let nodes = [], edges = [];
    let draggedNode = null;
    let mouse = {{ x: 0, y: 0, isDown: false }};

    function initForceGraph() {{
      canvas = document.getElementById('graphCanvas');
      ctx = canvas.getContext('2d');
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      // Initialize Node positions in circle
      nodes = graphData.nodes.map((n, i) => {{
        const angle = (i / graphData.nodes.length) * Math.PI * 2;
        const dist = n.group === 'hub' ? 0 : (n.id.startsWith('domain') ? 140 : 250);
        return {{
          ...n,
          x: cx + Math.cos(angle) * dist + (Math.random() - 0.5) * 40,
          y: cy + Math.sin(angle) * dist + (Math.random() - 0.5) * 40,
          vx: 0,
          vy: 0
        }};
      }});

      edges = graphData.edges.map(e => ({{
        sourceNode: nodes.find(n => n.id === e.source),
        targetNode: nodes.find(n => n.id === e.target)
      }})).filter(e => e.sourceNode && e.targetNode);

      // Mouse events
      canvas.onmousedown = (e) => {{
        const pos = getMousePos(e);
        draggedNode = nodes.find(n => Math.hypot(n.x - pos.x, n.y - pos.y) < n.radius + 6);
        mouse.isDown = true;
      }};

      window.onmousemove = (e) => {{
        if (draggedNode) {{
          const pos = getMousePos(e);
          draggedNode.x = pos.x;
          draggedNode.y = pos.y;
          draggedNode.vx = 0;
          draggedNode.vy = 0;
        }}
      }};

      window.onmouseup = () => {{
        draggedNode = null;
        mouse.isDown = false;
      }};

      if (!animId) updatePhysics();
    }}

    function getMousePos(e) {{
      const rect = canvas.getBoundingClientRect();
      return {{ x: e.clientX - rect.left, y: e.clientY - rect.top }};
    }}

    function updatePhysics() {{
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      // 1. Repulsion between all node pairs
      for (let i = 0; i < nodes.length; i++) {{
        for (let j = i + 1; j < nodes.length; j++) {{
          const a = nodes[i];
          const b = nodes[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.hypot(dx, dy) || 1;
          if (dist < 400) {{
            const force = (3500 / (dist * dist));
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;
            a.vx -= fx;
            a.vy -= fy;
            b.vx += fx;
            b.vy += fy;
          }}
        }}
      }}

      // 2. Spring Attraction along Edges
      edges.forEach(e => {{
        const a = e.sourceNode;
        const b = e.targetNode;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.hypot(dx, dy) || 1;
        const targetDist = 90;
        const force = (dist - targetDist) * 0.02;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        a.vx += fx;
        a.vy += fy;
        b.vx -= fx;
        b.vy -= fy;
      }});

      // 3. Center Gravity & Velocity Update
      nodes.forEach(n => {{
        if (n !== draggedNode) {{
          n.vx += (cx - n.x) * 0.003;
          n.vy += (cy - n.y) * 0.003;
          n.x += n.vx;
          n.y += n.vy;
          n.vx *= 0.88; // Damping
          n.vy *= 0.88;
        }}
      }});

      // Draw
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw Edges
      ctx.lineWidth = 1.2;
      edges.forEach(e => {{
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.beginPath();
        ctx.moveTo(e.sourceNode.x, e.sourceNode.y);
        ctx.lineTo(e.targetNode.x, e.targetNode.y);
        ctx.stroke();
      }});

      // Draw Nodes
      nodes.forEach(n => {{
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        ctx.fillStyle = n.color;
        ctx.shadowColor = n.color;
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Label
        ctx.fillStyle = '#f1f5f9';
        ctx.font = '10px Cairo, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(n.label, n.x, n.y + n.radius + 14);
      }});

      animId = requestAnimationFrame(updatePhysics);
    }}
  </script>
</body>
</html>
"""
    output_html = WORKSPACE_ROOT / "WORKSPACE_MENTAL_MODEL.html"
    with open(output_html, "w", encoding="utf-8") as f:
        f.write(html_content)
    print(f"[✓] Generated Interactive HTML with Dual View: {output_html}")

if __name__ == "__main__":
    generate_markdown_compass()
    generate_interactive_html()
