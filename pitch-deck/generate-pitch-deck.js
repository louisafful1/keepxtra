/*
 * KeepXtra — Investor Deck generator (pdfkit)
 * ------------------------------------------------------------
 * Redesigned for credibility + clarity:
 *  - No fabricated traction numbers (company is pre-launch).
 *  - Every statistic carries a visible source.
 *  - Restrained, editorial layout (consistent grid, strong type).
 *
 * Run:  npm run build   (from /pitch-deck)
 */
const PDFDocument = require('pdfkit')
const fs = require('fs')
const path = require('path')

const FONT_DIR = path.join(__dirname, '..', 'frontend', 'node_modules', '@fontsource', 'inter', 'files')
const OUT_PATH = path.join(__dirname, 'KeepXtra-Pitch-Deck.pdf')
const PUBLIC_PATH = path.join(__dirname, '..', 'frontend', 'public', 'KeepXtra-Pitch-Deck.pdf')

// ---------- geometry ----------
const W = 960
const H = 540
const MARGIN = 64
const CONTENT_W = W - MARGIN * 2

// ---------- palette ----------
const C = {
  bg: '#FFFFFF',
  tint: '#F7FCF9',
  ink: '#0F172A',
  slate600: '#475569',
  slate500: '#64748B',
  slate400: '#94A3B8',
  slate200: '#E2E8F0',
  slate100: '#F1F5F9',
  green900: '#052E16',
  green800: '#14532D',
  green700: '#166534',
  green600: '#15803D',
  green500: '#16A34A',
  green300: '#86EFAC',
  green200: '#BBF7D0',
  green100: '#DCFCE7',
  green50: '#F0FDF4',
  orange: '#F97316',
  white: '#FFFFFF',
}

const doc = new PDFDocument({
  size: [W, H],
  margin: 0,
  info: {
    Title: 'KeepXtra — Investor Deck',
    Author: 'KeepXtra',
    Subject: "Cold-chain infrastructure for Africa's fresh food",
  },
})
const outStream = fs.createWriteStream(OUT_PATH)
doc.pipe(outStream)

doc.registerFont('Regular', `${FONT_DIR}/inter-latin-400-normal.woff`)
doc.registerFont('Medium', `${FONT_DIR}/inter-latin-500-normal.woff`)
doc.registerFont('SemiBold', `${FONT_DIR}/inter-latin-600-normal.woff`)
doc.registerFont('Bold', `${FONT_DIR}/inter-latin-700-normal.woff`)

let pageNum = 0
const TOTAL_PAGES = 12

// ---------- primitives ----------
function newSlide(bg = C.bg) {
  if (pageNum > 0) doc.addPage()
  pageNum += 1
  doc.rect(0, 0, W, H).fillColor(bg).fill()
}

function brandMark(x, y, { size = 17, dark = false } = {}) {
  const base = dark ? C.white : C.green700
  doc.font('SemiBold').fontSize(size * 0.72)
  doc.fillColor(base).text('Keep', x, y, { lineBreak: false })
  const kw = doc.widthOfString('Keep')
  doc.fillColor(C.orange).text('X', x + kw, y, { lineBreak: false })
  const xw = doc.widthOfString('X')
  doc.fillColor(base).text('tra', x + kw + xw, y, { lineBreak: false })
}

function rule(x, y, w, color = C.slate200) {
  doc.moveTo(x, y).lineTo(x + w, y).lineWidth(1).strokeColor(color).stroke()
}

function pageFooter(n, dark = false) {
  rule(MARGIN, H - 42, CONTENT_W, dark ? C.green700 : C.slate200)
  doc
    .font('Regular')
    .fontSize(8)
    .fillColor(dark ? C.green300 : C.slate400)
    .text('KeepXtra — Confidential', MARGIN, H - 33, { lineBreak: false })
  doc
    .font('Regular')
    .fontSize(8)
    .fillColor(dark ? C.green300 : C.slate400)
    .text(`${String(n).padStart(2, '0')} / ${String(TOTAL_PAGES).padStart(2, '0')}`, W - MARGIN - 60, H - 33, {
      width: 60,
      align: 'right',
      lineBreak: false,
    })
}

