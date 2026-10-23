# Data & Claims Validation Plan

**Purpose:** Every quantitative claim on the public site (and in the pitch deck) must be
**accurate, sourced, current, and consistent**. This document is the working plan and
single source of truth for tracking that.

**Status:** Draft — inventory complete, verification pending.

---

## 1. Principles

1. **No unsourced number ships.** Every figure is either (a) backed by a primary source we
   can cite, (b) pulled from our own operating records, or (c) explicitly labelled as a
   target/projection.
2. **One number, one definition.** A metric means the same thing everywhere (site, deck,
   dashboard).
3. **Geography & year are part of the claim.** "Africa" ≠ "Ghana" ≠ "sub-Saharan Africa";
   a 2011 figure is not a 2025 figure.
4. **Forward-looking claims are labelled** as projections/targets, not presented as fact.
5. **Citations are visible** to the reader (footnote/asterisk + a `/sources` page or tooltip).

---

## 2. Claim inventory

### A. Company traction & capability

> **Baseline (2026-10): company is pre-launch — all traction metrics are set to 0.**
> Replace with verified operating data once available; never show aspirational numbers as actuals.

| Claim | Value shown | Location |
|---|---|---|
| Tonnes of food saved from waste | **0** | `src/data/impactStats.ts` → `sections/about/AboutImpact.tsx` |
| Farmers supported | **0** | `src/data/impactStats.ts` → `sections/about/AboutImpact.tsx` |
| Businesses served | **0** | `src/data/impactStats.ts` → `sections/about/AboutImpact.tsx` |
| Deliveries completed | **0** | `src/data/impactStats.ts` → `sections/about/AboutImpact.tsx` |
| Avoidable loss **goal** | ~0% (goal) | `sections/home/Hero.tsx` |
| Telemetry cold monitoring | 24/7 | `sections/home/Hero.tsx` |
| Quality pipeline steps | 8-Step | `sections/home/Hero.tsx` |
| Farmer traction stat | **removed** | `sections/home/Hero.tsx` |
| "54 markets" stat | **removed** | `sections/home/InvestorHighlight.tsx` |
| Total continental food market | $300B+ | `sections/home/InvestorHighlight.tsx` |
| Connected platform | 1 | `sections/home/InvestorHighlight.tsx` |

> Note: the hero "Live Cold-Hub" panel shows illustrative samples (Route #14, Batch #892,
> "Updated just now") — review whether this implies operations that haven't happened yet.

### B. Market & problem sizing (external research required)

| Claim | Value shown | Location |
|---|---|---|
| Harvested produce lost before buyer | 40% | `src/data/problemMetrics.ts`; also hard-coded in `sections/home/ProblemStats.tsx` |
| Supply-chain cost lost to logistics | 35% | `src/data/problemMetrics.ts` |
| Potential farmer income lost | 30% | `src/data/problemMetrics.ts` |
| Buyers reporting supply shortages | 60% | `src/data/problemMetrics.ts` |
| Addressable market | $4B+ | `src/data/marketOpportunity.ts` |
| Food & beverage sector growth | +6%/yr | `src/data/marketOpportunity.ts` |
| Urban population by 2035 | 68% | `src/data/marketOpportunity.ts` |
| Population growth by 2050 | ~2x | `src/data/marketOpportunity.ts` |
| Continental food market | $300B+ | `sections/home/InvestorHighlight.tsx` |

### C. Strategy & plan (internal — validate realism/consistency)

- `src/data/investorRoadmap.ts` — 2026 Launch → 2027 Regional → 2028 National → 2029 West Africa
- `src/data/businessModel.ts` — 5 revenue streams
- `src/data/growthStrategy.ts` — 4 growth steps
- `src/data/investorImpact.ts` — ESG/food security claims ("governance built in from day one" must be true)

### D. People & social proof (consent + accuracy)

- `src/data/team.ts` + `public/team/*.jpg` — names, titles, bios (consent + accuracy)
- `src/data/testimonials.ts` — customer quotes (written permission + verbatim accuracy)
- `src/data/trustLogos.ts` — partner logos (trademark/logo usage permission)
- `src/data/blogPosts.ts` — any factual statements within posts

### E. Documents & assets

