#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Campaign Pack Generator
Generates full marketing pack: Egyptian Arabic Reels copy, Veo Video Prompts,
ASMR audio direction, Amazon Egypt listing blueprint, and placement taxonomy.
Tailored for Artiflora / CasaArt Decor (El-Warraq, Giza).
"""

import os
import sys
import argparse
from marketing_calculator import calculate_store_economics, calculate_social_cod_economics, calculate_amazon_economics

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass


def get_placement_guide(category: str) -> dict:
    cat_lower = category.lower()
    if "كريستال" in cat_lower or "تحف" in cat_lower or "crystal" in cat_lower:
        return {
            "type": "تحف وكريستالات صغيرة (15 - 25 سم)",
            "zone": "خانات شاشة التلفزيون، الأرفف الجدارية المعلقة، أو مكتبة الكتب",
            "caution": "ممنوع وضعها في منتصف ترابيزة صالون عريضة لأنها مكان ملطش معرض للحركة والخبط وأكواب الشاي."
        }
    elif "مزارع" in cat_lower or "نبات" in cat_lower or "plant" in cat_lower:
        return {
            "type": "مزارع ونباتات ديكورية خضراء (15 - 22 سم)",
            "zone": "أرفف الكتب، خانات التلفزيون، طاولات القهوة الجانبية، أو رف الحمام الرخامي",
            "caution": "خامة البلاستيك بكسر الرخام ضد الكسر ومثالية للمنازل ذات الحركة اليومية والأطفال."
        }
    elif "بوكيه" in cat_lower or "ورد" in cat_lower or "bouq" in cat_lower:
        return {
            "type": "بوكيهات طاولات كبيرة وفاخرة (25 - 35 سم)",
            "zone": "منتصف ترابيزة صالون الاستقبال، منتصف ترابيزة السفرة، أو كونسول المدخل",
            "caution": "تعمل كنقطة جذب بصرية رئيسية؛ الفازة بكسر الرخام تضمن ثباتها ومنع انقلابها بسهولة."
        }
    elif "شمع" in cat_lower or "candle" in cat_lower:
        return {
            "type": "شموع معطرة وجيل ديكوري",
            "zone": "صواني الديكور في غرفة النوم، طاولة الركنة الهادئة، أو رخام الحمام بجوار البانيو",
            "caution": "تعزز جو الاسترخاء والهدوء والمظهر ثلاثي الأبعاد للأزهار المجففة داخل الجيل."
        }
    else:
        return {
            "type": "قطعة ديكور منزلي",
            "zone": "أرفف ديكور مودرن، طاولة ضيافة، أو مدخل المنزل",
            "caution": "تنسيق متناسق مع دهانات الحوائط البيج والأوف وايت والإضاءات الدافئة."
        }


def generate_pack(code: str, name: str, category: str, material: str, height: str, cost: float, store_price: float, amazon_price: float, phone: str = "01070810979", location: str = "محل أرتيفلورا للديكور والزهور - الوراق، الجيزة") -> str:
    store_eco = calculate_store_economics(cost, store_price)
    social_eco = calculate_social_cod_economics(cost, store_price)
    amz_eco = calculate_amazon_economics(cost, amazon_price)
    placement = get_placement_guide(category)

    # Content generation following WORKFLOW.md & AI_AGENTS_SPECIFICATIONS.md
    pack = f"""# حزمة التسويق المتكاملة: {name} 🌸✨

> **كود المنتج**: `{code}`  
> **التصنيف**: {category}  
> **الخامة والمواصفات**: {material}  
> **الارتفاع / الأبعاد**: {height}  
> **رقم الحجز والواتساب**: `{phone}`  
> **الموقع الميداني**: {location}  

---

## 📊 1. اقتصاديات الوحدة وجدوى التسعير