// Draws brand + eyebrow + title (+ optional subtitle + rule).
// Returns the Y coordinate where content may begin.
function contentHeader(eyebrowText, titleText, subtitleText) {
  brandMark(MARGIN, 40, { size: 17 })
  doc
    .font('SemiBold')
    .fontSize(9.5)
    .fillColor(C.green600)
    .text(eyebrowText.toUpperCase(), MARGIN, 78, { characterSpacing: 1.8, lineBreak: false })

  doc.font('Bold').fontSize(29).fillColor(C.green800)
  const titleH = doc.heightOfString(titleText, { width: CONTENT_W, lineGap: 2 })
  doc.text(titleText, MARGIN, 96, { width: CONTENT_W, lineGap: 2 })

  let y = 96 + titleH
  if (subtitleText) {
    doc.font('Regular').fontSize(12.5).fillColor(C.slate500)
    const subH = doc.heightOfString(subtitleText, { width: CONTENT_W - 60, lineGap: 3 })
    doc.text(subtitleText, MARGIN, y + 10, { width: CONTENT_W - 60, lineGap: 3 })
    y += 10 + subH
  }
  rule(MARGIN, y + 20, CONTENT_W)
  return y + 44
}

// ---------- components ----------
function statCard(x, y, w, h, { value, label, source }) {
  doc.roundedRect(x, y, w, h, 12).fillColor(C.green800).fill()
  doc.font('Bold').fontSize(42).fillColor(C.white).text(value, x + 22, y + 22, { width: w - 44 })
  doc.font('Medium').fontSize(11).fillColor(C.green100).text(label, x + 22, y + 82, { width: w - 44, lineGap: 3 })
  if (source) {
    doc
      .font('Regular')
      .fontSize(8)
      .fillColor(C.green300)
      .text(source, x + 22, y + h - 22, { width: w - 44, lineBreak: false })
  }
}

function lightCard(x, y, w, h, title, description) {
  doc.roundedRect(x, y, w, h, 10).fillColor(C.tint).fill()
  doc.circle(x + 22, y + 24, 5).fillColor(C.green500).fill()
  doc.font('SemiBold').fontSize(13).fillColor(C.ink).text(title, x + 18, y + 40, { width: w - 36 })
  doc.font('Regular').fontSize(10.5).fillColor(C.slate500).text(description, x + 18, y + 68, { width: w - 36, lineGap: 2.5 })
}

function challengeRow(x, y, w, { title, description }) {
  doc.rect(x, y + 2, 3, 34).fillColor(C.green500).fill()
  doc.font('SemiBold').fontSize(13).fillColor(C.ink).text(title, x + 16, y, { width: w - 16 })
  doc.font('Regular').fontSize(10.5).fillColor(C.slate500).text(description, x + 16, y + 19, { width: w - 16, lineGap: 2 })
}

function revenueRow(x, y, w, index, title, description) {
  doc.font('Bold').fontSize(11).fillColor(C.green600).text(String(index).padStart(2, '0'), x, y + 2, { lineBreak: false })
  doc.font('SemiBold').fontSize(13.5).fillColor(C.ink).text(title, x + 40, y, { width: 210 })
  doc.font('Regular').fontSize(10.5).fillColor(C.slate500).text(description, x + 270, y + 2, { width: w - 270, lineGap: 2 })
}

function processFlow(x, y, w, steps) {
  const n = steps.length
  const slotW = w / n
  const r = 20
  const lineY = y + r
  doc
    .moveTo(x + slotW / 2, lineY)
    .lineTo(x + w - slotW / 2, lineY)
    .lineWidth(1.5)
    .strokeColor(C.green200)
    .stroke()

  steps.forEach((step, i) => {
    const cx = x + slotW * i + slotW / 2
    doc.circle(cx, lineY, r).fillColor(C.white).fill()
    doc.circle(cx, lineY, r).lineWidth(2).strokeColor(C.green500).stroke()
    doc.font('Bold').fontSize(12).fillColor(C.green700)
    doc.text(String(i + 1), cx - r, lineY - 6, { width: r * 2, align: 'center', lineBreak: false })
    doc.font('SemiBold').fontSize(10).fillColor(C.ink)
    doc.text(step, cx - slotW / 2 + 4, lineY + r + 12, { width: slotW - 8, align: 'center', lineGap: 1 })
  })
}

