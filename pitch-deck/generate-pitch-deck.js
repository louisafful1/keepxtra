const PDFDocument = require('pdfkit')
const fs = require('fs')
const path = require('path')

// This script lives in <project-root>/pitch-deck, and borrows the Inter font
// files already installed for the frontend app (@fontsource/inter is a
// dependency of the frontend, so no font files are duplicated here).
const FONT_DIR = path.join(__dirname, '..', 'frontend', 'node_modules', '@fontsource', 'inter', 'files')
const OUT_PATH = path.join(__dirname, 'KeepXtra-Pitch-Deck.pdf')
// The site's "Request Pitch Deck" buttons link straight to this file, so every
// regeneration also refreshes the public copy the browser actually serves.
const PUBLIC_PATH = path.join(__dirname, '..', 'frontend', 'public', 'KeepXtra-Pitch-Deck.pdf')

// ---------- Slide geometry (16:9, PowerPoint-standard points) ----------
const W = 960
const H = 540
const MARGIN = 56

// ---------- Brand palette (matches the live site — green, with an orange X accent) ----------
const C = {
  bg: '#FFFFFF',
  bgTint: '#F7FCF9',
  primary900: '#052E16',
  primary800: '#14532D',
  primary700: '#166534',
  primary600: '#15803D',
  primary500: '#16A34A',
  primary300: '#86EFAC',
  primary200: '#BBF7D0',
  primary100: '#DCFCE7',
  primary50: '#F0FDF4',
  gold: '#CA8A04',
  goldLight: '#FEF3C7',
  accent: '#F97316',
  ink: '#0F172A',
  slate600: '#475569',
  slate500: '#64748B',
  slate400: '#94A3B8',
  slate200: '#E2E8F0',
  slate100: '#F1F5F9',
  white: '#FFFFFF',
}

const doc = new PDFDocument({
  size: [W, H],
  margin: 0,
  info: {
    Title: 'KeepXtra — Investor Pitch Deck',
    Author: 'KeepXtra',
    Subject: "Investing in Africa's Future Food Infrastructure",
  },
})
const outStream = fs.createWriteStream(OUT_PATH)
doc.pipe(outStream)

// ---------- Fonts ----------
doc.registerFont('Regular', `${FONT_DIR}/inter-latin-400-normal.woff`)
doc.registerFont('Medium', `${FONT_DIR}/inter-latin-500-normal.woff`)
doc.registerFont('SemiBold', `${FONT_DIR}/inter-latin-600-normal.woff`)
doc.registerFont('Bold', `${FONT_DIR}/inter-latin-700-normal.woff`)

let pageNum = 0
const TOTAL_PAGES = 15

// NOTE: pdfkit's fillColor() silently no-ops on unparsed CSS strings like
// 'rgba(...)' (it does NOT throw, and does NOT reset — it just leaves the
// previous fill color active). Never pass rgba()/hsla() strings to
// fillColor(). For translucency always use fillColor(hex).fillOpacity(a),
// and reset fillOpacity(1) after.

// ================= Chrome helpers =================

function newSlide({ bg = C.white } = {}) {
  if (pageNum > 0) doc.addPage()
  pageNum += 1
  doc.rect(0, 0, W, H).fill(bg)
  return pageNum
}

function brandMark(x, y, opts = {}) {
  const size = opts.size || 20
  const dark = opts.dark
  const fontSize = size * 0.66
  const baseColor = dark ? C.white : C.primary700
  const xColor = C.accent

  doc.font('SemiBold').fontSize(fontSize)
  doc.fillColor(baseColor).text('Keep', x, y + size * 0.16, { lineBreak: false })
  const keepWidth = doc.widthOfString('Keep')

  doc.fillColor(xColor).text('X', x + keepWidth, y + size * 0.16, { lineBreak: false })
  const xWidth = doc.widthOfString('X')

  doc
    .fillColor(baseColor)
    .text('tra', x + keepWidth + xWidth, y + size * 0.16, { lineBreak: false })
}

function footer(n, opts = {}) {
  const dark = opts.dark
  doc
    .font('Regular')
    .fontSize(8)
    .fillColor(dark ? C.primary300 : C.slate400)
    .text('KeepXtra — Confidential', MARGIN, H - 34, { lineBreak: false })
  doc
    .font('Regular')
    .fontSize(8)
    .fillColor(dark ? C.primary300 : C.slate400)
    .text(String(n).padStart(2, '0') + ' / ' + String(TOTAL_PAGES).padStart(2, '0'), W - MARGIN - 60, H - 34, {
      width: 60,
      align: 'right',
      lineBreak: false,
    })
}

