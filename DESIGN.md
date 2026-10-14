---
name: Aangan
description: Indian property search set as a stamp-paper document; listings are deeds, verification is a violet registry seal.
colors:
  paper: "#EAEFE4"
  paper-deep: "#DCE5D5"
  sheet: "#F8FAF4"
  ink: "#1B241F"
  ink-soft: "#4A564E"
  ink-faint: "#626E65"
  stamp: "#2F5D3A"
  stamp-light: "#97B798"
  stamp-dark: "#1E3F27"
  seal: "#5B2D8E"
  seal-dark: "#461F70"
  seal-wash: "#EEE7F6"
  rule: "#C4D2BE"
  danger: "#A82C24"
typography:
  display:
    fontFamily: "Rozha One, Georgia, serif"
    fontSize: "clamp(44px, 6vw, 76px)"
    fontWeight: 400
    lineHeight: 0.98
    letterSpacing: "-0.015em"
  heading:
    fontFamily: "Rozha One, Georgia, serif"
    fontSize: "34px"
    fontWeight: 400
    lineHeight: 1.1
  price:
    fontFamily: "Rozha One, Georgia, serif"
    fontSize: "26px"
    fontWeight: 400
    lineHeight: 1
  body:
    fontFamily: "Hind, ui-sans-serif, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Hind, ui-sans-serif, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 600
    letterSpacing: "0.12em"
  typed:
    fontFamily: "Courier Prime, ui-monospace, monospace"
    fontSize: "13px"
    fontWeight: 400
rounded:
  sheet: "3px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "40px"
  section: "64px"
components:
  button-primary:
    backgroundColor: "{colors.seal}"
    textColor: "{colors.sheet}"
    rounded: "{rounded.sheet}"
    padding: "10px 20px"
  button-primary-hover:
    backgroundColor: "{colors.seal-dark}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.sheet}"
    padding: "10px 20px"
  button-secondary-hover:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.sheet}"
  chip:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink-soft}"
    rounded: "{rounded.sheet}"
    padding: "6px 12px"
  chip-selected:
    backgroundColor: "{colors.seal-wash}"
    textColor: "{colors.seal-dark}"
  sheet:
    backgroundColor: "{colors.sheet}"
    rounded: "{rounded.sheet}"
  input-line:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    padding: "8px 0"
---

# Design System: Aangan

## Overview

**Creative North Star: "The Stamp-Paper Register"**

Aangan borrows the visual grammar Indian households already trust with property: non-judicial stamp paper, sale deeds and the sub-registrar's violet seal. The page ground is pale stamp-paper green; content sits on sheets framed by guilloche line-work; facts are typed into ruled schedules; verification is a stamped seal, never a badge pill.

The world carries the page without costuming it. Display type and ornament live at the edges (headings, prices, frames); every working control is set in a calm Hind sans so search, filters, forms and dashboards stay fast to scan.

**Key Characteristics:**
- Pale green paper ground, near-white sheets, deed-black ink.
- Guilloche bands, rosettes and double hairline rules as the only ornament, all generated SVG.
- Registry violet reserved for the primary action, the seal, and selection.
- Prices as denominations: figures in Rozha One, rupees in words in a typewriter face.
- Tabular numerals wherever numbers line up.

## Colors

Two inks on paper. Green structures the page; violet marks what is certified or actionable.

### Primary
- **Registry Violet** (`seal`): primary buttons, the verified seal, selected chips, active nav underline, focus ring. `seal-dark` for hover; `seal-wash` for selected fills and highlighted options.

### Secondary
- **Stamp Green** (`stamp`): guilloche line-work, map pins, structural accents. `stamp-dark` grounds the footer and the lister band; `stamp-light` for hover borders only.

### Neutral
- **Paper** (`paper`) is the page ground; **Sheet** (`sheet`) is every document surface; **Paper Deep** (`paper-deep`) is recessed bands and skeletons. **Rule** draws hairlines.
- **Ink** for text, **Ink Soft** for secondary text, **Ink Faint** for meta text (kept at or above 4.5:1 on Sheet).
- **Danger** for validation and destructive actions only.

### Named Rules
**The Two-Ink Rule.** A region uses black ink plus one colour (green or violet). Never stack badge colours; status is told with an outlined pill in the region's ink.

**The Seal Is Earned Rule.** Violet seals appear only for moderator-verified listings and for confirmations of a completed action (enquiry sent, listing received, no record found).

