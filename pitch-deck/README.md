# KeepXtra Pitch Deck

Generates `KeepXtra-Pitch-Deck.pdf` — a 12-slide investor deck — from code
(`generate-pitch-deck.js`), using [pdfkit](https://pdfkit.org/). There's no
design file to open; everything (text, numbers, colors, charts) lives in the
script.

> **Data integrity:** the deck is intentionally conservative — the company is
> pre-launch, so there are no fabricated traction figures. Statistics carry a
> visible source (FAO SDG 12.3.1 for food loss; UN World Population Prospects for
> demographics). Keep it that way when editing.

## Setup (one-time)

```
cd pitch-deck
npm install
```

## Regenerate the PDF

```
npm run build
```

This overwrites `KeepXtra-Pitch-Deck.pdf` in this folder.

## Making edits

Open `generate-pitch-deck.js`. It's organized top to bottom as:

1. **Palette** (`const C = {...}`) — brand colors. All green/gold, matches the live site.
2. **Chrome helpers** — `header()`, `footer()`, `brandMark()` etc. Shared layout used by every slide.
3. **Chart helpers** — `meterCard()`, `trendCard()`, `pillarCard()`, `timeline()`, `donutChart()`, etc. Reusable building blocks.
4. **Data** — one `const` array per slide's content (`team`, `roadmap`, `useOfFunds`, `problemMetrics`, ...). **Most edits happen here** — change a name, number, or description without touching layout code.
5. **Slides** — one block per slide (`// 1. Cover`, `// 2. At a Glance`, ...) that calls the helpers above with the data.

Common edits:
- **Change a number/name/description** → edit the relevant array in the Data section.
- **Change the funding ask** → slide 14 ("The Ask") block, and the `useOfFunds` array for the donut chart split.
- **Change colors** → the `C` palette object at the top; every slide references it, nothing is hardcoded per-slide.
- **Add/remove a slide** → copy an existing `{ newSlide(); ... }` block, update `TOTAL_PAGES` at the top to match the new slide count.

After editing, run `npm run build` again and open the PDF to check it.

## Notes

- Fonts are borrowed from the main site's `@fontsource/inter` package (in
  `../node_modules`) — no font files are duplicated here. Run `npm install`
  in the project root first if that folder is missing.
- `fillColor()` in pdfkit does **not** accept `rgba(...)` strings — it silently
  keeps whatever color was last set instead of erroring. For transparency use
  `.fillColor(hex).fillOpacity(0.1)` and reset `fillOpacity(1)` after.