- `public/KeepXtra-Pitch-Deck.pdf` — **must match the site's figures**
- `public/images/segments/CREDITS.md` — image licensing (verify each image's licence)

---

## 3. Inconsistencies — RESOLVED (2026-10-23)

1. ✅ **Farmers count**: canonical figure is **100+**. `impactStats` updated 1,200+ → 100+
   ("Farmers supported"); Hero relabelled "Farmers Supported".
2. ✅ **"54 markets"**: removed from the homepage (ambiguous footprint vs. ambition).
3. ✅ **Market scope**: `$4B+` relabelled **"Fresh-Produce Market"** (serviceable) and `$300B+`
   relabelled **"Total continental food market"** so the two are not conflated.
4. ✅ **"0% avoidable loss"**: now shown as **"~0% — Avoidable Loss Goal"** (a target, not a result).

Remaining external figures still need sourcing — see §2B and §6.

---

## 4. Validation workflow (per claim)

1. **Classify** the claim: internal metric · external statistic · projection · qualitative.
2. **Internal metrics** → pull from the source system (DB/ops records); define the formula,
   date range, and geography; get sign-off from the operations owner.
3. **External statistics** → find a *primary* source (see §6); record the exact figure,
   definition, geographic scope, year, URL, and the quoted sentence. Prefer the most recent
   edition; note if it's "Africa" vs "Ghana".
4. **Projections** → label as such; record base year + source.
5. **Qualitative / social proof** → verify truthfulness, obtain consent/permissions.
6. **Record provenance** in the registry (§5).
7. **Update copy** and align the pitch deck.
8. **Legal/compliance review** before publish (advertising standards + any securities rules
   for investor statements).
9. **Set a review cadence** (quarterly) with an owner per claim group.

---

## 5. Provenance registry (what to record for each claim)

Create one row per claim (e.g. `src/data/CLAIMS.md` or an internal sheet):

| Field | Example |
|---|---|
| Claim text | "40% of produce is lost before reaching a buyer" |
| Value | 40% |
| Scope | Sub-Saharan Africa / Ghana |
| Year of data | 2023 |
| Source title | African Postharvest Losses Information System (APHLIS) |
| Source URL | https://www.aphlis.net |
| Exact quote | "…" |
| Definition | Post-harvest loss, on-farm to retail |
| Status | Verified / Needs update / Unverified / Remove |
| Owner | Name |
| Last reviewed | 2026-10 |

---

## 6. Resources to check (authoritative starting points)

> Use **primary** sources. Commercial market-size reports are acceptable only if you disclose
> their methodology. Always capture the exact edition/year and whether it covers Africa vs Ghana.

**Post-harvest loss / food waste**
- FAO — Food Loss & Waste: https://www.fao.org/food-loss-and-food-waste/en
- FAO — Food Loss & Waste Data portal: https://www.fao.org/food-loss-and-food-waste/flw-data
- APHLIS (African Postharvest Losses Information System): https://www.aphlis.net
- UNEP — Food Waste Index Report: https://www.unep.org/resources/publication/food-waste-index-report-2024
- WRI — Food loss & waste: https://www.wri.org/food/food-loss-and-waste

**Cold chain**
- FAO — Sustainable Food Cold Chains (2022): https://www.fao.org/documents/card/en/c/ccb0468en
- Global Cold Chain Alliance: https://www.gcca.org

**Macro / market / population (urbanisation, growth)**
- UN DESA — World Population Prospects: https://population.un.org/wpp
- UN — World Urbanization Prospects: https://population.un.org/wup
- World Bank — Data: https://data.worldbank.org
- World Bank — Africa's Pulse: https://www.worldbank.org/en/publication/africas-pulse
- African Development Bank — African Economic Outlook: https://www.afdb.org/en/knowledge/publications/african-economic-outlook
- FAO STAT: https://www.fao.org/faostat
- UN Comtrade: https://comtradeplus.un.org
- ITC Trade Map: https://www.trademap.org

**Ghana-specific**
- Ghana Statistical Service: https://statsghana.gov.gh
- Ghana Ministry of Food & Agriculture: https://mofa.gov.gh
- Ghana Commodity Exchange: https://www.gcx.com.gh

**Agriculture / development research**
- IFPRI: https://www.ifpri.org
- IFAD: https://www.ifad.org
- CGIAR: https://www.cgiar.org
- Our World in Data (aggregator, links to primaries): https://ourworldindata.org

**Commercial market sizing (disclose methodology if used)**
- Statista · Euromonitor · Grand View Research · McKinsey Agriculture — cite report, year, and how the number was derived.

---

## 7. Owners & timeline (suggested)

| Week | Focus | Owner |
|---|---|---|
| 1 | Sign off inventory; reconcile internal contradictions (§3) | Founder/COO + Ops |
| 2 | Verify external market & problem stats (§2B) | Marketing + Analyst |
| 3 | Update copy, add citations, align pitch deck | Marketing + Frontend |
| 4 | Legal/compliance review, publish, set cadence | Legal + Founder |

**RACI (summary):** Founder/COO = accountable · Ops/Finance = internal metrics · Marketing = copy &
citations · Legal = claims review · Frontend = implement citation UI.

---

## 8. Definition of done

- [ ] Every number in §2 has a registry row with a source (or has been removed/relabelled).
- [ ] The four inconsistencies in §3 are resolved.
- [ ] Site and pitch deck show identical figures.
- [ ] Citations are visible on the site (footnote/asterisk + `/sources` page).
- [ ] Legal/compliance sign-off recorded.
- [ ] Quarterly review owner and date set.
