# Nano Banana Pro — Element Studies for Bankability Rating Framework

**Purpose:** Atomic element exploration · Reference artefacts only
**Output folder:** `/design/references/elements/`

---

## Global Prompt Header (Use Every Time)

```
You are generating atomic UI element studies for an institutional infrastructure platform.

Design constraints:
- Conservative, audit-safe enterprise style
- No gradients, shadows, or decorative elements
- Grayscale-safe, print-safe (must work in B&W)
- Calm, neutral, professional tone
- No consumer SaaS aesthetics
- No rounded corners beyond 2px
- No iconography unless functional

Output format:
- Show 3-5 variations of the same element
- Label each variation (A, B, C, etc.)
- Show at actual size (no scaling)
- White background only
```

---

## 1. Rating Taxonomy Badge Elements

### 1A. Primary Rating Badge (AAA-CCC Scale)

```
You are generating atomic UI element studies for an institutional infrastructure platform.

Design constraints:
- Conservative, audit-safe enterprise style
- No gradients, shadows, or decorative elements
- Grayscale-safe, print-safe (must work in B&W)
- Calm, neutral, professional tone
- No consumer SaaS aesthetics
- No rounded corners beyond 2px
- No iconography unless functional

Output format:
- Show 3-5 variations of the same element
- Label each variation (A, B, C, etc.)
- Show at actual size (no scaling)
- White background only

---

Generate 5 variations of a RATING BADGE element for displaying bankability ratings.

Rating scale: AAA, AA, A, BBB, BB, B, CCC

Requirements:
- Each badge shows ONE rating (e.g., "AA")
- Must include text label (the rating cannot be colour-only)
- Show all 7 ratings in each variation
- Must be legible at 24px height
- Must work when printed in black & white

Variations to explore:
A. Outlined rectangle with rating text
B. Solid background with contrasting text
C. Text-only with underline weight indicating grade
D. Horizontal bar with fill level + text
E. Simple text with grade-weight typography

Each variation must answer: "How do I show AAA vs CCC without relying on colour?"

Avoid: Traffic lights, emoji, icons, colour gradients
```

**Filename:** `Element_RatingBadge_AAA-CCC_v1.png`

---

### 1B. Rating Badge with Confidence Qualifier

```
You are generating atomic UI element studies for an institutional infrastructure platform.

Design constraints:
- Conservative, audit-safe enterprise style
- No gradients, shadows, or decorative elements
- Grayscale-safe, print-safe (must work in B&W)
- Calm, neutral, professional tone
- No consumer SaaS aesthetics
- No rounded corners beyond 2px

Generate 4 variations of a RATING BADGE WITH QUALIFIER element.

Content:
- Primary: Rating (e.g., "A")
- Secondary: Confidence qualifier (e.g., "Based on 12 verified data points")
- Tertiary: Last updated date

Layout explorations:
A. Stacked vertical (badge above, qualifier below)
B. Inline horizontal (badge left, qualifier right)
C. Badge with tooltip-style qualifier
D. Two-line compact (rating + qualifier same visual weight)

All text must be readable. No colour-only meaning.
```

**Filename:** `Element_RatingBadgeQualified_v1.png`

---

## 2. Grower Contract Security Elements (GC1-GC4)

### 2A. Contract Security Indicator

```
You are generating atomic UI element studies for an institutional infrastructure platform.

Design constraints:
- Conservative, audit-safe enterprise style
- No gradients, shadows, or decorative elements
- Grayscale-safe, print-safe (must work in B&W)
- Calm, neutral, professional tone
- No consumer SaaS aesthetics

Generate 4 variations of a CONTRACT SECURITY INDICATOR element.

Rating scale:
- GC1: Long-term contracted (>5 years)
- GC2: Medium-term contracted (2-5 years)
- GC3: Short-term/rolling (<2 years)
- GC4: Uncommitted/spot market

Requirements:
- Show all 4 grades in each variation
- Must include text label for each grade
- Must convey relative security level without colour
- Compact enough to fit in a table cell (max 120px wide)

Variations:
A. Text label with border weight indicating security
B. Horizontal progress bar (filled = more secure)
C. Numeric badge with descriptor text
D. Compact chip with grade code + short label

Question each must answer: "Is this supply locked in or at risk?"
```

