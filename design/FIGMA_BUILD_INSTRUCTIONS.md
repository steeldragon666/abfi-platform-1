# Figma Build Instructions — Bankability Framework Components

**File:** `Z3htI9lFecgDFrEb4S6Qn2`
**Status:** Ready for implementation

---

## File Setup

### Step 1: Rename File
```
ABFI — Bankability Framework Components
```

### Step 2: Create Pages
```
00 — Element Studies (Reference Only)
01 — Tokens & Variables
02 — UI Components
03 — Domain Components
99 — Design Authority Locked
```

---

## Component #1: BF/BankabilityScoreBadge

**Location:** Page `03 — Domain Components`

### Create Component

1. Create a Frame (Auto Layout, Vertical)
2. Name it: `BF/BankabilityScoreBadge`

### Add Variants

Create variant property `grade`:
- `excellent`
- `good`
- `medium`
- `risk`

Create variant property `size`:
- `sm`
- `md`

Create variant property `context`:
- `grower`
- `developer`
- `lender`
- `export`

### Layer Structure

```
BF/BankabilityScoreBadge
├── Label (Text) → "Bankability"
├── Grade (Text) → "Good"
└── Descriptor (Text) → "Positive bankability with minor gaps"
```

### Text Properties (Figma Component Properties)

| Property | Type | Default |
|----------|------|---------|
| `label` | Text | "Bankability" |
| `gradeText` | Text | (varies by variant) |
| `descriptor` | Text | (varies by variant) |

### Boolean Properties

| Property | Default |
|----------|---------|
| `showDescriptor` | true |

### Typography (md size)

| Element | Font | Size | Weight | Color |
|---------|------|------|--------|-------|
| Label | Inter | 12px | Medium | `#666666` |
| Grade | Inter | 18px | SemiBold | `#1A1A1A` |
| Descriptor | Inter | 14px | Regular | `#333333` |

### Typography (sm size)

| Element | Font | Size | Weight | Color |
|---------|------|------|--------|-------|
| Label | Inter | 10px | Medium | `#666666` |
| Grade | Inter | 14px | SemiBold | `#1A1A1A` |
| Descriptor | Inter | 12px | Regular | `#333333` |

### Spacing (md)

| Property | Value |
|----------|-------|
| Padding | 16px |
| Gap (label→grade) | 4px |
| Gap (grade→descriptor) | 8px |

### Spacing (sm)

| Property | Value |
|----------|-------|
| Padding | 12px |
| Gap (label→grade) | 2px |
| Gap (grade→descriptor) | 6px |

### Border by Context

| Context | Border |
|---------|--------|
| `grower` | 1px solid `#E0E0E0` |
| `developer` | 1px solid `#D0D0D0` |
| `lender` | 1px solid `#C0C0C0` |
| `export` | 1px solid `#000000` |

### Grade Text Defaults

| Variant | gradeText | descriptor |
|---------|-----------|------------|
| `excellent` | "Excellent" | "Strong bankability indicators across all dimensions" |
| `good` | "Good" | "Positive bankability with minor gaps" |
| `medium` | "Medium" | "Moderate bankability requiring attention" |
| `risk` | "Risk" | "Elevated risk factors identified" |

### Annotation (Add as comment)

```
Implements: FIGMA_BANKABILITY_AUTHORITY_SCHEMA.md
Task ID: m9Q86N72eYggNfWch4qnNL
No semantic changes permitted
```

---

## Component #2: BF/ContractSecurityBadge

**Location:** Page `03 — Domain Components`

### Variants

| Property | Values |
|----------|--------|
| `grade` | `GC1`, `GC2`, `GC3`, `GC4` |
| `layout` | `inline`, `stacked` |
| `context` | `grower`, `developer`, `lender`, `export` |

### Layer Structure

```
BF/ContractSecurityBadge
├── Title (Text) → "Contract security"
├── Grade (Text) → "GC2 — Indicative"
└── Description (Text) → "Medium-term contracted"
```

### Grade Defaults (Locked Copy)

| Grade | Label |
|-------|-------|
| `GC1` | "Binding, long-term offtake" |
| `GC2` | "Medium-term contracted" |
| `GC3` | "Short-term/rolling" |
| `GC4` | "No contractual security" |

### Typography

Same as BankabilityScoreBadge

### Max Width

120px (fits in table cell)

---

## Component #3: BF/TechnologyReadinessIndicator

**Location:** Page `03 — Domain Components`

### Variants

| Property | Values |
|----------|--------|
| `level` | `TR1`, `TR2`, `TR3`, `TR4` |
| `presentation` | `badge`, `row` |
| `context` | `grower`, `developer`, `lender`, `export` |

### Layer Structure

```
BF/TechnologyReadinessIndicator
├── Label (Text) → "Technology readiness"
├── Level (Text) → "TR2 — Demonstrated"
└── SupportingText (Text) → Optional
```

### Level Defaults