function eyebrow(text, opts = {}) {
  const x = opts.x ?? MARGIN
  const y = opts.y ?? 64
  const color = opts.color ?? C.primary600
  doc
    .font('SemiBold')
    .fontSize(11)
    .fillColor(color)
    .text(text.toUpperCase(), x, y, { characterSpacing: 1.6, lineBreak: false })
}

// Draws the eyebrow + title and returns the Y position just below the
// (possibly two-line) title, so callers never hardcode a guess and clip it.
function header(eyebrowText, titleText, opts = {}) {
  brandMark(MARGIN, 30, { size: 18, dark: opts.dark })
  eyebrow(eyebrowText, { y: 64, color: opts.eyebrowColor })

  const x = opts.x ?? MARGIN
  const y = opts.y ?? 84
  const size = opts.size ?? 30
  const width = opts.width ?? W - MARGIN * 2
  const color = opts.color ?? C.primary800

  doc.font('Bold').fontSize(size)
  const titleHeight = doc.heightOfString(titleText, { width, lineGap: 2 })
  doc.fillColor(color).text(titleText, x, y, { width, lineGap: 2 })
  return y + titleHeight
}

function rule(x, y, w, color = C.slate200) {
  doc.moveTo(x, y).lineTo(x + w, y).lineWidth(1).strokeColor(color).stroke()
}

// ================= Chart helpers =================

function meterCard(x, y, w, h, { label, value, description }) {
  doc.roundedRect(x, y, w, h, 10).fillColor(C.white).fill()
  doc.roundedRect(x, y, w, h, 10).lineWidth(1).strokeColor(C.slate200).stroke()

  const pad = 20
  doc.font('SemiBold').fontSize(13).fillColor(C.ink).text(label, x + pad, y + pad, { width: w - pad * 2 - 60 })
  doc
    .font('Bold')
    .fontSize(26)
    .fillColor(C.primary700)
    .text(value + '%', x + w - pad - 90, y + pad - 4, { width: 90, align: 'right' })

  const barY = y + pad + 30
  const barW = w - pad * 2
  const barH = 10
  doc.roundedRect(x + pad, barY, barW, barH, barH / 2).fillColor(C.primary100).fill()
  const fillW = Math.max(barH, (barW * value) / 100)
  doc.roundedRect(x + pad, barY, fillW, barH, barH / 2).fillColor(C.primary500).fill()

  doc
    .font('Regular')
    .fontSize(10.5)
    .fillColor(C.slate500)
    .text(description, x + pad, barY + 22, { width: barW, lineGap: 1 })
}

function trendCard(x, y, w, h, { label, value, description, trend }) {
  doc.roundedRect(x, y, w, h, 10).fillColor(C.white).fill()
  doc.roundedRect(x, y, w, h, 10).lineWidth(1).strokeColor(C.slate200).stroke()

  const pad = 18
  const contentWidth = w - pad * 2
  const labelText = label.toUpperCase()

  doc.font('SemiBold').fontSize(9.5).fillColor(C.slate500)
  const labelHeight = doc.heightOfString(labelText, { width: contentWidth, characterSpacing: 1 })
  doc.text(labelText, x + pad, y + pad, { characterSpacing: 1, width: contentWidth })

  const valueY = y + pad + labelHeight + 3
  doc.font('Bold').fontSize(22).fillColor(C.primary800).text(value, x + pad, valueY)
  doc
    .font('Regular')
    .fontSize(9.5)
    .fillColor(C.slate500)
    .text(description, x + pad, valueY + 28, { width: contentWidth, lineGap: 1 })

  // sparkline
  const chartX = x + pad
  const chartY = y + h - 46
  const chartW = contentWidth
  const chartH = 34
  const max = Math.max(...trend)
  const min = Math.min(...trend)
  const range = max - min || 1
  const stepX = chartW / (trend.length - 1)
  const pts = trend.map((v, i) => [chartX + i * stepX, chartY + chartH - ((v - min) / range) * chartH])

  doc.save()
  doc.moveTo(pts[0][0], chartY + chartH)
  pts.forEach((p) => doc.lineTo(p[0], p[1]))
  doc.lineTo(pts[pts.length - 1][0], chartY + chartH)
  doc.closePath()
  doc.fillOpacity(0.12).fillColor(C.primary500).fill()
  doc.restore()

  doc.lineWidth(2).strokeColor(C.primary500).lineJoin('round').lineCap('round')
  doc.moveTo(pts[0][0], pts[0][1])
  pts.slice(1).forEach((p) => doc.lineTo(p[0], p[1]))
  doc.stroke()

  const last = pts[pts.length - 1]
  doc.circle(last[0], last[1], 3).fillColor(C.primary500).fill()
  doc.circle(last[0], last[1], 3).lineWidth(1.5).strokeColor(C.white).stroke()
}

