# Figma Implementation Plan

**Purpose:** Element Studies → Authoritative Design System

---

## Phase 1 — Element Intake (No Design Yet)

**Goal:** Move from loose visual references → structured candidates.

### 1. Create a dedicated Figma page

**Page name:**
```
00 – Element Intake (Reference Only)
```

### 2. Import ALL element mockups

- One frame per element
- One element per frame
- Do not resize or "clean up" yet

**Frame naming convention:**
```
REF_BankabilityScore_textFirst_v1
REF_EvidenceProgress_expiryState_v2
REF_RiskDriverList_dense_v1
```

> This page is disposable. Nothing here becomes a component.

---

## Phase 2 — Element Rationalisation (Critical)

**Goal:** Decide what survives before touching components.

### 3. For each element, answer ONE question

> "Which version best expresses meaning with the least interpretation?"

If two versions compete:
- Pick one
- Archive the other (hidden, not deleted)

### 4. Create a short decision note (1 sentence)

Add a small text note under the chosen version:

```
"Selected because hierarchy is clearer and labels survive grayscale."
```

This becomes future-proof justification.

---

## Phase 3 — Component Mapping (No Visual Change)

**Goal:** Map visuals to the existing component system.

### Create a new Figma page:
```
01 – Component Mapping
```

### For each selected element, create a simple table:

| Element | Maps to Component | Variant | Notes |
|---------|-------------------|---------|-------|
| Bankability score block | Domain/ScoreCard | text-first | No new props |
| Risk drivers list | Domain/ScoreComponents | compact | Max 3 items |
| Evidence expiry row | Domain/EvidenceProgressCard | expiry | Uses existing alert tone |

### Rule

> If an element cannot map cleanly → it does not get implemented yet.

---

## Phase 4 — Authoritative Component Build (This Is The Real Work)

**Goal:** Build only approved components as Figma components.

### 5. Create the real component pages
```
02 – UI Components (Locked)
03 – Domain Components (Locked)
```

### 6. Rebuild elements from scratch (important)

**Do not copy-paste from the mockups.**

Instead, recreate using:
- Design tokens
- Spacing rules
- Typography styles

Match hierarchy, not pixel perfection.

> This prevents "mockup artifacts" entering the system.

---

## Phase 5 — Variant Definition (Limited)

For each component, define only necessary variants.

### Example: Domain/ScoreCard

**Allowed variants:**
| Property | Options |
|----------|---------|
| Layout | text-first, stacked |
| Band | excellent, good, medium, risk |
| Density | comfortable, compact |

**Not allowed:**
- Decorative variants
- Role-specific components (role handled by presets)

---

## Phase 6 — Component Contract Annotation

For each Figma component, add a small annotation panel:

```
Component: Domain/ScoreCard
Maps to: ScoreCard.tsx
Props:
- score: number
- band: enum
- confidence: enum
- drivers: string[]
Max drivers: 3
```

> This is gold for engineers.

---

## Phase 7 — Freeze the System (Important)

Once components are built:

### 7.1 Create a page
```
99 – Design Authority Locked
```

Include:
- Statement: "Components on pages 02–03 are authoritative"
- Date
- Git commit hash
- Version number

### 7.2 Do NOT modify components casually after this

All future changes:
- Go through PCIA
- Require Design Authority approval

---

## Phase 8 — Only Now: Screen Composition

Now (and only now) you may:
- Assemble Grower Dashboard
- Assemble Deal Room
- Assemble Contracted Overview

Using:
- Instances only
- No detaching
- No overrides beyond allowed props

---

## Quick Decision Tree (When You're Unsure)

| Question | Answer |
|----------|--------|
| Should this become a component? | Only if reused ≥2 times |
| Should this be a variant? | Only if meaning stays identical |
| Should this be a new component? | Almost always no |
| Should I tweak spacing "just a bit"? | No, unless it applies system-wide |

---

## Manus Nano Banana Tasks Created

| Task ID | Element Study | URL |
|---------|---------------|-----|
| `m9Q86N72eYggNfWch4qnNL` | Bankability Score Badge | https://manus.im/app/m9Q86N72eYggNfWch4qnNL |
| `j8g7mwavRqCpNdHeLWCZZP` | Contract Security GC1-GC4 | https://manus.im/app/j8g7mwavRqCpNdHeLWCZZP |
| `cZvvyVmDs9HYFBKGiVjUWp` | Technology Readiness TR1-TR4 | https://manus.im/app/cZvvyVmDs9HYFBKGiVjUWp |
| `79VgD7s9uzo2fEQ2Qhv8qV` | Carbon Intensity CI-A to CI-D | https://manus.im/app/79VgD7s9uzo2fEQ2Qhv8qV |
| `KCQDhSKcpq6jqwJ5mhTKUT` | Confidence Indicator | https://manus.im/app/KCQDhSKcpq6jqwJ5mhTKUT |
| `ZfgBNhq4zVtiEpReW55EG9` | Bankability Drivers List | https://manus.im/app/ZfgBNhq4zVtiEpReW55EG9 |
| `n7YYdWQggxSLwemUyB5ZTw` | Monitoring Status Indicators | https://manus.im/app/n7YYdWQggxSLwemUyB5ZTw |
| `25frGGhFLau9VqpXCaRZjf` | ListingSummaryCard Density | https://manus.im/app/25frGGhFLau9VqpXCaRZjf |
| `NfNsPS3gaDA6E5Mt5Xh7SR` | Export-Ready Bankability | https://manus.im/app/NfNsPS3gaDA6E5Mt5Xh7SR |
| `GDh2ph4HVUoSD4SeVyRK2b` | KPI Tiles Typography | https://manus.im/app/GDh2ph4HVUoSD4SeVyRK2b |

---

## Related Documents

| Document | Purpose |
|----------|---------|
| `NANO_BANANA_ELEMENT_STUDIES.md` | Canonical prompts for element generation |
| `FIGMA_DESIGN_AUTHORITY_DOCUMENT.md` | Governance framework |
| `FIGMA_COMPONENT_CONTRACTS.md` | Component specifications |
| `FIGMA_CHANGE_IMPACT_ASSESSMENT.md` | PCIA process |