| Level | Text |
|-------|------|
| `TR1` | "Proven at scale" |
| `TR2` | "Demonstrated" |
| `TR3` | "Validated" |
| `TR4` | "Early stage" |

### ⚠️ Export Context

Must use WHITE background (not dark theme from Nano Banana)

---

## Component #4: BF/CarbonIntensityRating

**Location:** Page `03 — Domain Components`

### Variants

| Property | Values |
|----------|--------|
| `rating` | `CI-A`, `CI-B`, `CI-C`, `CI-D` |
| `showExplanation` | `true`, `false` |
| `context` | `grower`, `developer`, `lender`, `export` |

### Layer Structure

```
BF/CarbonIntensityRating
├── Label (Text) → "Carbon intensity"
├── Rating (Text) → "CI-B — Low intensity"
└── Explanation (Text) → Optional
```

### Rating Defaults

| Rating | Band Text |
|--------|-----------|
| `CI-A` | "Very low intensity" |
| `CI-B` | "Low intensity" |
| `CI-C` | "Moderate intensity" |
| `CI-D` | "High intensity" |

---

## Component #5: BF/ConfidenceIndicator

**Location:** Page `03 — Domain Components`

### Variants

| Property | Values |
|----------|--------|
| `level` | `high`, `medium`, `low` |
| `display` | `chip`, `inline`, `block` |
| `context` | `grower`, `developer`, `lender`, `export` |

### Layer Structure (Block)

```
BF/ConfidenceIndicator
├── Label (Text) → "Confidence"
├── Level (Text) → "High"
└── Basis (Text) → "Evidence complete & recent"
```

### Layer Structure (Chip)

```
BF/ConfidenceIndicator
└── ChipText (Text) → "Confidence: High"
```

### Level Defaults

| Level | Basis |
|-------|-------|
| `high` | "Evidence complete & recent" |
| `medium` | "Some gaps or aging evidence" |
| `low` | "Significant gaps or outdated" |

---

## Validation Checklist

After creating each component:

- [ ] All variants exist
- [ ] Text properties have defaults
- [ ] Export context has no grey/dark backgrounds
- [ ] Border is black for export context
- [ ] Annotation comment added
- [ ] Component is published

---

## Component #6: BF/BankabilityDriversList

**Location:** Page `03 — Domain Components`

### Variants

| Property | Values |
|----------|--------|
| `driverCount` | `1`, `2`, `3` |
| `context` | `grower`, `developer`, `lender`, `export` |

### Layer Structure

```
BF/BankabilityDriversList
├── SectionTitle (Text) → "Key drivers"
├── Driver1 (Frame)
│   ├── Marker (Text) → "+" or "•" or "—"
│   └── Label (Text) → Driver text
├── Driver2 (Frame) → Optional
└── Driver3 (Frame) → Optional
```

### Text Properties

| Property | Type | Default |
|----------|------|---------|
| `sectionTitle` | Text | "Key drivers" |
| `driver1Label` | Text | Required |
| `driver2Label` | Text | Optional |
| `driver3Label` | Text | Optional |

### Variant Properties

| Property | Type | Values |
|----------|------|--------|
| `driver1Tone` | Variant | `positive`, `neutral`, `risk` |
| `driver2Tone` | Variant | `positive`, `neutral`, `risk` |
| `driver3Tone` | Variant | `positive`, `neutral`, `risk` |

### Tone Markers

| Tone | Marker |
|------|--------|
| `positive` | "+" |
| `neutral` | "•" |
| `risk` | "—" |

### Annotation

```
Implements: FIGMA_BANKABILITY_AUTHORITY_SCHEMA.md
Task ID: ZfgBNhq4zVtiEpReW55EG9
Max 3 drivers. No numeric scoring.
```

---

## Component #7: BF/MonitoringStatusIndicator

**Location:** Page `03 — Domain Components`

### Variants

| Property | Values |
|----------|--------|
| `status` | `active`, `attention`, `issue` |
| `context` | `grower`, `developer`, `lender`, `export` |

### Layer Structure

```
BF/MonitoringStatusIndicator
├── Label (Text) → "Monitoring"
├── Status (Text) → "Active"
└── Summary (Text) → "No issues detected"
```

### Status Defaults

| Status | Summary Text |
|--------|--------------|
| `active` | "No issues detected" |
| `attention` | "Change detected — review recommended" |
| `issue` | "Issue identified — action required" |

### Typography

| Element | Font | Size | Weight | Color |
|---------|------|------|--------|-------|
| Label | Inter | 12px | Medium | `#666666` |
| Status | Inter | 16px | SemiBold | `#1A1A1A` |
| Summary | Inter | 14px | Regular | `#333333` |

### Annotation

```
Implements: FIGMA_BANKABILITY_AUTHORITY_SCHEMA.md
Task ID: n7YYdWQggxSLwemUyB5ZTw
No trend arrows. No forecasts. Explicit text required.
```

---

## Component #8: BF/ListingSummaryCard

**Location:** Page `03 — Domain Components`

### Variants