| القناة البيعية | سعر البيع | صافي الربح في جيبك | نسبة الهامش الصافي | أقصى تكلفة إعلانية (CPA) | التقييم |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **المحل أوفلاين (الوراق)** | {store_price:.2f} ج.م | **{store_eco['net_profit']} ج.م** | {store_eco['margin_percent']}% | 0.0 ج.م (بيع مباشر) | {'✅ آمن' if store_eco['is_safe'] else '⚠️ ضعيف'} |
| **السوشيال ميديا (شحن COD)** | {store_price:.2f} ج.م | **{social_eco['net_profit']} ج.م** | {social_eco['margin_percent']}% | {social_eco['max_ad_cpa']} ج.م | {'✅ مجدي للإعلانات' if social_eco['is_safe'] else '⚠️ غير مجدي'} |
| **أمازون مصر (Flora_Home)** | {amazon_price:.2f} ج.م | **{amz_eco['net_profit']} ج.م** | {amz_eco['margin_percent']}% | {amz_eco['max_ppc_cpa']} ج.م | {'✅ مجدي جداً' if amz_eco['is_safe'] else '⚠️ حذر'} |

---

## 🎯 2. هوكات ريلز وتيك توك (The Scroll-Stopper Hooks)

### هوك 1 (تفكيك أكبر غلطة في الفرش):
```text
أكبر غلطة بنعملها وإحنا بنفرش المكان.. بنحط حاجات كتير تعمل زحمة ودوشة في العين، والحل في لمسة واحدة هادية بتغير شكل الرف بالكامل زي القطعة دي.
```

### هوك 2 (الهوية المحلية والتوفير الذكي):
```text
لو بتجهزي شقتك في الجيزة أو الوراق ومش عايزة تصرفي أرقام خيالية في محلات المولات الكبيرة.. شوفي تنسيق القطعة دي وشياكتها على الطبيعة.
```

### هوك 3 (التحول البصري الصامت):
```text
شوفوا الفرق بين المكان وهو فاضي ومطفي، وبين لما حطينا اللمسة دي مع الإضاءة الدافئة.. راحة بصرية ملهاش حل.
```

---

## 📱 3. نصوص منشورات السوشيال ميديا (واتساب وفيسبوك وإنستجرام)

### النموذج الأول (نص دافئ يبرز الجودة وخامة كسر الرخام):
```text
تفاصيل صغيرة بتفرق جداً في دفء وشياكة البيت.. 🌿✨

{name} بتنسيق راقي يملى المكان فخامة من غير دوشة.
معمولة بخامة عملية ومميزة: {material}، ثابتة وتقيلة على الرف، وضد الكسر تماماً وقابلة للغسيل بالمية عشان تعيش معاكِ سنين بنفس رونقها حتى مع وجود أطفال. 🤍

- المقاس: {height}
- السعر في المحل: {store_price:.0f} ج.م فقط
- مكاننا: {location}

لطلب القطعة مع التوصيل السريع لحد باب البيت، ابعتولنا رسالة على الصفحة أو تواصلوا معانا واتساب مباشرة:
{phone}
```

### النموذج الثاني (مختصر وسريع للستوري وعروض الواتساب):
```text
جددي ديكور بيتك بلمسة أنيقة وهادية.. 🌸
{name} بخامة فاخرة ضد الكسر وتصميم عصري يناسب ترابيزات الصالون وأرفف الشاشة.

- الارتفاع: {height}
- السعر: {store_price:.0f} ج
- تنورونا في المحل بالوراق أو اطلبها واتساب: {phone}
```

---

## 🎬 4. برومبت الفيديو لمنصة Veo والتوجيه الصوتي الطبيعي

### Cinematic Veo Prompt (English):
```text
Photorealistic cinematic product showcase of {name}, featuring {material}, standing elegantly on an authentic natural warm oak wooden shelf in a cozy modern Egyptian apartment interior. Warm 2700K ambient LED background lighting casting soft warm reflections and realistic soft shadows. Smooth slow dolly push-in camera motion highlighting the detailed textures, 4k resolution, hyper-realistic, interior design magazine quality.
```