**Filename:** `Element_ContractSecurity_GC1-GC4_v1.png`

---

### 2B. Contract Security in Table Context

```
You are generating atomic UI element studies for an institutional infrastructure platform.

Design constraints:
- Conservative, audit-safe enterprise style
- Grayscale-safe, print-safe
- No decorative elements

Generate 3 variations of CONTRACT SECURITY displayed within a TABLE ROW.

Table columns: Supplier Name | Contract Term | Security Grade | Volume

Show 4 example rows with GC1, GC2, GC3, GC4 ratings.

Focus on:
- How the grade integrates with other data
- Relative visual weight (should not dominate)
- Scanability when reading down the column

Variations:
A. Text-only grade in dedicated column
B. Grade badge inline with contract term
C. Grade as row background tint (subtle gray scale)
```

**Filename:** `Element_ContractSecurityTable_v1.png`

---

## 3. Technology Readiness Elements (TR1-TR4)

### 3A. Technology Readiness Indicator

```
You are generating atomic UI element studies for an institutional infrastructure platform.

Design constraints:
- Conservative, audit-safe enterprise style
- No gradients, shadows, or decorative elements
- Grayscale-safe, print-safe
- No consumer SaaS aesthetics

Generate 4 variations of a TECHNOLOGY READINESS INDICATOR element.

Rating scale:
- TR1: Proven at scale (commercial reference plants)
- TR2: Demonstrated (pilot scale, bankable)
- TR3: Validated (engineering complete, financing risk)
- TR4: Early stage (R&D, high technology risk)

Requirements:
- Each indicator shows ONE grade
- Must include descriptive text (not code only)
- Visual treatment must indicate maturity level
- Works at both 80px and 160px widths

Variations:
A. Badge with TR code + one-line descriptor
B. Horizontal maturity bar with position marker
C. Stepped indicator (4 steps, filled to current level)
D. Text-first: descriptor prominent, code secondary
```

**Filename:** `Element_TechReadiness_TR1-TR4_v1.png`

---

### 3B. Technology Readiness Comparison Strip

```
You are generating atomic UI element studies for an institutional infrastructure platform.

Design constraints:
- Conservative, audit-safe enterprise style
- Grayscale-safe, print-safe

Generate 3 variations of a TECHNOLOGY COMPARISON element showing multiple projects.

Content: Compare 3 projects on technology readiness
- Project Alpha: TR1 (Proven)
- Project Beta: TR2 (Demonstrated)
- Project Gamma: TR3 (Validated)

Layout options:
A. Vertical stack with aligned bars
B. Horizontal row with grade badges
C. Mini table format

Must clearly answer: "Which project has the lowest technology risk?"
```

**Filename:** `Element_TechReadinessComparison_v1.png`

---

## 4. Carbon Intensity Elements (CI-A to CI-D)

### 4A. Carbon Intensity Rating Badge

```
You are generating atomic UI element studies for an institutional infrastructure platform.

Design constraints:
- Conservative, audit-safe enterprise style
- No gradients, shadows, or decorative elements
- Grayscale-safe, print-safe
- No consumer SaaS aesthetics

Generate 4 variations of a CARBON INTENSITY RATING element.

Rating scale:
- CI-A: Very low carbon intensity (<20 gCO2e/MJ)
- CI-B: Low carbon intensity (20-40 gCO2e/MJ)
- CI-C: Moderate carbon intensity (40-60 gCO2e/MJ)
- CI-D: High carbon intensity (>60 gCO2e/MJ)

Requirements:
- Show rating code AND intensity range
- Must not rely on green/red colour coding
- Appropriate for inclusion in credit documentation

Variations:
A. Two-line badge (code above, range below)
B. Inline format (code: range)
C. Bar representation with numeric overlay
D. Text-heavy format (full description, code secondary)
```

**Filename:** `Element_CarbonIntensity_CI-A-D_v1.png`

---

### 4B. Carbon Intensity with Methodology Note