function pillarCard(x, y, w, h, { index, title, description, dark = false }) {
  const pad = 18
  const contentWidth = w - pad * 2

  doc.roundedRect(x, y, w, h, 10).fillColor(dark ? C.primary800 : C.bgTint).fill()
  if (dark) doc.roundedRect(x, y, w, h, 10).lineWidth(1).strokeColor(C.primary700).stroke()

  doc.circle(x + pad + 12, y + pad + 12, 12).fillColor(C.primary600).fill()
  doc
    .font('Bold')
    .fontSize(11)
    .fillColor(C.white)
    .text(String(index), x + pad, y + pad + 6, { width: 24, align: 'center', lineBreak: false })

  const titleY = y + pad + 38
  doc.font('SemiBold').fontSize(13.5).fillColor(dark ? C.white : C.ink)
  const titleHeight = doc.heightOfString(title, { width: contentWidth })
  doc.text(title, x + pad, titleY, { width: contentWidth })

  doc
    .font('Regular')
    .fontSize(10)
    .fillColor(dark ? C.primary100 : C.slate500)
    .text(description, x + pad, titleY + titleHeight + 6, { width: contentWidth, lineGap: 1.5 })
}

function statBlock(x, y, w, { value, label }) {
  doc.font('Bold').fontSize(30).fillColor(C.primary700).text(value, x, y, { width: w, lineBreak: false })
  doc.font('Regular').fontSize(10.5).fillColor(C.slate500).text(label, x, y + 38, { width: w, lineGap: 1 })
}

function stepFlow(x, y, w, steps) {
  const n = steps.length
  const r = 22
  const slotW = w / n
  const lineY = y + r
  doc
    .moveTo(x + slotW / 2, lineY)
    .lineTo(x + w - slotW / 2, lineY)
    .lineWidth(1.5)
    .strokeColor(C.primary100)
    .stroke()

  steps.forEach((step, i) => {
    const cx = x + slotW * i + slotW / 2
    doc.circle(cx, lineY, r).fillColor(C.white).fill()
    doc.circle(cx, lineY, r).lineWidth(2).strokeColor(C.primary500).stroke()
    doc
      .font('Bold')
      .fontSize(13)
      .fillColor(C.primary700)
      .text(String(i + 1).padStart(2, '0'), cx - r, lineY - 7, { width: r * 2, align: 'center', lineBreak: false })
    doc
      .font('SemiBold')
      .fontSize(10.5)
      .fillColor(C.ink)
      .text(step.title, cx - slotW / 2 + 6, lineY + r + 12, { width: slotW - 12, align: 'center' })
  })
}

function timeline(x, y, w, milestones) {
  const n = milestones.length
  const slotW = w / n
  const lineY = y + 22

  doc
    .moveTo(x + slotW / 2, lineY)
    .lineTo(x + w - slotW / 2, lineY)
    .lineWidth(1.5)
    .strokeColor(C.primary300)
    .stroke()

  milestones.forEach((m, i) => {
    const cx = x + slotW * i + slotW / 2
    doc.circle(cx, lineY, 24).fillColor(C.white).fill()
    doc.circle(cx, lineY, 24).lineWidth(2).strokeColor(C.primary600).stroke()
    doc
      .font('Bold')
      .fontSize(11)
      .fillColor(C.primary700)
      .text(m.year, cx - 24, lineY - 6, { width: 48, align: 'center', lineBreak: false })
    doc
      .font('SemiBold')
      .fontSize(12)
      .fillColor(C.ink)
      .text(m.title, cx - slotW / 2 + 8, lineY + 36, { width: slotW - 16, align: 'center' })
    doc
      .font('Regular')
      .fontSize(9)
      .fillColor(C.slate500)
      .text(m.description, cx - slotW / 2 + 8, lineY + 54, { width: slotW - 16, align: 'center', lineGap: 1.5 })
  })
}