function timeline(x, y, w, milestones) {
  const n = milestones.length
  const slotW = w / n
  const lineY = y + 20
  doc
    .moveTo(x + slotW / 2, lineY)
    .lineTo(x + w - slotW / 2, lineY)
    .lineWidth(1.5)
    .strokeColor(C.green200)
    .stroke()

  milestones.forEach((m, i) => {
    const cx = x + slotW * i + slotW / 2
    doc.circle(cx, lineY, 20).fillColor(C.white).fill()
    doc.circle(cx, lineY, 20).lineWidth(2).strokeColor(C.green600).stroke()
    doc.font('Bold').fontSize(10.5).fillColor(C.green700)
    doc.text(m.year, cx - 20, lineY - 6, { width: 40, align: 'center', lineBreak: false })
    doc.font('SemiBold').fontSize(12).fillColor(C.ink)
    doc.text(m.title, cx - slotW / 2 + 6, lineY + 32, { width: slotW - 12, align: 'center' })
    doc.font('Regular').fontSize(9).fillColor(C.slate500)
    doc.text(m.description, cx - slotW / 2 + 6, lineY + 50, { width: slotW - 12, align: 'center', lineGap: 1.5 })
  })
}

function donut(cx, cy, rOuter, rInner, segments) {
  let start = -Math.PI / 2
  const total = segments.reduce((s, seg) => s + seg.value, 0)
  segments.forEach((seg) => {
    const end = start + (seg.value / total) * Math.PI * 2
    doc.path(arcPath(cx, cy, rOuter, rInner, start, end)).fillColor(seg.color).fill()
    start = end
  })
}

function arcPath(cx, cy, rOuter, rInner, start, end) {
  const steps = 48
  const outer = []
  const inner = []
  for (let i = 0; i <= steps; i++) {
    const a = start + ((end - start) * i) / steps
    outer.push([cx + rOuter * Math.cos(a), cy + rOuter * Math.sin(a)])
  }
  for (let i = steps; i >= 0; i--) {
    const a = start + ((end - start) * i) / steps
    inner.push([cx + rInner * Math.cos(a), cy + rInner * Math.sin(a)])
  }
  const pts = outer.concat(inner)
  let d = `M ${pts[0][0]} ${pts[0][1]} `
  for (let i = 1; i < pts.length; i++) d += `L ${pts[i][0]} ${pts[i][1]} `
  return d + 'Z'
}

// ---------- data (verified / qualitative only) ----------
const drivers = [
  { title: 'Rising urban demand', description: 'Fast urbanisation concentrates demand for reliable, quality fresh food.' },
  { title: 'Cold-chain gap', description: 'Storage and logistics capacity trail production, so produce spoils before sale.' },
  { title: 'Fragmented supply chain', description: 'Informal intermediaries add cost and uncertainty to every transaction.' },
]

const problemStat = {
  value: '27.3%',
  label: 'of food is lost in Western Africa before it reaches retail.',
  source: 'Source: FAO, SDG Indicator 12.3.1 (2024)',
}
const problemChallenges = [
  { title: 'Fragmented logistics', description: 'Informal, uncoordinated transport raises cost and slows delivery.' },
  { title: 'Farmer income at risk', description: 'Spoilage and inefficiency erode the income farmers actually keep.' },
  { title: 'Unreliable supply', description: 'Buyers struggle to plan around inconsistent, unpredictable supply.' },
]

const solutionPillars = [
  { title: 'Cold storage', description: 'Temperature-controlled capacity that extends shelf life and cuts spoilage.' },
  { title: 'Quality assurance', description: 'Grading and inspection so buyers receive consistent, safe produce.' },
  { title: 'Distribution', description: 'Route-optimised logistics built for perishable goods.' },
  { title: 'Technology', description: 'One connected system for inventory, quality, and delivery tracking.' },
]