```
You are generating atomic UI element studies for an institutional infrastructure platform.

Design constraints:
- Conservative, audit-safe enterprise style
- Grayscale-safe, print-safe

Generate 3 variations of a CARBON INTENSITY CARD with methodology attribution.

Content:
- Rating: CI-B
- Value: 32 gCO2e/MJ
- Methodology: GREET 2024 / RED III compliant
- Boundary: Well-to-wheel
- Verified by: [Auditor name]
- As of: [Date]

Card size: 280px x 160px

Variations:
A. Stacked layout (rating top, details below)
B. Two-column layout (rating left, methodology right)
C. Dense single-column with labeled fields

Must look appropriate in an audit appendix.
```

**Filename:** `Element_CarbonIntensityCard_v1.png`

---

## 5. Score Presentation Treatments

### 5A. Text-First Score Presentation

```
You are generating atomic UI element studies for an institutional infrastructure platform.

Design constraints:
- Conservative, audit-safe enterprise style
- Grayscale-safe, print-safe
- No decorative elements

Generate 4 variations of a TEXT-FIRST SCORE PRESENTATION for overall bankability.

Content:
- Headline: "Bankability Assessment"
- Score: A (or BBB, etc.)
- Subhead: "Based on 4 component ratings"
- Components listed:
  - Contract Security: GC2
  - Technology Readiness: TR1
  - Carbon Intensity: CI-B
  - Supply Reliability: SR-A

Card size: 320px x 240px

Layout principles:
- Text and structure carry meaning, not visuals
- Score is prominent but not overwhelming
- Component breakdown is scannable

Variations:
A. Score as large text, components as list below
B. Score inline with headline, components in grid
C. Narrative format ("This project rates A because...")
D. Minimal: score + one-line summary only
```

**Filename:** `Element_ScorePresentation_textFirst_v1.png`

---

### 5B. Table-First Score Presentation

```
You are generating atomic UI element studies for an institutional infrastructure platform.

Design constraints:
- Conservative, audit-safe enterprise style
- Grayscale-safe, print-safe

Generate 3 variations of a TABLE-FIRST SCORE PRESENTATION.

Content:
| Component | Rating | Weight | Notes |
|-----------|--------|--------|-------|
| Contract Security | GC2 | 30% | Medium-term offtake |
| Technology Readiness | TR1 | 25% | Proven pathway |
| Carbon Intensity | CI-B | 25% | 32 gCO2e/MJ |
| Supply Reliability | SR-A | 20% | Multiple suppliers |
| **Overall** | **A** | 100% | |

Table size: 400px x 200px

Variations:
A. Standard table with header row
B. Compact table with merged overall row
C. Table with subtle row striping for scannability

Must look at home in a credit memo appendix.
```

**Filename:** `Element_ScorePresentation_tableFirst_v1.png`

---

## 6. Project Listing Card Elements

### 6A. ListingSummaryCard Density Variants

```
You are generating atomic UI element studies for an institutional infrastructure platform.

Design constraints:
- Conservative, audit-safe enterprise style
- No gradients, shadows, or decorative elements
- Grayscale-safe, print-safe
- No consumer SaaS aesthetics
- No rounded corners beyond 2px

Generate 5 DENSITY VARIANTS of a PROJECT LISTING CARD.

Card content (same for all):
- Project name: "Mackay Bagasse Biorefinery"
- Location: Mackay, QLD
- Feedstock: Sugarcane bagasse
- Capacity: 50 ML/year
- Overall rating: A
- Status: "Active due diligence"

Density levels:
A. Spacious (comfortable reading, card height ~140px)
B. Standard (balanced, card height ~100px)
C. Compact (information-dense, card height ~72px)
D. Minimal (name + rating only, card height ~48px)
E. Table row (inline, single row height ~36px)

For each density:
- What information is shown?
- What is hidden or truncated?
- Can you still identify the project at a glance?

Card width: 360px for all variants
```

**Filename:** `Element_ListingSummaryCard_densityVariants_v1.png`

---

### 6B. ListingSummaryCard Rating Badge Placement