function donutChart(cx, cy, rOuter, rInner, segments) {
  let start = -Math.PI / 2
  const total = segments.reduce((s, seg) => s + seg.value, 0)
  segments.forEach((seg) => {
    const angle = (seg.value / total) * Math.PI * 2
    const end = start + angle
    doc.path(arcPath(cx, cy, rOuter, rInner, start, end)).fillColor(seg.color).fill()
    start = end
  })
}

function arcPath(cx, cy, rOuter, rInner, start, end) {
  const steps = 48
  const outerPts = []
  const innerPts = []
  for (let i = 0; i <= steps; i++) {
    const a = start + ((end - start) * i) / steps
    outerPts.push([cx + rOuter * Math.cos(a), cy + rOuter * Math.sin(a)])
  }
  for (let i = steps; i >= 0; i--) {
    const a = start + ((end - start) * i) / steps
    innerPts.push([cx + rInner * Math.cos(a), cy + rInner * Math.sin(a)])
  }
  const pts = outerPts.concat(innerPts)
  let d = `M ${pts[0][0]} ${pts[0][1]} `
  for (let i = 1; i < pts.length; i++) d += `L ${pts[i][0]} ${pts[i][1]} `
  d += 'Z'
  return d
}

// ================= Data (mirrors the live keepxtra site) =================

const impactStats = [
  { value: '2,500+', label: 'Tonnes of food saved from waste' },
  { value: '1,200+', label: 'Farmers & traders supported' },
  { value: '350+', label: 'Businesses served' },
  { value: '40,000+', label: 'Deliveries completed' },
]

const problemMetrics = [
  { label: 'Food Waste', value: 40, description: 'Of harvested produce is lost before it ever reaches a buyer.' },
  { label: 'Poor Logistics', value: 35, description: 'Of supply chain cost is lost to fragmented, informal logistics.' },
  { label: 'Farmer Income', value: 30, description: 'Of potential farmer income is lost to spoilage and inefficiency.' },
  { label: 'Supply Shortages', value: 60, description: 'Of buyers report frequent, unpredictable supply shortages.' },
]

const solutionPillars = [
  { title: 'Technology', description: 'Real-time visibility into inventory, orders, and routing.' },
  { title: 'Storage', description: 'Temperature-controlled facilities that extend shelf life.' },
  { title: 'Distribution', description: 'A logistics network built for perishable goods, at scale.' },
  { title: 'Supply Chain', description: 'One connected process from farm to storage to buyer.' },
  { title: 'Market Access', description: 'Direct connections between producers and buyers.' },
]

const processSteps = [
  { title: 'Farmers' },
  { title: 'Collection' },
  { title: 'Cold Storage' },
  { title: 'Quality Check' },
  { title: 'Inventory' },
  { title: 'Distribution' },
  { title: 'Consumers' },
]

const marketMetrics = [
  {
    label: 'Food Industry Growth',
    value: '+6%/yr',
    description: "Projected annual growth in Africa's food & beverage sector.",
    trend: [40, 50, 62, 78, 95],
  },
  {
    label: 'Urban Demand',
    value: '68%',
    description: "Share of Africa's population projected to live in cities by 2035.",
    trend: [35, 48, 58, 72, 90],
  },
  {
    label: 'Population Growth',
    value: '~2x by 2050',
    description: "Africa's population is projected to nearly double, driving food demand.",
    trend: [30, 42, 55, 74, 100],
  },
]

const businessModel = [
  { title: 'Storage Fees', description: 'Recurring fees for cold storage capacity used by farmers, traders, and buyers.' },
  { title: 'Delivery Fees', description: 'Per-delivery and route-based fees for last-mile and bulk distribution.' },
  { title: 'Subscription Plans', description: 'Monthly plans giving businesses guaranteed storage and delivery capacity.' },
  { title: 'Enterprise Partnerships', description: 'Custom supply agreements with hotels, retailers, and institutions.' },
  { title: 'Marketplace Revenue', description: "A share of transactions made through KeepXtra's marketplace." },
]

const growthStrategy = [
  { title: 'Expand City by City', description: 'Deepen density before expanding, so service quality never dilutes.' },
  { title: 'Build Logistics Hubs', description: 'Regional hubs that shorten collection and delivery routes.' },
  { title: 'Increase Cold Storage', description: 'Grow capacity ahead of demand to keep onboarding partners.' },
  { title: 'Develop Technology', description: 'Invest in the software layer that makes the network smarter.' },
]