const processSteps = ['Farm', 'Collection', 'Cold storage', 'Quality check', 'Distribution', 'Buyer']

const revenueStreams = [
  { title: 'Storage fees', description: 'Recurring fees for cold-storage capacity.' },
  { title: 'Delivery fees', description: 'Per-delivery and route-based logistics fees.' },
  { title: 'Subscription plans', description: 'Guaranteed capacity on monthly plans.' },
  { title: 'Enterprise partnerships', description: 'Custom supply agreements with institutions.' },
  { title: 'Marketplace revenue', description: 'A share of transactions on the marketplace.' },
]

const segments = [
  { title: 'Farmers & traders', description: 'Sell more with less loss.' },
  { title: 'Restaurants & hotels', description: 'Reliable, quality produce.' },
  { title: 'Retailers', description: 'Consistent supply, fewer stockouts.' },
  { title: 'Schools & hospitals', description: 'Safe, dependable food supply.' },
  { title: 'Processors & exporters', description: 'Volume, quality, traceability.' },
]

const roadmap = [
  { year: '2026', title: 'Launch', description: 'First cold-storage facility and delivery routes.' },
  { year: '2027', title: 'Regional', description: 'New storage hubs across neighbouring cities.' },
  { year: '2028', title: 'National', description: 'Connected storage and logistics nationwide.' },
  { year: '2029', title: 'West Africa', description: 'Entry into new West African markets.' },
]

const impactAreas = [
  { title: 'Food security', description: 'More of every harvest reaches the people who need it.' },
  { title: 'Farmer income', description: 'Fair pricing and faster payment cycles.' },
  { title: 'Environment', description: 'Less spoilage means fewer embedded emissions.' },
]

const team = [
  { name: 'Hamilton Maison', role: 'Founder & Chief Executive Officer' },
  { name: 'Louis Afful', role: 'Head of Technology' },
  { name: 'Helena Yaa Kyei', role: 'Business Development' },
  { name: 'Alice Kafui', role: 'Administration & Human Resources' },
]

const useOfFunds = [
  { label: 'Cold storage', value: 40, color: C.green700 },
  { label: 'Fleet & logistics', value: 25, color: C.green500 },
  { label: 'Technology', value: 15, color: C.green300 },
  { label: 'Working capital', value: 12, color: C.orange },
  { label: 'Team', value: 8, color: C.slate400 },
]

// ============================================================
// 1 — Cover
// ============================================================
newSlide(C.green900)
doc.save().fillOpacity(0.45).circle(W - 110, 70, 210).fillColor(C.green800).fill().restore()
doc.save().fillOpacity(0.3).circle(50, H - 30, 160).fillColor(C.green700).fill().restore()

brandMark(MARGIN, 48, { size: 22, dark: true })
doc.font('SemiBold').fontSize(10.5).fillColor(C.green300)
doc.text('INVESTOR OVERVIEW  ·  2026', MARGIN, 186, { characterSpacing: 2.2, lineBreak: false })
doc.font('Bold').fontSize(44).fillColor(C.white)
doc.text('Cold-chain infrastructure', MARGIN, 214, { width: 780, lineBreak: false })
doc.font('Bold').fontSize(44).fillColor(C.green300)
doc.text("for Africa's fresh food.", MARGIN, 270, { width: 780, lineBreak: false })
doc.font('Regular').fontSize(13).fillColor(C.green100)
doc.text(
  'Storage, quality assurance, and delivery that keep fresh produce moving — reducing post-harvest loss across the supply chain.',
  MARGIN,
  330,
  { width: 640, lineGap: 4 },
)
doc.font('Regular').fontSize(10).fillColor(C.green200)
doc.text('Accra, Ghana   ·   info@keepxtra.com   ·   keepxtra.com', MARGIN, H - 68, { lineBreak: false })
pageFooter(1, true)