```
You are generating atomic UI element studies for an institutional infrastructure platform.

Design constraints:
- Conservative, audit-safe enterprise style
- Grayscale-safe, print-safe

Generate 4 variations of RATING BADGE PLACEMENT within a project listing card.

Card content:
- Project: "Hunter Valley Straw-to-SAF"
- Rating: BBB
- Location: Singleton, NSW
- Capacity: 30 ML/year

Card size: 360px x 100px

Placement options:
A. Rating badge top-right corner
B. Rating badge inline with project name
C. Rating badge bottom-left with other metadata
D. Rating as prominent left element, content right

Question: Where should the eye go first - project name or rating?
```

**Filename:** `Element_ListingSummaryCard_badgePlacement_v1.png`

---

## 7. KPI Tile Refinements

### 7A. KPI Tile Typography & Spacing

```
You are generating atomic UI element studies for an institutional infrastructure platform.

Design constraints:
- Conservative, audit-safe enterprise style
- Grayscale-safe, print-safe
- No decorative elements

Generate 4 typography and spacing variations of a KPI TILE.

Content:
- Label: "Projects Rated A or Above"
- Value: "7"
- Subtext: "of 16 total projects"

Tile size: 160px x 100px

Variations exploring:
A. Large value (32px), small label (12px)
B. Balanced sizing (value 24px, label 14px)
C. Label-first (label prominent, value secondary)
D. Inline format (label and value on same line)

Spacing exploration:
- Padding: 12px vs 16px vs 20px
- Vertical alignment: top vs center
- Label-value gap: 4px vs 8px vs 12px
```

**Filename:** `Element_KPITile_typographySpacing_v1.png`

---

### 7B. KPI Tile Set (3-Tile Layout)

```
You are generating atomic UI element studies for an institutional infrastructure platform.

Design constraints:
- Conservative, audit-safe enterprise style
- Grayscale-safe, print-safe

Generate 3 variations of a 3-TILE KPI ROW layout.

Content:
- Tile 1: "16" projects assessed
- Tile 2: "7" rated A or above
- Tile 3: "2.4 GL" total verified capacity

Row width: 520px
Tile arrangement: Horizontal, equal width

Variations:
A. Separated tiles (8px gap, visible borders)
B. Connected tiles (no gap, shared borders)
C. Borderless tiles (whitespace separation only)

Focus on:
- Visual rhythm
- Scannability of the three values
- Appropriate visual weight (these are summary stats, not calls to action)
```

**Filename:** `Element_KPITileSet_3tile_v1.png`

---

## 8. Evidence Progress Elements

### 8A. EvidenceProgressCard Expiry States

```
You are generating atomic UI element studies for an institutional infrastructure platform.

Design constraints:
- Conservative, audit-safe enterprise style
- No gradients, shadows, or decorative elements
- Grayscale-safe, print-safe
- No colour-only status indicators

Generate 4 variations of an EVIDENCE PROGRESS CARD showing different expiry states.

States to show:
- Current (expires in 8 months) - normal
- Expiring soon (expires in 45 days) - warning
- Expired (30 days ago) - alert
- Never expires (perpetual) - neutral

Card content:
- Evidence type: "Feedstock Supply Agreement"
- Status: [varies]
- Expiry date: [varies]
- Action: "View document" or "Upload renewal"

Card size: 300px x 80px

Each state must be distinguishable in grayscale.
Use: typography weight, border weight, fill patterns, text labels.
Do NOT use: colour alone, icons alone.
```

**Filename:** `Element_EvidenceProgressCard_expiryStates_v1.png`

---

### 8B. EvidenceProgressCard Density Variants

```
You are generating atomic UI element studies for an institutional infrastructure platform.

Design constraints:
- Conservative, audit-safe enterprise style
- Grayscale-safe, print-safe

Generate 3 DENSITY VARIANTS of an evidence progress card.

Content:
- Evidence type: "Environmental Approval"
- Issuing body: "QLD EPA"
- Status: Current
- Expiry: 15 March 2026
- Last verified: 3 days ago

Densities:
A. Expanded (all fields visible, ~100px height)
B. Standard (key fields, ~64px height)
C. Compact (type + status only, ~40px height)

Width: 280px for all

Question: What's the minimum information needed to assess evidence health?
```