const roadmap = [
  { year: '2026', title: 'Launch', description: 'First cold storage facility and delivery routes live.' },
  { year: '2027', title: 'Regional Expansion', description: 'New storage hubs across neighboring cities.' },
  { year: '2028', title: 'National Network', description: 'Connected storage & logistics network nationwide.' },
  { year: '2029', title: 'West African Expansion', description: 'Entry into new West African markets.' },
]

const impactPillars = [
  { title: 'ESG', description: 'Governance and reporting built in from day one.' },
  { title: 'Food Security', description: 'Less waste means more food reaching the people who need it.' },
  { title: 'Farmer Empowerment', description: 'Fair pricing and faster payment cycles for our farmers.' },
  { title: 'Environmental Sustainability', description: 'Reducing spoilage cuts emissions embedded in wasted food.' },
]

const team = [
  { name: 'Hamilton Maison', role: 'Founder & Chief Executive Officer' },
  { name: 'Louis Afful', role: 'Head of Technology' },
  { name: 'Helena Yaa Kyei', role: 'Business Development' },
]

const useOfFunds = [
  { label: 'Cold Storage Infrastructure', value: 40, color: C.primary700 },
  { label: 'Fleet & Logistics', value: 25, color: C.primary500 },
  { label: 'Technology Platform', value: 15, color: C.primary300 },
  { label: 'Working Capital', value: 12, color: C.gold },
  { label: 'Team & Talent', value: 8, color: C.slate400 },
]

const whyNow = [
  {
    title: 'Urbanization',
    description:
      "Africa's cities are growing faster than the food logistics needed to supply them, widening the gap infrastructure must fill.",
  },
  {
    title: 'Mobile & Digital Adoption',
    description:
      'Mobile money and smartphone penetration now make real-time logistics coordination possible at low cost.',
  },
  {
    title: 'Climate & Food Security',
    description:
      'Reducing post-harvest loss is increasingly treated as a climate and food-security priority, not just an efficiency gain.',
  },
]

// ================= Slides =================

// 1. Cover
newSlide({ bg: C.primary900 })
doc.save().fillOpacity(0.5).circle(W - 120, 90, 220).fillColor(C.primary800).fill().restore()
doc.save().fillOpacity(0.35).circle(80, H - 60, 180).fillColor(C.primary700).fill().restore()

brandMark(MARGIN, 44, { size: 22, dark: true })
doc
  .font('SemiBold')
  .fontSize(12)
  .fillColor(C.primary300)
  .text('INVESTOR PITCH DECK', MARGIN, H / 2 - 108, { characterSpacing: 2 })
doc.font('Bold').fontSize(46).fillColor(C.white).text("Investing in Africa’s", MARGIN, H / 2 - 78, { width: 760 })
doc
  .font('Bold')
  .fontSize(46)
  .fillColor(C.primary300)
  .text('Future Food Infrastructure', MARGIN, H / 2 - 28, { width: 760 })
doc
  .font('Regular')
  .fontSize(14)
  .fillColor(C.primary100)
  .text(
    'Cold storage, logistics, and technology infrastructure reducing post-harvest\nfood loss across Africa’s fresh produce supply chain.',
    MARGIN,
    H / 2 + 46,
    { width: 640, lineGap: 4 },
  )

doc
  .font('Regular')
  .fontSize(10)
  .fillColor(C.primary200)
  .text('Accra, Ghana  ·  info@keepxtra.com', MARGIN, H - 52, { lineBreak: false })
footer(1, { dark: true })

