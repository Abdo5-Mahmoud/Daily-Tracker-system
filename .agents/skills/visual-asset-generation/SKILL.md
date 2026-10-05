---
name: visual-asset-generation
description: "Master engineering and visual standards for creating e-commerce product photos, interior lifestyle staging, and UI design mockups. Enforces strict prompt matrices, automated image audits, and 3-stage distortion elimination."
---

# Visual Asset Generation & Quality Audit Protocol 🎨📸

This skill governs all visual creation, prompt structuring, and quality auditing across the workspace. It guarantees commercial-grade visual assets for Amazon Egypt (`Flora_Home`), local decor retail (`Artiflora`), and fullstack application interfaces.

---

## 1. Operating Rules & Pre-Generation Law

1. **Never Prompt Naively**:
   - Every invocation of `generate_image` MUST be formulated using one of the 4 calibrated archetypes in [references/PROMPT_MATRICES.md](references/PROMPT_MATRICES.md).
   - Prompts must include explicit camera focal lengths, lighting color temperatures (e.g. 2700K), and hard negative constraints.

2. **Mandatory Post-Generation Verification**:
   - Immediately upon receiving an image, run the automated quality audit script:
     ```powershell
     powershell -ExecutionPolicy Bypass -File scripts/audit_image_quality.ps1 -ImagePath "<generated_image_path>"
     ```
   - Verify resolution, aspect ratio, and white background threshold if applicable.

3. **Strict 3-Stage Distortion Gate**:
   - Check every output against [references/DISTORTION_CHECKLIST.md](references/DISTORTION_CHECKLIST.md).
   - If any phantom hands, melting geometry, or sticker-like artifacts are detected, the asset is discarded immediately.

---

## 2. Decision Tree: Which Archetype to Use?

```text
Visual Asset Needed
│
├── Amazon Main Product Listing?
│   └── Archetype 1: hero_white_bg (1:1, Pure White RGB 255,255,255, 2000px, 90% Fill)
│
├── Instagram / Meta Ads / Secondary Amazon Image?
│   └── Archetype 2: lifestyle_interior (4:5 or 1:1, 2700K Warm Light, High-end Staging)
│
├── Web App / Dashboard Mockup / Portfolio Asset?
│   └── Archetype 3: ui_mockup (16:9, Glassmorphism, Flat Viewport, Zero Fake Bezels)
│
└── Existing Store Product with Exact Physical Shape?
    └── Archetype 4: real_photo_composite (Mobile photo + Photoroom Cutout + AI Background)
```

---

## 3. Post-Processing & Optimization

For Amazon hero images requiring 2000x2000 px centering and pure white boundaries:
```powershell
powershell -ExecutionPolicy Bypass -File scripts/optimize_hero_image.ps1
```
And verify with:
```powershell
powershell -ExecutionPolicy Bypass -File scripts/audit_image_quality.ps1 -ImagePath "<path>" -RequireWhiteBackground -MinResolution 1500
```