| Property | Values |
|----------|--------|
| `density` | `comfortable`, `compact` |
| `context` | `grower`, `developer`, `lender`, `export` |

### Layer Structure

```
BF/ListingSummaryCard
├── Header (Frame)
│   ├── ProjectName (Text)
│   └── RatingBadge (Instance)
├── Content (Frame)
│   ├── Location (Text)
│   ├── Feedstock (Text)
│   └── Capacity (Text)
└── Footer (Frame)
    └── Status (Text)
```

### Text Properties

| Property | Type | Required |
|----------|------|----------|
| `projectName` | Text | Yes |
| `location` | Text | No |
| `feedstock` | Text | No |
| `capacity` | Text | No |
| `status` | Text | No |

### Boolean Properties

| Property | Default |
|----------|---------|
| `showBankability` | true |
| `showConfidence` | true |
| `showCarbon` | false |

### Density Specifications

| Density | Height | Content |
|---------|--------|---------|
| `comfortable` | ~140px | All fields, full labels |
| `compact` | ~72px | Name, location, rating, status |

### Dimensions

- Card width: 360px
- Rating badge: Top-right corner

### Annotation

```
Implements: FIGMA_BANKABILITY_AUTHORITY_SCHEMA.md
Task ID: 25frGGhFLau9VqpXCaRZjf
```

---

## Component #9: Export/BankabilitySummaryBlock

**Location:** Page `03 — Domain Components`

### Variants

| Property | Values |
|----------|--------|
| `assessment` | `excellent`, `good`, `medium`, `risk` |
| `confidence` | `high`, `medium`, `low` |
| `variant` | `standard`, `government` |

### Layer Structure

```
Export/BankabilitySummaryBlock
├── Header (Text) → "Bankability Assessment"
├── Assessment (Frame)
│   ├── Label (Text) → "Assessment"
│   └── Value (Text) → "Good"
├── Confidence (Frame)
│   ├── Label (Text) → "Confidence"
│   └── Value (Text) → "High"
├── Summary (Text) → 2-3 lines
└── Drivers (Frame) → Optional
```

### Boolean Properties

| Property | Default |
|----------|---------|
| `showDrivers` | true |

### Government Variant Terminology

| Standard | Government |
|----------|------------|
| "Bankability" | "Supply assurance level" |
| "Excellent" | "High assurance" |
| "Good" | "Moderate assurance" |
| "Risk" | "Elevated concern" |

### Export Constraints

- No icons
- No colour dependency
- Must render identically in grayscale
- A4 portrait compatible
- Black border for all contexts

### Annotation

```
Implements: FIGMA_BANKABILITY_AUTHORITY_SCHEMA.md
Task ID: NfNsPS3gaDA6E5Mt5Xh7SR
Export-safe LOCKED. No visual dependencies.
```

---

## Component #10: BF/KPITile

**Location:** Page `03 — Domain Components`

### Variants

| Property | Values |
|----------|--------|
| `tone` | `neutral`, `warning`, `risk` |
| `size` | `md` (only) |
| `context` | `grower`, `developer`, `lender`, `export` |

### Layer Structure

```
BF/KPITile
├── Value (Text) → "7"
├── Label (Text) → "Projects Rated A or Above"
└── Helper (Text) → "of 16 total projects" (optional)
```

### Text Properties

| Property | Type | Required |
|----------|------|----------|
| `metricValue` | Text | Yes |
| `metricLabel` | Text | Yes |
| `helperText` | Text | No |

### Typography

| Element | Size | Weight |
|---------|------|--------|
| Value | 24px | SemiBold |
| Label | 14px | Medium |
| Helper | 12px | Regular |

### Dimensions

| Property | Value |
|----------|-------|
| Size | 160px × 100px |
| Padding | 16px |
| Gap (label-value) | 8px |

### Tone Indicators (Grayscale-Safe)

| Tone | Treatment |
|------|-----------|
| `neutral` | 1px border `#E0E0E0` |
| `warning` | 2px border `#666666` |
| `risk` | 2px border `#333333` + fill `#F5F5F5` |

### Annotation

```
Implements: FIGMA_BANKABILITY_AUTHORITY_SCHEMA.md
Task ID: GDh2ph4HVUoSD4SeVyRK2b
No trend arrows. No performance comparisons.
```

---

## Implementation Order

1. ✅ BF/BankabilityScoreBadge
2. ✅ BF/ContractSecurityBadge
3. ✅ BF/TechnologyReadinessIndicator
4. ✅ BF/CarbonIntensityRating
5. ✅ BF/ConfidenceIndicator
6. ✅ BF/BankabilityDriversList
7. ✅ BF/MonitoringStatusIndicator
8. ✅ BF/ListingSummaryCard
9. ✅ Export/BankabilitySummaryBlock
10. ✅ BF/KPITile

---

## After All Components Built

1. Lock components (Figma permissions)
2. Create page `99 — Design Authority Locked`
3. Add statement:
   ```
   Components on page 03 are authoritative
   Date: [today]
   Commit: 93d78e7
   Version: 1.0
   ```
