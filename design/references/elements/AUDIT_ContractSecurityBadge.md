# Nano Banana Audit — ContractSecurityBadge (GC1-GC4)

**Task ID:** `j8g7mwavRqCpNdHeLWCZZP`
**Element Study:** #2
**Component:** `Domain/ContractSecurityBadge`
**Audit Date:** 2025-12-23

---

## Task Output Summary

4 variations generated using Swiss International Style principles:
1. Horizontal bar weight variation
2. Border thickness hierarchy
3. Background tint scale
4. Typographic weight modulation

All variations:
- Encode security levels (GC1-GC4)
- Grayscale-safe
- Print-safe
- Compact (max 120px wide)
- No icons or gradients
- Includes table context example

---

## A. Structural Conformance (Hard Gate)

**Schema requires:**
- Variants: `grade`, `layout`, `context`
- Props: `title`, `gradeLabel`, `description`, `tone`, `showTooltip`

| Check | V1 | V2 | V3 | V4 |
|-------|----|----|----|----|
| Single grade per badge | ✅ | ✅ | ✅ | ✅ |
| GC1-GC4 grades shown | ✅ | ✅ | ✅ | ✅ |
| Title/label present | ✅ | ✅ | ✅ | ✅ |
| Description (1 line max) | ✅ | ✅ | ✅ | ✅ |
| Compact (≤120px) | ✅ | ✅ | ✅ | ✅ |
| No icons | ✅ | ✅ | ✅ | ✅ |

**Result:** ✅ ALL PASS

---

## B. Semantic Purity (Hard Gate)

**Must NOT show:** Legal claims, "secure/guaranteed" language, certainty

| Check | V1 | V2 | V3 | V4 |
|-------|----|----|----|----|
| No "secure" language | ✅ | ✅ | ✅ | ✅ |
| No "guaranteed" claims | ✅ | ✅ | ✅ | ✅ |
| No legal terminology | ✅ | ✅ | ✅ | ✅ |
| Indicative only | ✅ | ✅ | ✅ | ✅ |

**Result:** ✅ ALL PASS

---

## C. Role Context Consistency

| Check | V1 | V2 | V3 | V4 |
|-------|----|----|----|----|
| Works for grower context | ✅ | ✅ | ✅ | ✅ |
| Works for developer context | ✅ | ✅ | ✅ | ✅ |
| Works for lender context | ✅ | ✅ | ✅ | ✅ |
| Export-safe (no colour) | ✅ | ✅ | ✅ | ✅ |

**Result:** ✅ ALL PASS

---

## D. Variant Completeness

**Schema variants:** `GC1`, `GC2`, `GC3`, `GC4`

| Check | V1 | V2 | V3 | V4 |
|-------|----|----|----|----|
| All 4 grades shown | ✅ | ✅ | ✅ | ✅ |
| No GC5+ implied | ✅ | ✅ | ✅ | ✅ |
| Uses exact GC terminology | ✅ | ✅ | ✅ | ✅ |

**Result:** ✅ ALL PASS

---

## E. Export Survivability Check

| Check | V1 | V2 | V3 | V4 |
|-------|----|----|----|----|
| No hue reliance | ✅ | ✅ | ✅ | ✅ |
| Grayscale differentiation | ✅ | ✅ | ✅ | ✅ |
| No small grey text | ✅ | ✅ | ✅ | ✅ |
| Table context works | ✅ | ✅ | ✅ | ✅ |

**Result:** ✅ ALL PASS

---

## Audit Decision

| Variation | Outcome | Action |
|-----------|---------|--------|
| V1 (Bar weight) | ✅ Conformant | Good for inline display |
| V2 (Border thickness) | ✅ Conformant | Best for table cells |
| V3 (Background tint) | ⚠️ Adaptable | May need contrast adjustment |
| V4 (Typography weight) | ✅ Conformant | Best for text-dense contexts |

---

## Winner Selection

**Selected:** Variation 2 (Border thickness hierarchy)

**Reason:**
- Clearest visual differentiation in compact space
- Works best in table cell context (schema requirement: max 120px)
- Border weight survives all print conditions
- No reliance on subtle tints

---

## Figma Implementation Notes

```
Component: Domain/ContractSecurityBadge
Implements: FIGMA_BANKABILITY_AUTHORITY_SCHEMA.md
Task ID: j8g7mwavRqCpNdHeLWCZZP
Selected: Variation 2

Variants:
  grade: GC1 | GC2 | GC3 | GC4
  layout: inline | stacked
  context: grower | developer | lender | export

Properties:
  title: "Contract security" (default)
  gradeLabel: Auto-mapped (e.g., "GC2 — Indicative")
  description: Max 100 chars
  tone: neutral | warning | risk
  showTooltip: false (default)
  exportSafe: true
```

**Locked Copy:**
| Grade | Label |
|-------|-------|
| GC1 | "Binding, long-term offtake" |
| GC2 | "Medium-term contracted" |
| GC3 | "Short-term/rolling" |
| GC4 | "No contractual security" |

**No semantic changes from schema.**