// 2. At a Glance
{
  newSlide()
  const afterTitle = header('At a Glance', 'Reducing food waste, at scale.')
  const paraY = afterTitle + 18
  doc.font('Regular').fontSize(12.5).fillColor(C.slate600)
  const paraText =
    'KeepXtra connects farmers and traders to professional cold storage, quality assurance, and last-mile ' +
    'delivery — so fresh produce reaches restaurants, retailers, and households before it ever has the chance to spoil.'
  const paraWidth = W - MARGIN * 2 - 60
  const paraHeight = doc.heightOfString(paraText, { width: paraWidth, lineGap: 4 })
  doc.text(paraText, MARGIN, paraY, { width: paraWidth, lineGap: 4 })

  const glanceY = paraY + paraHeight + 30
  const glanceItems = [
    { label: 'Headquarters', value: 'Accra, Ghana' },
    { label: 'Sector', value: 'Fresh Produce Logistics\n& Cold Chain Infrastructure' },
    { label: 'Stage', value: 'Seed' },
    { label: 'Team', value: '4 leaders, growing' },
  ]
  const glanceW = (W - MARGIN * 2 - 3 * 24) / 4
  glanceItems.forEach((item, i) => {
    const x = MARGIN + i * (glanceW + 24)
    doc.roundedRect(x, glanceY, glanceW, 100, 10).fillColor(C.bgTint).fill()
    doc
      .font('SemiBold')
      .fontSize(9.5)
      .fillColor(C.primary600)
      .text(item.label.toUpperCase(), x + 18, glanceY + 18, { characterSpacing: 1, width: glanceW - 36 })
    doc
      .font('Bold')
      .fontSize(15)
      .fillColor(C.ink)
      .text(item.value, x + 18, glanceY + 40, { width: glanceW - 36, lineGap: 2 })
  })

  const ruleY = glanceY + 100 + 26
  rule(MARGIN, ruleY, W - MARGIN * 2)
  doc.font('SemiBold').fontSize(11).fillColor(C.slate500).text('Traction to date', MARGIN, ruleY + 16, { lineBreak: false })
  const statW = (W - MARGIN * 2) / 4
  impactStats.forEach((s, i) => statBlock(MARGIN + i * statW, ruleY + 38, statW - 20, s))
  footer(2)
}

// 3. The Problem
{
  newSlide()
  const afterTitle = header('The Problem', 'A market held back by broken infrastructure.')
  doc
    .font('Regular')
    .fontSize(11.5)
    .fillColor(C.slate500)
    .text(
      'Poor storage and fragmented distribution mean fresh produce rarely makes it from farm to buyer intact.',
      MARGIN,
      afterTitle + 14,
      { width: W - MARGIN * 2 },
    )

  const gridY = afterTitle + 60
  const pmW = (W - MARGIN * 2 - 24) / 2
  const pmH = 118
  problemMetrics.forEach((m, i) => {
    const col = i % 2
    const row = Math.floor(i / 2)
    meterCard(MARGIN + col * (pmW + 24), gridY + row * (pmH + 20), pmW, pmH, m)
  })
  footer(3)
}

// 4. Our Solution
{
  newSlide()
  const afterTitle = header('Our Solution', 'The infrastructure layer that was missing.')
  const gridY = afterTitle + 46
  const solW = (W - MARGIN * 2 - 4 * 18) / 5
  solutionPillars.forEach((p, i) => {
    pillarCard(MARGIN + i * (solW + 18), gridY, solW, 170, { index: i + 1, ...p })
  })
  footer(4)
}

// 5. How It Works
{
  newSlide()
  const afterTitle = header('How We Work', 'One connected process, farm to table.')
  stepFlow(MARGIN + 20, afterTitle + 100, W - MARGIN * 2 - 40, processSteps)
  doc
    .font('Regular')
    .fontSize(11)
    .fillColor(C.slate500)
    .text(
      'Produce moves from partner farms into cold storage within hours, is quality-checked and tracked in real time, ' +
        'then routed to buyers through our distribution network — cutting out the informal middle layers that cause the most loss.',
      MARGIN,
      afterTitle + 230,
      { width: W - MARGIN * 2 - 100, lineGap: 4 },
    )
  footer(5)
}

// 6. Market Opportunity
{
  newSlide()
  const afterTitle = header('Market Opportunity', 'A market growing faster than infrastructure can keep up.')
  const gridY = afterTitle + 30

  doc.roundedRect(MARGIN, gridY, 260, 210, 12).fillColor(C.primary800).fill()
  doc
    .font('SemiBold')
    .fontSize(10.5)
    .fillColor(C.primary300)
    .text('ADDRESSABLE MARKET', MARGIN + 24, gridY + 30, { characterSpacing: 1 })
  doc.font('Bold').fontSize(44).fillColor(C.white).text('$4B+', MARGIN + 24, gridY + 52)
  doc
    .font('Regular')
    .fontSize(10.5)
    .fillColor(C.primary100)
    .text("Annual value flowing through Africa’s fresh produce supply chain today.", MARGIN + 24, gridY + 110, {
      width: 210,
      lineGap: 3,
    })

  const mmX = MARGIN + 284
  const mmW = (W - MARGIN - mmX - 2 * 18) / 3
  marketMetrics.forEach((m, i) => {
    trendCard(mmX + i * (mmW + 18), gridY, mmW, 210, m)
  })
  footer(6)
}

