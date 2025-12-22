# Nano Banana Audit — ListingSummaryCard (Bankability Density Variant)

**Task ID:** `25frGGhFLau9VqpXCaRZjf`
**Element Study:** #8
**Component:** `Domain/ListingSummaryCard`
**Audit Date:** 2025-12-23

---

## Task Output Summary

5 density variants generated:
- Spacious (~140px height)
- Standard (~100px height)
- Compact (~72px height)
- Minimal (~48px height)
- Table row (~36px height)

All variants:
- Show project identification
- Include bankability rating
- Grayscale-safe
- Work at 360px card width

---

## A. Structural Conformance (Hard Gate)

**Schema requires:**
- Variants: `density`
- Props: `showBankability`, `showConfidence`, `showCarbon`

| Check | Result |
|-------|--------|
| Comfortable density | ✅ PASS |
| Compact density | ✅ PASS |
| showBankability boolean | ✅ PASS |
| showConfidence boolean | ✅ PASS |
| showCarbon boolean | ✅ PASS |
| Project identification clear | ✅ PASS |

**Result:** ✅ PASS

---

## B. Semantic Purity (Hard Gate)

**Must NOT show:** Promotional language, implied guarantees, ranking comparisons

| Check | Result |
|-------|--------|
| No promotional content | ✅ PASS |
| No implied rankings | ✅ PASS |
| Factual information only | ✅ PASS |
| Status indicators neutral | ✅ PASS |

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
| Comfortable density works | ✅ PASS |
| Compact density works | ✅ PASS |
| Rating badge placement clear | ✅ PASS |
| Information hierarchy maintained | ✅ PASS |
| Truncation handled gracefully | ✅ PASS |

**Result:** ✅ PASS

---

## E. Export Survivability Check

| Check | Result |
|-------|--------|
| No colour-only meaning | ✅ PASS |
| Grayscale maintains hierarchy | ✅ PASS |
| All text readable at compact sizes | ✅ PASS |
| Works in table/list context | ✅ PASS |

**Result:** ✅ PASS

---

## Audit Decision

**Overall:** ✅ CONFORMANT — Implement directly

---

## Winner Selection

**Selected:** Standard density with top-right rating badge placement

**Reason:**
- Balanced information density
- Project name first, rating secondary
- Works at both comfortable and compact densities
- Clear visual hierarchy
- Scannable in list context

---

## Figma Implementation Notes

```
Component: Domain/ListingSummaryCard
Implements: FIGMA_BANKABILITY_AUTHORITY_SCHEMA.md
Task ID: 25frGGhFLau9VqpXCaRZjf
Selected: Standard density, top-right badge

Variants:
  density: comfortable | compact
  context: grower | developer | lender | export

Properties:
  projectName: Text (required)
  location: Text
  feedstock: Text
  capacity: Text
  showBankability: true (default)
  showConfidence: true (default)
  showCarbon: false (default)
  status: Text
  exportSafe: true
```

**Density Specifications:**
| Density | Height | Content Shown |
|---------|--------|---------------|
| Comfortable | ~140px | All fields, full labels |
| Compact | ~72px | Name, location, rating, status |

**Card width: 360px. Rating badge top-right corner.**