### Natural ASMR Audio Direction:
```text
Tactile soft placement click of the base resting on the wooden shelf at second 0:01 to immediately hook the ear, followed by serene natural morning ambiance with gentle distant birds. 100% Halal, peaceful natural sounds, zero music.
```

---

## 📦 5. مخطط إدراج المنتج على أمازون مصر (Flora_Home)

### عنوان المنتج المتوافق مع محركات البحث (Title SEO):
```text
Flora_Home {name} {material} ارتفاع {height} ديكور مودرن للمنزل والمكتب
```

### النقاط التسويقية الخمس (5 Bullet Points):
```text
- خامة عملية وفاخرة ضد الكسر: مصممة من خامات عالية الجودة تمنح ثباتاً ومتانة تامة ومقاومة للصدمات لتدوم طويلاً دون تلف.
- مظهر واقعي وتفاصيل ناعمة: تمنح منزلك لمسة طبيعية هادئة تضفي الدفء على أرفف التلفزيون أو طاولات الصالون وغرف النوم.
- سهلة التنظيف وقابلة للغسيل: لا تتأثر بالماء وسهلة المسح وإزالة الأتربة لتبقى بألوانها الزاهية باستمرار.
- حجم مثالي للديكور المنزلي: بارتفاع {height}، تناسب المساحات المودرن ومكاتب العمل والرفوف المعلقة دون أن تسبب ازدحاماً بصرياً.
- تغليف محكم وآمن ضد الصدمات: تصلك في كرتونة مقواة مبطنة بعدة طبقات بابلز لحمايتها بالكامل أثناء الشحن والتوصيل.
```

### الكلمات المفتاحية المخفية (Backend Search Terms):
```text
ديكور منزلي تحف فازات ورد صناعي نباتات زينة هدايا عرائس اكسسوارات منزلية ريف ديكور الوراق الجيزة flora home decor
```

---

## 🛋️ 6. دليل التوزيع المنزلي ومحاكاة الواقع (Placement Taxonomy)

- **التصنيف المعتمد**: {placement['type']}
- **المكان الصحيح في الشقة**: {placement['zone']}
- **تحذير الأمان**: {placement['caution']}
"""
    return pack


def main():
    parser = argparse.ArgumentParser(description="توليد حزمة تسويق متكاملة لمنتجات الديكور")
    parser.add_argument("--code", required=True, help="كود المنتج الفريد (مثال: BOUQ-001)")
    parser.add_argument("--name", required=True, help="اسم المنتج باللغة العربية")
    parser.add_argument("--category", required=True, help="تصنيف المنتج (بوكيهات، مزارع، كريستال، شموع)")
    parser.add_argument("--material", required=True, help="وصف الخامة (مثال: ورد جوري مع فازة بكسر رخام)")
    parser.add_argument("--height", required=True, help="الارتفاع أو الأبعاد (مثال: 30 سم)")
    parser.add_argument("--cost", type=float, required=True, help="تكلفة الشراء بالجملة")
    parser.add_argument("--store-price", type=float, required=True, help="سعر البيع في المحل")
    parser.add_argument("--amazon-price", type=float, help="سعر البيع على أمازون مصر")
    parser.add_argument("--save", action="store_true", help="حفظ الحزمة تلقائياً في مجلد copy/")

    args = parser.parse_args()

    amz_price = args.amazon_price if args.amazon_price is not None else round(args.store_price * 1.35, 2)

    content = generate_pack(
        code=args.code,
        name=args.name,
        category=args.category,
        material=args.material,
        height=args.height,
        cost=args.cost,
        store_price=args.store_price,
        amazon_price=amz_price
    )

    if args.save:
        output_dir = os.path.join("local-business-store", "store-marketing", "copy")
        os.makedirs(output_dir, exist_ok=True)
        filename = f"{args.code.lower()}-pack.md"
        filepath = os.path.join(output_dir, filename)
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"\n✅ تم حفظ حزمة التسويق بنجاح في: {filepath}\n")
    else:
        print(content)


if __name__ == "__main__":
    main()
