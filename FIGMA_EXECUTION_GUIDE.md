# Figma Implementation Phase — Execution Guide

**Purpose:** Element studies → governed components → screens

---

## Phase 1 — Ingest (Do Not Design Yet)

**Objective:** Bring Nano Banana outputs into Figma as reference evidence, not components.

### 1. Create a dedicated Figma page

Name it exactly:
```
00 — Element Studies (Reference Only)
```

### 2. Import outputs

- One frame per element study
- Label each frame with:
  - Element name
  - Task ID
  - Commit reference
  - Status: `REFERENCE — NOT COMPONENT`

**Example frame title:**
```
Bankability Score Badge
Nano Banana Task: m9Q86N72eYggNfWch4qnNL
Commit: 3829a65
```

### Do Not:
- Convert to components
- Adjust spacing
- "Clean up" visuals
- Combine variants

> At this stage, Figma is acting as a visual notebook, nothing more.

---

## Phase 2 — Rationalise (Critical Gate)

**Objective:** Decide what survives into the system.

For each of the 10 element studies, answer in writing (1–2 lines):
1. Which variant is closest to institutional correctness?
2. Why this variant (hierarchy, legibility, audit safety)?
3. What existing component does it map to?

### Create a new Figma page:
```
01 — Element Decisions (Locked)
```

**Example decision record:**
```
Bankability Score Badge
Selected: Variant B
Reason: Text-first hierarchy, survives grayscale, no implied precision
Maps to: Domain/ScoreBadge
```

### Rule
> If you cannot clearly map an element → it does not graduate.

---

## Phase 3 — Systemise (This Is The Real Work)

**Objective:** Rebuild elements from scratch using the design system — not copying pixels.

### 1. Move to your actual component pages

Create / use these pages:
```
02 — Tokens & Variables
03 — UI Components
04 — Domain Components
```

### 2. Rebuild elements as components

For each approved element:

**Start with existing base components:**
- Card
- Badge
- Text styles
- Grid / Auto Layout

**Apply insights from the element study:**
- Spacing
- Hierarchy
- Density
- Ordering

**Create variants, not new components:**
```
band = Good | Medium | Risk
confidence = High | Medium | Low
density = comfortable | compact
```

### 3. Enforce prop discipline

Every Figma component must have:
- Clear property names
- Defaults matching Grower / Developer / Lender presets
- No visual-only variants

> If a property cannot be expressed as a prop → stop and reassess.

---

## Phase 4 — Validation Loop (Non-Negotiable)

For each newly created Figma component, complete this checklist:

### Design Authority Checks
- [ ] Maps to an approved component
- [ ] No new semantic meaning introduced
- [ ] No implied guarantees or precision
- [ ] Labelled states (no colour-only meaning)

### Institutional Checks
- [ ] Printable in grayscale
- [ ] Would not alarm a credit committee
- [ ] Would survive FOI screenshotting

### Engineering Checks
- [ ] Prop names match React intent
- [ ] Variants correspond to enum-like values
- [ ] No layout magic that can't be implemented

> If it fails any → revise before moving on.

---

## Phase 5 — Freeze Elements (Important)

Once an element is systemised:

### Move it to:
```
04 — Domain Components (Approved)
```

### Add annotation:
```
Approved under Design Authority v1.0
Derived from Element Study Task ID: XXXXX
```

> This gives you traceability months later.

---

## Phase 6 — Only Now: Screen Assembly

Only after all 10 elements are:
- Rationalised
- Systemised
- Approved

...do you move to:
```
05 — Templates
06 — Screens
```

### Build order:
1. Grower Dashboard
2. Deal Room Overview
3. Contracted Execution
4. Developer Dashboard
5. Lender Dashboard

> At this point, screens should feel inevitable, not debatable.

---

## What Not To Do (This Is Where Teams Fail)

| Anti-Pattern | Why It Fails |
|--------------|--------------|
| Paste Nano Banana visuals directly into components | Brings mockup artifacts into system |
| Design screens while elements are unsettled | Creates rework and inconsistency |
| Let visual polish override semantics | Breaks institutional tone |
| Introduce "just this once" exceptions | Entropy starts here |

If someone says "this one feels better" — ask:
> "Better according to which authority?"

---

## Current Status

You are in a rarely executed but correct phase:

```
Element research → governance → system build → screens
```

Most teams skip this and pay later. You are doing it properly.

---

## Element Study Tasks (Reference)

| # | Element | Task ID | Manus URL |
|---|---------|---------|-----------|
| 1 | Bankability Score Badge | `m9Q86N72eYggNfWch4qnNL` | [View](https://manus.im/app/m9Q86N72eYggNfWch4qnNL) |
| 2 | Contract Security GC1-GC4 | `j8g7mwavRqCpNdHeLWCZZP` | [View](https://manus.im/app/j8g7mwavRqCpNdHeLWCZZP) |
| 3 | Technology Readiness TR1-TR4 | `cZvvyVmDs9HYFBKGiVjUWp` | [View](https://manus.im/app/cZvvyVmDs9HYFBKGiVjUWp) |
| 4 | Carbon Intensity CI-A to CI-D | `79VgD7s9uzo2fEQ2Qhv8qV` | [View](https://manus.im/app/79VgD7s9uzo2fEQ2Qhv8qV) |
| 5 | Confidence Indicator | `KCQDhSKcpq6jqwJ5mhTKUT` | [View](https://manus.im/app/KCQDhSKcpq6jqwJ5mhTKUT) |
| 6 | Bankability Drivers List | `ZfgBNhq4zVtiEpReW55EG9` | [View](https://manus.im/app/ZfgBNhq4zVtiEpReW55EG9) |
| 7 | Monitoring Status Indicators | `n7YYdWQggxSLwemUyB5ZTw` | [View](https://manus.im/app/n7YYdWQggxSLwemUyB5ZTw) |
| 8 | ListingSummaryCard Density | `25frGGhFLau9VqpXCaRZjf` | [View](https://manus.im/app/25frGGhFLau9VqpXCaRZjf) |
| 9 | Export-Ready Bankability | `NfNsPS3gaDA6E5Mt5Xh7SR` | [View](https://manus.im/app/NfNsPS3gaDA6E5Mt5Xh7SR) |
| 10 | KPI Tiles Typography | `GDh2ph4HVUoSD4SeVyRK2b` | [View](https://manus.im/app/GDh2ph4HVUoSD4SeVyRK2b) |

---

## Next Best Move (When Tasks Complete)

1. Pick one element (recommend: **Bankability Score Badge**)
2. Walk it through Phases 2–4
3. Once that feels smooth, repeat for the remaining 9

---

## Related Documents

| Document | Purpose |
|----------|---------|
| `FIGMA_IMPLEMENTATION_PLAN.md` | High-level 8-phase workflow |
| `NANO_BANANA_ELEMENT_STUDIES.md` | Canonical prompts |
| `FIGMA_DESIGN_AUTHORITY_DOCUMENT.md` | Governance framework |
| `FIGMA_COMPONENT_CONTRACTS.md` | Component specifications |