**Filename:** `Element_EvidenceProgressCard_densityVariants_v1.png`

---

## 9. Project Assessment Matrix Elements

### 9A. Matrix Cell Treatments

```
You are generating atomic UI element studies for an institutional infrastructure platform.

Design constraints:
- Conservative, audit-safe enterprise style
- Grayscale-safe, print-safe
- Must work in a dense table context

Generate 4 variations of MATRIX CELLS for a project assessment table.

Table structure:
| Project | Overall | GC | TR | CI |
|---------|---------|----|----|-----|
| Project A | A | GC1 | TR2 | CI-B |

Cell size: ~60px x 32px

Variations for the rating cells:
A. Text only (e.g., "GC1")
B. Badge style (text in light border)
C. Fill variation (darker fill = better rating)
D. Text with subtle background tint

Must be legible when table has 16+ rows.
Must not create visual noise when scanning.
```

**Filename:** `Element_MatrixCell_ratingTreatments_v1.png`

---

### 9B. Matrix Row Highlight States

```
You are generating atomic UI element studies for an institutional infrastructure platform.

Design constraints:
- Conservative, audit-safe enterprise style
- Grayscale-safe, print-safe

Generate 3 variations of MATRIX ROW STATES.

Show a 4-row section of an assessment matrix:
- Row 1: Normal state
- Row 2: Hover/selected state
- Row 3: Flagged for review state
- Row 4: Normal state

Columns: Project | Overall | Contract | Tech | Carbon | Status

Variations:
A. Row states via background shade only
B. Row states via left border accent
C. Row states via typography weight changes

No colour. Grayscale differentiation only.
```

**Filename:** `Element_MatrixRow_highlightStates_v1.png`

---

## Element Validation Checklist

Before keeping any generated element, verify:

### Authority Checks
- [ ] Maps 1:1 to an approved component or variant?
- [ ] Changes only presentation, not meaning?
- [ ] Could survive an audit screenshot?

### Institutional Tone Checks
- [ ] Would look normal in a credit memo?
- [ ] Acceptable in a government appendix?
- [ ] Makes sense printed in black & white?

### Cognitive Load Checks
- [ ] User understands in 3 seconds?
- [ ] Exactly one clear action (if any)?
- [ ] Shows status, not performance theatre?

**If any check fails → discard or revise.**

---

## File Naming Convention

```
Element_[ComponentName]_[Variant]_v[N].png
```

Examples:
```
Element_RatingBadge_AAA-CCC_v1.png
Element_ListingSummaryCard_densityA_v2.png
Element_EvidenceProgressCard_expiryStates_v1.png
Element_ScorePresentation_textFirst_v3.png
Element_KPITile_typographySpacing_v1.png
Element_ContractSecurity_GC1-GC4_v1.png
```

---

## Storage Location

```
/design/references/elements/
```

**Do NOT store in:**
- `/final`
- `/handoff`
- `/design-system`

These are reference artefacts only.

---

## Rationalisation Process (After ~15 Elements)

### Step A: Select Winners
For each element type, pick ONE winning variation:
- Archive alternatives
- Write one sentence: "Selected because [reason]"

### Step B: Light Annotation
Add comment to winner:
```
Component: Domain/RatingBadge
Variant: outlined
Props: rating, showQualifier
Density: standard
Notes: No new props introduced
```

---

## Assembly Sequence (Only After Elements Stabilise)

1. **Grower Dashboard** — Checklist-driven, most user-facing
2. **Deal Room** — Shared workspace, role-neutral
3. **Contracted Overview** — Read-only, status-focused
4. **Lender View** — Assurance-dense, audit-ready

Do not assemble until element decisions are final.

---

## Warning: Polish Creep

Reject any element that includes:
- Rounded corners > 2px
- Drop shadows
- Gradient fills
- Decorative icons
- Animation suggestions
- "Nice" but not "inevitable" styling

Institutional design should feel obvious, not impressive.