// ============================================================
// 2 — Market context
// ============================================================
newSlide()
{
  const top = contentHeader(
    'Market Context',
    "Africa's food system is growing faster than its infrastructure.",
    'Demand for fresh food is rising with urbanisation and population growth — while cold-chain and logistics capacity lag behind.',
  )
  let y = top
  drivers.forEach((d) => {
    challengeRow(MARGIN, y, 500, d)
    y += 64
  })
  statCard(MARGIN + 552, top, CONTENT_W - 552, 168, {
    value: '~2x',
    label: "Africa's population is projected to nearly double by 2050, driving food demand.",
    source: 'Source: UN World Population Prospects',
  })
  pageFooter(2)
}

// ============================================================
// 3 — The problem
// ============================================================
newSlide()
{
  const top = contentHeader(
    'The Problem',
    'Fresh produce is lost before it reaches a buyer.',
    'Weak cold-chain and fragmented logistics mean a large share of harvest spoils on the way to market.',
  )
  statCard(MARGIN, top, 300, 176, problemStat)
  let y = top
  problemChallenges.forEach((c) => {
    challengeRow(MARGIN + 340, y, CONTENT_W - 340, c)
    y += 60
  })
  pageFooter(3)
}

// ============================================================
// 4 — Solution
// ============================================================
newSlide()
{
  const top = contentHeader(
    'Our Solution',
    'The cold-chain infrastructure the market is missing.',
    'We operate the physical infrastructure — and the software that ties it together.',
  )
  const gap = 18
  const cw = (CONTENT_W - gap * 3) / 4
  solutionPillars.forEach((p, i) => lightCard(MARGIN + i * (cw + gap), top, cw, 150, p.title, p.description))
  pageFooter(4)
}

// ============================================================
// 5 — How it works
// ============================================================
newSlide()
{
  const top = contentHeader('How It Works', 'One connected chain, from farm to buyer.')
  processFlow(MARGIN + 10, top + 40, CONTENT_W - 20, processSteps)
  doc.font('Regular').fontSize(11).fillColor(C.slate500).text(
    'Produce moves from partner farms into cold storage within hours, is quality-checked and tracked in real time, '
      + 'then routed to buyers — cutting out the informal middle layers that cause the most loss.',
    MARGIN,
    top + 190,
    { width: CONTENT_W - 120, lineGap: 4 },
  )
  pageFooter(5)
}

// ============================================================
// 6 — Business model
// ============================================================
newSlide()
{
  const top = contentHeader('Business Model', 'Five recurring revenue streams.', 'Diversified, usage-based, and contracted revenue across the chain.')
  revenueStreams.forEach((r, i) => revenueRow(MARGIN, top + i * 50, CONTENT_W, i + 1, r.title, r.description))
  pageFooter(6)
}

// ============================================================
// 7 — Who we serve
// ============================================================
newSlide()
{
  const top = contentHeader(
    'Who We Serve',
    'Built for every link in the fresh-produce chain.',
    'We grow city by city, then across West Africa — deepening each market before expanding.',
  )
  const gap = 16
  const cw = (CONTENT_W - gap * 4) / 5
  segments.forEach((s, i) => lightCard(MARGIN + i * (cw + gap), top, cw, 130, s.title, s.description))
  pageFooter(7)
}

// ============================================================
// 8 — Roadmap
// ============================================================
newSlide()
{
  const top = contentHeader('Roadmap', 'A deliberate path from launch to regional scale.')
  timeline(MARGIN + 20, top + 70, CONTENT_W - 40, roadmap)
  pageFooter(8)
}

// ============================================================
// 9 — Impact
// ============================================================
newSlide()
{
  const top = contentHeader('Impact', 'Less waste. More income. Lower emissions.')
  const gap = 20
  const cw = (CONTENT_W - gap * 2) / 3
  impactAreas.forEach((a, i) => lightCard(MARGIN + i * (cw + gap), top, cw, 140, a.title, a.description))
  pageFooter(9)
}