## Typography

**Display Font:** Rozha One (fallback Georgia)
**Body Font:** Hind (Indian Type Foundry)
**Typed Font:** Courier Prime, only for registration refs and rupees-in-words.

### Hierarchy
- **Display** (Rozha One, 44 to 76px, 0.98): the home sheet headline only.
- **Heading** (Rozha One, 28 to 44px): page and section titles, listing titles on the detail page.
- **Price** (Rozha One, 26px on cards, 48 to 56px as the detail denomination), tabular.
- **Body** (Hind 15px, 1.55): all prose, controls and data; 17px for lead paragraphs.
- **Label** (Hind 11px, 600, 0.12em tracking, uppercase): form field labels and schedule keys.
- **Typed** (Courier Prime 11 to 13px): `AAN-XXXXXXXX` refs and "Rupees ... only".

### Named Rules
**The Field Label Rule.** Uppercase tracked labels name a form field or schedule column. They never sit above a heading as a kicker.

## Layout

Content width caps at 1240px with 16/24/32px gutters. The home page opens on one wide sheet inside a guilloche frame; below it sections alternate between the paper ground, a recessed `paper-deep` band (city register) and the `stamp-dark` lister band. Search is a 300px filter rail, a results column, and an optional sticky map. Dashboards use a 200px side index that becomes a horizontal tab strip under `lg`. Lists are ruled rows (ink rule on top, hairlines between), not cards, wherever the content is a register.

## Elevation & Depth

Paper lies flat. Depth is one soft drop under a sheet, plus a hairline.

### Shadow Vocabulary
- `sheet`: `0 1px 0 rule, 0 18px 40px -24px ink/35%` for resting documents.
- `lift`: `0 2px 0 rule, 0 22px 44px -22px ink/40%` for hover, menus and the selected listing.

## Shapes

Corners are a cut-paper 3px everywhere; only avatars and seals are round. Borders are 1px hairlines; the denomination uses a 3px double rule. Photo plates sit square in their frames; the home footage is mounted with corner marks and a 1.5deg tilt.

## Components

### Buttons
- **Primary (`btn-seal`):** violet fill, sheet text, 3px corners, 10/20 padding, darkens on hover, nudges 1px on press.
- **Secondary (`btn-ink`):** ink outline that inverts to an ink fill on hover.
- **Quiet (`btn-quiet`):** text button with a `paper-deep` hover wash for tertiary actions.

### Chips
Outlined `sheet` chips for filters and choices; selected state is violet outline, `seal-wash` fill, `seal-dark` text, driven by `aria-pressed` / `aria-checked`.

### Cards / Containers
- **Sheet:** the base document surface (`sheet` + hairline + `sheet` shadow).
- **Listing slip:** photo plate with an ink listing-type tag, then ref + seal mark, price, title as a stretched link, location, a dashed rule and a tabular spec line. Missing photos show a stamp-green rosette with "Photos awaited".

### Inputs / Fields
- **Ruled line (`input-line`):** text typed onto a bottom rule, darkening on hover and turning violet on focus; errors turn the rule red with a message below.
- **Boxed (`input-box`):** for textareas and selects, hairline box with a violet focus ring.

### Navigation
Sticky paper header with the courtyard-plan mark and Rozha wordmark; listing-type links with a 2px violet underline for the active type; account menu in a sheet.

### Registry Seal (signature)
Generated SVG: double outer ring, text on a circular path, Rozha centre word, an fractal-noise ink mask so it never looks vector-perfect, a slight tilt, and a one-time stamp-down entrance (`stampIn`, 520ms ease-out). `SealMark` is the 16px inline form for cards.

## Do's and Don'ts

### Do:
- **Do** set prices with `formatListingPrice` and show rupees in words on the detail denomination.
- **Do** use tabular numerals for prices, areas, counts and refs.
- **Do** keep ornament to generated guilloche, rules and the seal.
- **Do** tell status with outlined pills in ink, green or violet.

### Don't:
- **Don't** use emoji, cartoon illustrations or icon tiles as decoration; lucide icons appear only inside controls at 16 to 20px.
- **Don't** add glass, gradients or full-bleed video backgrounds.
- **Don't** place uppercase kickers above headings.
- **Don't** show the seal on anything a moderator hasn't verified.
- **Don't** invent figures; the home schedule and city counts are owner-approved placeholders until real stats replace them.