// 7. Business Model
{
  newSlide()
  const afterTitle = header('Business Model', 'Five ways we generate revenue.')
  const gridY = afterTitle + 46
  const bmW = (W - MARGIN * 2 - 4 * 18) / 5
  businessModel.forEach((b, i) => {
    pillarCard(MARGIN + i * (bmW + 18), gridY, bmW, 170, { index: i + 1, ...b })
  })
  footer(7)
}

// 8. Traction & Impact
{
  newSlide()
  const afterTitle = header('Traction & Impact', 'Progress you can measure.')
  const gridY = afterTitle + 30
  const trW = (W - MARGIN * 2 - 3 * 24) / 4
  impactStats.forEach((s, i) => {
    const x = MARGIN + i * (trW + 24)
    doc.roundedRect(x, gridY, trW, 150, 12).fillColor(C.bgTint).fill()
    doc.font('Bold').fontSize(34).fillColor(C.primary700).text(s.value, x + 22, gridY + 36, { width: trW - 44 })
    doc.font('Regular').fontSize(11).fillColor(C.slate500).text(s.label, x + 22, gridY + 84, { width: trW - 44, lineGap: 2 })
  })
  doc
    .font('Regular')
    .fontSize(10)
    .fillColor(C.slate400)
    .text('Figures reflect internal operating data and are updated regularly as the network grows.', MARGIN, gridY + 180, {
      width: W - MARGIN * 2,
    })
  footer(8)
}

// 9. Why Now
{
  newSlide()
  const afterTitle = header('Why Now', 'Three tailwinds converging at once.')
  const gridY = afterTitle + 46
  const wnW = (W - MARGIN * 2 - 2 * 24) / 3
  const wnH = 160
  whyNow.forEach((w, i) => {
    const x = MARGIN + i * (wnW + 24)
    doc.roundedRect(x, gridY, wnW, wnH, 10).fillColor(C.white).fill()
    doc.roundedRect(x, gridY, wnW, wnH, 10).lineWidth(1).strokeColor(C.slate200).stroke()
    doc.rect(x, gridY, 5, wnH).fillColor(C.primary500).fill()

    const textWidth = wnW - 46
    doc.font('SemiBold').fontSize(14).fillColor(C.ink)
    const titleHeight = doc.heightOfString(w.title, { width: textWidth })
    doc.text(w.title, x + 26, gridY + 26, { width: textWidth })
    doc
      .font('Regular')
      .fontSize(10.5)
      .fillColor(C.slate500)
      .text(w.description, x + 26, gridY + 26 + titleHeight + 10, { width: textWidth, lineGap: 3 })
  })
  footer(9)
}

// 10. Growth Strategy
{
  newSlide()
  const afterTitle = header('Growth Strategy', 'How we scale, deliberately.')
  const gridY = afterTitle + 46
  const gsW = (W - MARGIN * 2 - 3 * 18) / 4
  growthStrategy.forEach((g, i) => {
    pillarCard(MARGIN + i * (gsW + 18), gridY, gsW, 170, { index: i + 1, ...g })
  })
  footer(10)
}

// 11. Roadmap
{
  newSlide()
  const afterTitle = header('Roadmap', 'Where we’re headed, 2026–2029.')
  timeline(MARGIN + 20, afterTitle + 110, W - MARGIN * 2 - 40, roadmap)
  footer(11)
}

// 12. Impact & ESG
{
  newSlide({ bg: C.primary900 })
  const afterTitle = header('Impact & ESG', 'Returns and impact, built together.', {
    dark: true,
    color: C.white,
    eyebrowColor: C.primary300,
  })
  const gridY = afterTitle + 46
  const ipW = (W - MARGIN * 2 - 3 * 18) / 4
  impactPillars.forEach((p, i) => {
    pillarCard(MARGIN + i * (ipW + 18), gridY, ipW, 170, { index: i + 1, ...p, dark: true })
  })
  footer(12, { dark: true })
}

