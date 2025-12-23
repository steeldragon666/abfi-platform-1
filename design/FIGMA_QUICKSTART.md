# Figma Component Build Quickstart

## Target File
- **File Key:** `Z3htI9lFecgDFrEb4S6Qn2`
- **URL:** https://www.figma.com/design/Z3htI9lFecgDFrEb4S6Qn2

## Step 1: Create Pages

Create these pages in order:
1. `00 — Element Studies (Reference Only)`
2. `01 — Tokens & Variables`
3. `02 — UI Components`
4. `03 — Domain Components (BF)`
5. `99 — Design Authority Locked`

## Step 2: Import SVG References

On page `00 — Element Studies`, import SVGs from `design/figma-import/`:
- `BF-BankabilityScoreBadge.svg`
- `BF-ContractSecurityBadge.svg`
- `BF-TechnologyReadinessIndicator.svg`
- `BF-CarbonIntensityRating.svg`
- `BF-ConfidenceIndicator-chip.svg`
- `BF-ConfidenceIndicator-block.svg`
- `BF-BankabilityDriversList.svg`
- `BF-MonitoringStatusIndicator.svg`
- `BF-ListingSummaryCard.svg`
- `BF-KPITile.svg`
- `BF-KPITile-3up.svg`
- `Export-BankabilitySummaryBlock.svg`

## Step 3: Setup Design Tokens (Page 01)

### Colors
| Token | Value |
|-------|-------|
| neutral.0 | #FFFFFF |
| neutral.50 | #F9F9F9 |
| neutral.100 | #F0F0F0 |
| neutral.200 | #E0E0E0 |
| neutral.500 | #666666 |
| neutral.600 | #333333 |
| neutral.900 | #1A1A1A |
| status.success | #22C55E |
| status.warning | #F59E0B |
| status.risk | #EF4444 |

### Typography
- **Font:** Inter
- **Label:** 12px / 500 weight
- **Grade:** 18px / 600 weight
- **Descriptor:** 14px / 400 weight

## Step 4: Build Components (Page 03)

### Component 1: BF/BankabilityScoreBadge
**Variants:**
- `grade`: excellent | good | medium | risk
- `size`: sm | md
- `context`: grower | developer | lender | export

**Properties:**
- `label` (text): "Bankability"
- `gradeText` (text): "Good"
- `descriptor` (text): "Positive bankability with minor gaps"
- `showDescriptor` (boolean): true

### Component 2: BF/ContractSecurityBadge
**Variants:**
- `grade`: GC1 | GC2 | GC3 | GC4
- `layout`: inline | stacked

### Component 3: BF/TechnologyReadinessIndicator
**Variants:**
- `level`: TR1 | TR2 | TR3 | TR4
- `presentation`: badge | row

### Component 4: BF/CarbonIntensityRating
**Variants:**
- `rating`: CI-A | CI-B | CI-C | CI-D
- `showExplanation`: true | false

### Component 5: BF/ConfidenceIndicator
**Variants:**
- `level`: high | medium | low
- `display`: chip | inline | block

### Component 6: BF/BankabilityDriversList
**Variants:**
- `driverCount`: 1 | 2 | 3

### Component 7: BF/MonitoringStatusIndicator
**Variants:**
- `status`: active | attention | issue

### Component 8: BF/ListingSummaryCard
**Variants:**
- `density`: comfortable | compact

### Component 9: Export/BankabilitySummaryBlock
**Variants:**
- `assessment`: excellent | good | medium | risk
- `confidence`: high | medium | low
- `variant`: standard | government

### Component 10: BF/KPITile
**Variants:**
- `tone`: neutral | warning | risk

## Full Documentation

See these files for complete specs:
- `FIGMA_BUILD_INSTRUCTIONS.md` - Detailed build steps
- `FIGMA_REDESIGN_README.md` - Design system overview
- `design/references/elements/AUDIT_*.md` - Component audits
- `design/figma-import/IMPORT_MANIFEST.json` - Machine-readable spec
