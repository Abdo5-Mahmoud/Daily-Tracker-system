# Visual Asset Prompt Matrices & Parameter Standards 🎨📐

This reference defines the 4 core prompt archetypes for e-commerce, lifestyle staging, UI components, and hybrid mobile compositing.

---

## 1. Archetype: Amazon White Hero (`hero_white_bg`)

### Target Specifications
- **Aspect Ratio**: `1:1`
- **Output Resolution**: Minimum 2000x2000 px.
- **Background**: Seamless, pure white RGB (255, 255, 255).
- **Occupancy**: Subject occupies 85% to 90% of the frame.
- **Lighting**: Balanced dual-softbox commercial studio lighting.
- **Shadow**: Subtle, realistic soft contact drop shadow directly beneath base.

### Prompt Template
```text
Commercial e-commerce studio product photograph of [SUBJECT DESCRIPTION, e.g., an elegant modern ceramic fluted vase in matte chalk white]. 
Isolated on pure seamless white background RGB (255, 255, 255). 
Centered composition filling 85-90% of the frame. 
Soft diffused professional studio lighting, subtle grounded contact drop shadow underneath the base. 
Sharp micro-textures, authentic ceramic ribbing, crisp clean edges. 
Shot on 85mm f/8 medium format camera, ultra-sharp detail, high dynamic range. 
Negative constraints: no humans, no limbs, no background furniture, no color cast, no blur, no vignette.
```

---

## 2. Archetype: Egyptian Interior Lifestyle (`lifestyle_interior`)

### Target Specifications
- **Aspect Ratio**: `4:5` (Instagram/Meta Ads) or `1:1` (Amazon secondary).
- **Staging Context**: High-end modern Egyptian apartment, minimalist credenza, dining console, or marble coffee table.
- **Lighting**: 2700K warm interior ambient light with natural daylight coming from a side window.
- **Depth of Field**: $f/2.8$ with authentic physical lens bokeh on background architecture.
- **Negative Constraints**: Strictly no floating objects, no distorted hands, no impossible architectural geometry.

### Prompt Template
```text
Architectural Digest lifestyle interior photograph featuring [SUBJECT, e.g., a ribbed white ceramic vase with dried pampas grass stems] placed on a luxurious warm oak console table. 
Staged in an upscale modern Egyptian living room interior with subtle warm neutral beige plastered walls and textured linen curtains. 
Soft warm ambient lighting at 2700K paired with gentle natural morning daylight streaming from a tall side window. 
Natural realistic contact shadows and subtle reflections on the tabletop. 
Shot on Sony A7R V with 50mm f/2.8 lens, shallow depth of field, gentle background bokeh, crisp subject texture. 
Negative constraints: no people, no distorted hands, no floating items, no artificial sticker effect, no cartoon styling.
```

---

## 3. Archetype: UI & Product Mockup (`ui_mockup`)

### Target Specifications
- **Aspect Ratio**: `16:9` or `4:3`.
- **Style**: Contemporary SaaS / Web application interface with dark/glassmorphic surface and curated typography.
- **Rules**: Zero generic device bezels (no generic laptop frames or phone outlines unless specifically requested).

### Prompt Template
```text
High-end modern web application dashboard interface for [APPLICATION DOMAIN, e.g., an inventory management and pricing analytics suite]. 
Sleek dark mode glassmorphism layout, vibrant indigo and violet accent data charts, clean typography with Inter and monospace numbers. 
Semantic information architecture with sidebar navigation, metric KPI cards, and an interactive data table. 
Rendered flat viewport, crisp vector-like UI elements, subtle gradients, soft ambient glow. 
Negative constraints: no external laptop frame, no phone bezel, no blurry text, no generic clip-art.
```

---

## 4. Archetype: Hybrid Mobile Compositing (`real_photo_composite`)

### Target Specifications
- **Baseline**: Real mobile photo taken from the store (`Artiflora` / `local-business-store/store-marketing/`).
- **Isolation**: Photoroom / remove.bg cutout with alpha transparency.
- **Staging**: AI generates ONLY the surrounding perspective-matched environment without recreating the product.

### Protocol
1. Take high-resolution photo with phone camera centered under neutral lighting.
2. Remove background to create transparent PNG using Photoroom.
3. Generate background scene matching the camera angle ($35^\circ$ angle down).
4. Composite cutout onto generated background and generate grounded shadow contact.
