# Nano Banana Audit — KPI Tiles (Bankability Typography)

**Task ID:** `GDh2ph4HVUoSD4SeVyRK2b`
**Element Study:** #10
**Component:** `Domain/KPITile`
**Audit Date:** 2025-12-23

---

## Task Output Summary

4 typography and spacing variations generated:
- Large value / small label (32px/12px)
- Balanced sizing (24px/14px)
- Label-first format
- Inline format

3-tile row layouts:
- Separated tiles (visible borders)
- Connected tiles (shared borders)
- Borderless tiles (whitespace only)

---

## A. Structural Conformance (Hard Gate)

**Schema requires:**
- Props: `metricLabel`, `metricValue`, `helperText`
- Variants: `tone`, `size`
- Size restricted to `md` only

| Check | Result |
|-------|--------|
| metricLabel required | ✅ PASS |
| metricValue required | ✅ PASS |
| helperText optional | ✅ PASS |
| Tone variant (neutral/warning/risk) | ✅ PASS |
| Size md only | ✅ PASS |

**Result:** ✅ PASS

---

## B. Semantic Purity (Hard Gate)

**Must NOT show:** Trends, forecasts, performance metrics, comparisons to targets

| Check | Result |
|-------|--------|
| No trend arrows | ✅ PASS |
| No forecasts | ✅ PASS |
| No target comparisons | ✅ PASS |
| Factual metrics only | ✅ PASS |
| No performance theatre | ✅ PASS |

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
| Neutral tone | ✅ PASS |
| Warning tone | ✅ PASS |
| Risk tone | ✅ PASS |
| md size | ✅ PASS |
| No sm/lg size | ✅ PASS (correctly restricted) |

**Result:** ✅ PASS

---

## E. Export Survivability Check

| Check | Result |
|-------|--------|
| No colour-only meaning | ✅ PASS |
| Grayscale readable | ✅ PASS |
| Typography hierarchy clear | ✅ PASS |
| Works in summary sections | ✅ PASS |

**Result:** ✅ PASS

---

## Audit Decision

**Overall:** ✅ CONFORMANT — Implement directly

---

## Winner Selection

**Selected:** Balanced typography (24px value, 14px label) with separated tile layout

**Reason:**
- Clear hierarchy without overwhelming the value
- Label provides context without competing
- Separated tiles create visual rhythm
- Works in 3-tile row format
- Appropriate visual weight for summary stats

---

## Figma Implementation Notes

```
Component: Domain/KPITile
Implements: FIGMA_BANKABILITY_AUTHORITY_SCHEMA.md
Task ID: GDh2ph4HVUoSD4SeVyRK2b
Selected: Balanced typography, separated layout

Variants:
  tone: neutral | warning | risk
  size: md (only)
  context: grower | developer | lender | export

Properties:
  metricLabel: Text (required)
  metricValue: Text (required, short)
  helperText: Text (optional)
  exportSafe: true
```

**Typography Specifications:**
| Element | Size | Weight |
|---------|------|--------|
| Value | 24px | SemiBold |
| Label | 14px | Medium |
| Helper | 12px | Regular |

**Tile Specifications:**
| Property | Value |
|----------|-------|
| Size | 160px × 100px |
| Padding | 16px |
| Gap (label-value) | 8px |
| Border | 1px solid #E0E0E0 |
| Tile gap (in row) | 8px |

**Tone Indicators (Grayscale-Safe):**
| Tone | Treatment |
|------|-----------|
| Neutral | Standard border |
| Warning | Bold border (2px) |
| Risk | Bold border + light fill (#F5F5F5) |

**No trend arrows. No performance comparisons. Summary stats only.**