// ============================================================
// 10 — Team
// ============================================================
newSlide()
{
  const top = contentHeader('Team', 'A focused founding team.', 'Operators building the infrastructure from the ground up.')
  const gap = 24
  const cw = (CONTENT_W - gap * 2) / 3
  team.forEach((m, i) => {
    const x = MARGIN + i * (cw + gap)
    doc.roundedRect(x, top, cw, 170, 12).fillColor(C.tint).fill()
    const initials = m.name.split(' ').map((p) => p[0]).join('')
    doc.circle(x + cw / 2, top + 48, 30).fillColor(C.green100).fill()
    doc.font('Bold').fontSize(18).fillColor(C.green700)
    doc.text(initials, x, top + 38, { width: cw, align: 'center', lineBreak: false })
    doc.font('SemiBold').fontSize(13).fillColor(C.ink).text(m.name, x + 16, top + 94, { width: cw - 32, align: 'center' })
    doc.font('Regular').fontSize(9.5).fillColor(C.green600).text(m.role, x + 16, top + 116, { width: cw - 32, align: 'center', lineGap: 2 })
  })
  pageFooter(10)
}

// ============================================================
// 11 — The Ask
// ============================================================
newSlide()
{
  const top = contentHeader('The Ask', 'Seed round to fund our first cold-storage hub and fleet.', 'Capital deployed toward capacity, logistics, and the platform.')

  doc.roundedRect(MARGIN, top, 300, 214, 12).fillColor(C.green50).fill()
  doc.font('SemiBold').fontSize(9.5).fillColor(C.green700).text('SEED ROUND', MARGIN + 24, top + 24, { characterSpacing: 1.5 })
  doc.font('Bold').fontSize(40).fillColor(C.green800).text('$100K', MARGIN + 24, top + 46, { width: 250 })
  doc.font('Regular').fontSize(10.5).fillColor(C.slate600).text(
    'To fund cold-storage capacity, fleet expansion, and the technology platform for our next two roadmap phases.',
    MARGIN + 24,
    top + 96,
    { width: 250, lineGap: 3 },
  )

  const dcx = MARGIN + 420
  const dcy = top + 110
  donut(dcx, dcy, 86, 52, useOfFunds)
  doc.font('SemiBold').fontSize(10.5).fillColor(C.ink).text('Use of funds', dcx - 55, top, { lineBreak: false })

  const legendX = dcx + 124
  useOfFunds.forEach((seg, i) => {
    const y = top + 26 + i * 24
    doc.roundedRect(legendX, y + 2, 10, 10, 2).fillColor(seg.color).fill()
    doc.font('Medium').fontSize(10).fillColor(C.ink).text(seg.label, legendX + 18, y, { width: 150, lineBreak: false })
    doc.font('SemiBold').fontSize(10).fillColor(C.slate500).text(`${seg.value}%`, legendX + 176, y, { lineBreak: false })
  })
  pageFooter(11)
}

// ============================================================
// 12 — Closing
// ============================================================
newSlide(C.green900)
doc.save().fillOpacity(0.4).circle(140, 90, 190).fillColor(C.green800).fill().restore()
doc.save().fillOpacity(0.3).circle(W - 90, H - 70, 210).fillColor(C.green700).fill().restore()
brandMark(MARGIN, 48, { size: 20, dark: true })
doc.font('Bold').fontSize(36).fillColor(C.white).text("Let's build Africa's food", MARGIN, 196, { width: 780 })
doc.font('Bold').fontSize(36).fillColor(C.green300).text('infrastructure together.', MARGIN, 246, { width: 780 })
doc.font('Regular').fontSize(11.5).fillColor(C.green100)
doc.text('info@keepxtra.com', MARGIN, 316, { lineBreak: false })
doc.text('+233 59 141 4352   /   +233 20 152 5252   (call & WhatsApp)', MARGIN, 334, { lineBreak: false })
doc.text('256 Avenue, North Kaneshie Street, Ghana', MARGIN, 352, { lineBreak: false })
doc.text('Mon – Sun: 5:00am – 7:00pm', MARGIN, 370, { lineBreak: false })
pageFooter(12, true)

doc.end()
outStream.on('finish', () => {
  console.log('Pitch deck generated at', OUT_PATH)
  if (fs.existsSync(path.dirname(PUBLIC_PATH))) {
    fs.copyFileSync(OUT_PATH, PUBLIC_PATH)
    console.log('Copied to', PUBLIC_PATH)
  }
})