// 13. Team
{
  newSlide()
  const afterTitle = header('Leadership', 'The team building KeepXtra.')
  const gridY = afterTitle + 40
  const teamW = (W - MARGIN * 2 - 3 * 20) / 4
  team.forEach((m, i) => {
    const x = MARGIN + i * (teamW + 20)
    const y = gridY
    doc.roundedRect(x, y, teamW, 190, 10).fillColor(C.bgTint).fill()
    const cx = x + teamW / 2
    doc.circle(cx, y + 58, 34).fillColor(C.primary100).fill()
    const initials = m.name
      .split(' ')
      .map((p) => p[0])
      .join('')
    doc
      .font('Bold')
      .fontSize(20)
      .fillColor(C.primary700)
      .text(initials, x, y + 46, { width: teamW, align: 'center', lineBreak: false })
    doc
      .font('SemiBold')
      .fontSize(12.5)
      .fillColor(C.ink)
      .text(m.name, x + 14, y + 108, { width: teamW - 28, align: 'center' })
    doc
      .font('Regular')
      .fontSize(9.5)
      .fillColor(C.primary600)
      .text(m.role, x + 14, y + 128, { width: teamW - 28, align: 'center', lineGap: 2 })
  })
  footer(13)
}

// 14. The Ask
{
  newSlide()
  const afterTitle = header('The Ask', 'Fueling the next phase of growth.')
  const gridY = afterTitle + 30

  doc.roundedRect(MARGIN, gridY, 300, 260, 12).fillColor(C.primary50).fill()
  doc
    .font('SemiBold')
    .fontSize(10.5)
    .fillColor(C.primary700)
    .text('RAISING', MARGIN + 26, gridY + 28, { characterSpacing: 1 })
  doc.font('Bold').fontSize(40).fillColor(C.primary800).text('$100K', MARGIN + 26, gridY + 48, { width: 250 })
  doc
    .font('Regular')
    .fontSize(10.5)
    .fillColor(C.slate600)
    .text(
      'To fund cold storage capacity, fleet expansion, and the technology platform for our next two roadmap phases.',
      MARGIN + 26,
      gridY + 94,
      { width: 250, lineGap: 3 },
    )
  const donutCx = MARGIN + 430
  const donutCy = gridY + 125
  donutChart(donutCx, donutCy, 90, 54, useOfFunds)
  doc.font('SemiBold').fontSize(11).fillColor(C.ink).text('Use of Funds', donutCx - 60, gridY, { lineBreak: false })

  const legendX = donutCx + 130
  useOfFunds.forEach((seg, i) => {
    const y = gridY + 28 + i * 24
    doc.roundedRect(legendX, y + 2, 10, 10, 2).fillColor(seg.color).fill()
    doc.font('Medium').fontSize(10).fillColor(C.ink).text(seg.label, legendX + 18, y, { width: 190, lineBreak: false })
    doc.font('SemiBold').fontSize(10).fillColor(C.slate500).text(seg.value + '%', legendX + 210, y, { lineBreak: false })
  })
  footer(14)
}

// 15. Closing
{
  newSlide({ bg: C.primary900 })
  doc.save().fillOpacity(0.4).circle(140, 100, 200).fillColor(C.primary800).fill().restore()
  doc.save().fillOpacity(0.3).circle(W - 100, H - 80, 220).fillColor(C.primary700).fill().restore()
  brandMark(MARGIN, 44, { size: 20, dark: true })
  doc.font('Bold').fontSize(38).fillColor(C.white).text('Let’s build Africa’s food', MARGIN, 190, { width: 760 })
  doc.font('Bold').fontSize(38).fillColor(C.primary300).text('infrastructure together.', MARGIN, 234, { width: 760 })

  doc.font('Regular').fontSize(12).fillColor(C.primary100)
  doc.text('info@keepxtra.com', MARGIN, 320, { lineBreak: false })
  doc.text('+233 59 141 4352  /  +233 20 152 5252  (call & WhatsApp)', MARGIN, 340, { lineBreak: false })
  doc.text('256 Avenue, North Kaneshie Street, Ghana', MARGIN, 360, { lineBreak: false })
  doc.text('Mon – Sun: 5:00am – 7:00pm', MARGIN, 380, { lineBreak: false })
  footer(15, { dark: true })
}

doc.end()
outStream.on('finish', () => {
  console.log('Pitch deck generated at', OUT_PATH)
  if (fs.existsSync(path.dirname(PUBLIC_PATH))) {
    fs.copyFileSync(OUT_PATH, PUBLIC_PATH)
    console.log('Copied to', PUBLIC_PATH)
  }
})
