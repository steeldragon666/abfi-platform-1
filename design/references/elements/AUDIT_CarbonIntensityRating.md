# Nano Banana Audit — CarbonIntensityRating (CI-A to CI-D)

**Task ID:** `79VgD7s9uzo2fEQ2Qhv8qV`
**Element Study:** #4
**Component:** `Domain/CarbonIntensityRating`
**Audit Date:** 2025-12-23

---

## Task Output Summary

4 variations generated for carbon intensity ratings:
- CI-A through CI-D with corresponding gCO2e/MJ ranges
- Grayscale-safe (black, white, gray tones only)
- Print-safe with high contrast
- Clean typography

---

## A. Structural Conformance (Hard Gate)

**Schema requires:**
- Variants: `rating`, `showExplanation`, `context`
- Props: `label`, `bandText`, `contextNote`, `methodologyRef`

| Check | Result |
|-------|--------|
| CI-A through CI-D shown | ✅ PASS |
| Rating code displayed | ✅ PASS |
| Intensity range shown | ✅ PASS |
| Label present | ✅ PASS |

**Result:** ✅ PASS

---

## B. Semantic Purity (Hard Gate)

**Must NOT show:** Numeric emissions in badge, compliance claims

| Check | Result |
|-------|--------|
| No specific gCO2e values in badge | ✅ PASS (ranges only) |
| No compliance claims | ✅ PASS |
| No certification badges | ✅ PASS |
| Relative positioning only | ✅ PASS |

**Result:** ✅ PASS

---

## C. Role Context Consistency

| Check | Result |
|-------|--------|
| Grower context | ✅ PASS |
| Developer context | ✅ PASS |
| Lender context | ✅ PASS |
| Export context | ✅ PASS |

**Result:** ✅ PASS

---

## D. Variant Completeness

| Check | Result |
|-------|--------|
| CI-A (Very low) | ✅ PASS |
| CI-B (Low) | ✅ PASS |
| CI-C (Moderate) | ✅ PASS |
| CI-D (High) | ✅ PASS |
| No CI-E+ implied | ✅ PASS |

**Result:** ✅ PASS

---

## E. Export Survivability Check

| Check | Result |
|-------|--------|
| No hue reliance | ✅ PASS |
| Grayscale works | ✅ PASS |
| High contrast | ✅ PASS |
| Text-first | ✅ PASS |

**Result:** ✅ PASS

---

## Audit Decision

**Overall:** ✅ CONFORMANT — Implement directly

---

## Winner Selection

**Selected:** Two-line badge format (code + range)

**Reason:**
- Shows rating code prominently
- Range provides context without overprecision
- Degrades gracefully to text-only
- Appropriate for credit documentation

---

## Figma Implementation Notes

```
Component: Domain/CarbonIntensityRating
Implements: FIGMA_BANKABILITY_AUTHORITY_SCHEMA.md
Task ID: 79VgD7s9uzo2fEQ2Qhv8qV
Selected: Two-line format

Variants:
  rating: CI-A | CI-B | CI-C | CI-D
  showExplanation: true | false
  context: grower | developer | lender | export

Properties:
  label: "Carbon intensity" (default)
  bandText: Auto-mapped
  contextNote: Optional, max 100 chars
  methodologyRef: Short reference
  exportSafe: true
```

**Locked Terminology:**
| Rating | Band Text |
|--------|-----------|
| CI-A | "Very low intensity" |
| CI-B | "Low intensity" |
| CI-C | "Moderate intensity" |
| CI-D | "High intensity" |

**No semantic changes from schema.**
