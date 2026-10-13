# 3-Stage Distortion & Hallucination Audit Checklist 🔍🛡️

Every generated visual asset must undergo this 3-stage validation checklist before being committed to documentation, social media marketing, or production listings.

---

## Stage 1: Geometry & Anatomy Audit

- [ ] **Phantom Limbs & Hands**: Scan all corners, walls, and edges. Confirm there are **zero** disembodied fingers, extra hands, or limbs emerging from surfaces.
- [ ] **Structural Lines**: Verify that architectural lines (doorframes, tabletop edges, shelving, walls) are strictly straight and physically plausible.
- [ ] **Symmetry & Fluting**: For geometric decor items (such as fluted vases), verify the ribs or fluting maintain consistent vertical alignment without melting or warping.

---

## Stage 2: Lighting & Physics Consistency

- [ ] **Single Primary Light Source**: Check the direction of highlights on the subject against the ambient environment. The key light angle must match.
- [ ] **Contact Drop Shadow**: Ensure the base of the object has an authentic dark contact shadow immediately touching the surface (ambient occlusion).
- [ ] **Light Temperature Harmony**: Verify ambient interior light maintains cohesive warmth (2700K to 3200K) without random mismatched cold blue patches.

---

## Stage 3: Scale & Anti-Sticker Verification

- [ ] **Relative Scale**: Compare the object dimensions against common reference props (e.g., books, candles, coasters, cutlery). The object must not look miniature or colossal.
- [ ] **Edge Feathering & Light Wrap**: Ensure edges do not look like a cut-and-paste sticker. There must be subtle physical light bounce from the surface onto the base of the object.
- [ ] **Depth of Field Alignment**: If the background has bokeh, the foreground object must have sharp, crisp focus without accidental edge blur.

---

## Failure Response Protocol

If an image fails **any** of the 3 stages:
1. **Immediate Rejection**: Do not attempt to mask or hide the flaw.
2. **Log the Finding**: Record the failure mode (e.g., `Anatomy defect: phantom hand near right frame`).
3. **Prompt Iteration**: Re-inject targeted negative constraints into the prompt or switch to Archetype 4 (Real-photo cutout compositing).
