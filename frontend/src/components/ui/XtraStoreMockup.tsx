import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

/**
 * Hand-built XtraStore device mockup.
 *
 * The screens are drawn with markup and CSS instead of a screenshot, so they stay
 * sharp at any size and the copy can be edited like any other content. Devices use
 * iPhone 16 metrics (393 × 852 pt screen), then the composition is scaled to fit.
 */

/** iPhone 16 logical screen size, in points. */
const SCREEN_W = 393
const SCREEN_H = 852
/** Frame thickness around the screen. */
const BEZEL = 11
const DEVICE_W = SCREEN_W + BEZEL * 2
const DEVICE_H = SCREEN_H + BEZEL * 2

const CANVAS_W = 1080
const CANVAS_H = 912

type Product = {
  category: string
  name: string
  price: string
  unit: string
  compareAt?: string
  image: string
  offer?: boolean
  bulk?: boolean
  /** Fish products carry a condition note, matching the storefront's fish badge. */
  chilled?: boolean
}

const OFFERS: Product[] = [
  {
    category: 'Fruits',
    name: 'Oranges',
    price: 'GH₵ 120.00',
    unit: '/ crate',
    compareAt: 'GH₵ 150.00',
    image: '/images/store/oranges.jpg',
    offer: true,
    bulk: true,
  },
  {
    category: 'Tomatoes & Peppers',
    name: 'Fresh Tomatoes',
    price: 'GH₵ 15.00',
    unit: '/ kg',
    compareAt: 'GH₵ 18.00',
    image: '/images/store/tomatoes.jpg',
    offer: true,
  },
]

const FISH: Product[] = [
  {
    category: 'Fresh Fish',
    name: 'Tilapia',
    price: 'GH₵ 55.00',
    unit: '/ kg',
    image: '/images/store/fish-tilapia.jpg',
    bulk: true,
    chilled: true,
  },
  {
    category: 'Fresh Fish',
    name: 'Catfish',
    price: 'GH₵ 48.00',
    unit: '/ kg',
    image: '/images/store/fish-catfish.jpg',
    bulk: true,
    chilled: true,
  },
  {
    category: 'Fresh Fish',
    name: 'Prawns',
    price: 'GH₵ 95.00',
    unit: '/ kg',
    image: '/images/store/fish-prawns.jpg',
    bulk: true,
    chilled: true,
  },
  {
    category: 'Fresh Fish',
    name: 'Octopus',
    price: 'GH₵ 85.00',
    unit: '/ kg',
    image: '/images/store/fish-octopus.jpg',
    bulk: true,
    chilled: true,
  },
]

const MORE: Product[] = [
  {
    category: 'Fruits',
    name: 'Mangoes',
    price: 'GH₵ 90.00',
    unit: '/ crate',
    compareAt: 'GH₵ 100.00',
    image: '/images/store/mangoes.jpg',
    offer: true,
  },
  {
    category: 'Fruits',
    name: 'Plantain',
    price: 'GH₵ 35.00',
    unit: '/ bunch',
    image: '/images/store/plantain.jpg',
    bulk: true,
  },
  {
    category: 'Fruits',
    name: 'Avocado',
    price: 'GH₵ 42.00',
    unit: '/ crate',
    image: '/images/store/avocado.jpg',
  },
  {
    category: 'Fruits',
    name: 'Oranges',
    price: 'GH₵ 120.00',
    unit: '/ crate',
    compareAt: 'GH₵ 150.00',
    image: '/images/store/oranges.jpg',
    offer: true,
  },
]

function LeafMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" className={cn('size-[15px]', className)}>
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M6 94 C 23 52 53 22 94 6 C 78 48 48 78 6 94 Z
           M54 46 C 60 40 70 30 78 22 C 72 34 62 44 54 46 Z
           M46 54 C 40 60 30 70 22 78 C 28 66 38 56 46 54 Z"
      />
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M94 94 C 77 52 47 22 6 6 C 22 48 52 78 94 94 Z
           M46 46 C 40 40 30 30 22 22 C 28 34 38 44 46 46 Z
           M54 54 C 60 60 70 70 78 78 C 72 66 62 56 54 54 Z"
      />
    </svg>
  )
}

function Brand() {
  return (
    <div className="flex flex-col leading-none">
      <span className="flex items-baseline text-primary-800">
        <LeafMark className="-mr-[1px] size-[13px] text-secondary-500" />
        <span className="font-display text-[19px] font-bold tracking-[-0.04em]">
          tra<span className="text-primary-500">Store</span>
        </span>
      </span>
      <span className="mt-[3px] text-[7px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
        by KeepXtra
      </span>
    </div>
  )
}

function PhoneFrame({
  children,
  className,
  style,
}: {
  children: ReactNode
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <div
      className={cn(
        'relative shrink-0 overflow-hidden rounded-[56px] bg-[#1b1b1d]',
        'shadow-[0_40px_90px_-28px_rgba(10,44,25,0.5),0_3px_10px_-3px_rgba(10,44,25,0.25)]',
        className,
      )}
      style={{ width: DEVICE_W, height: DEVICE_H, padding: BEZEL, ...style }}
    >
      <div className="relative h-full w-full overflow-hidden rounded-[46px] bg-white">
        {/* Dynamic Island */}
        <div className="absolute left-1/2 top-[9px] z-20 h-[26px] w-[88px] -translate-x-1/2 rounded-full bg-[#1b1b1d]" />
        {children}
      </div>
    </div>
  )
}

function StatusBar() {
  return (
    <div className="flex items-center justify-between px-[26px] pb-[2px] pt-[14px]">
      <span className="text-[11px] font-semibold tracking-[-0.01em] text-neutral-900">9:41</span>
      <div className="flex items-center gap-[5px] text-neutral-900">
        <svg viewBox="0 0 20 12" aria-hidden="true" className="h-[9px] w-[15px]" fill="currentColor">
          <rect x="0" y="7" width="3" height="5" rx="1" />
          <rect x="4.5" y="5" width="3" height="7" rx="1" />
          <rect x="9" y="2.5" width="3" height="9.5" rx="1" />
          <rect x="13.5" y="0" width="3" height="12" rx="1" />
        </svg>
        <svg viewBox="0 0 16 12" aria-hidden="true" className="h-[9px] w-[12px]" fill="currentColor">
          <path d="M8 10.4 10 8a2.9 2.9 0 0 0-4 0l2 2.4ZM8 6.2c1.5 0 2.9.6 3.9 1.5l1-1.2A7 7 0 0 0 8 4.5a7 7 0 0 0-4.9 2l1 1.2A5.5 5.5 0 0 1 8 6.2ZM8 2.4c2.4 0 4.6.9 6.2 2.3l1-1.2A10.4 10.4 0 0 0 8 .6 10.4 10.4 0 0 0 .8 3.5l1 1.2A8.8 8.8 0 0 1 8 2.4Z" />
        </svg>
        <svg viewBox="0 0 26 12" aria-hidden="true" className="h-[10px] w-[21px]">
          <rect x="0.6" y="0.6" width="21" height="10.8" rx="3" fill="none" stroke="currentColor" strokeOpacity="0.4" />
          <rect x="2.2" y="2.2" width="16" height="7.6" rx="1.8" fill="currentColor" />
          <path d="M23.4 4.2v3.6a2 2 0 0 0 0-3.6Z" fill="currentColor" fillOpacity="0.5" />
        </svg>
      </div>
    </div>
  )
}

function TopStrip() {
  return (
    <div className="flex items-center justify-between bg-primary-800 px-[18px] py-[7px]">
      <span className="text-[9px] font-medium leading-[12px] text-primary-100">
        Delivery timing and fees are confirmed on the call
      </span>
      <span className="text-[9px] font-semibold text-primary-200">Ghana</span>
    </div>
  )
}

function Header() {
  return (
    <div className="flex items-center justify-between px-[18px] pb-[8px] pt-[10px]">
      <div className="flex w-[22px] flex-col gap-[3.5px]">
        <span className="h-[2px] w-[17px] rounded bg-neutral-800" />
        <span className="h-[2px] w-[13px] rounded bg-neutral-800" />
        <span className="h-[2px] w-[17px] rounded bg-neutral-800" />
      </div>
      <Brand />
      <div className="flex items-center gap-[10px] text-neutral-700">
        <svg viewBox="0 0 24 24" aria-hidden="true" className="size-[17px]" fill="none" stroke="currentColor" strokeWidth="1.9">
          <circle cx="12" cy="8" r="3.4" />
          <path d="M5 20c0-3.5 3.1-5.6 7-5.6s7 2.1 7 5.6" strokeLinecap="round" />
        </svg>
        <svg viewBox="0 0 24 24" aria-hidden="true" className="size-[17px]" fill="none" stroke="currentColor" strokeWidth="1.9">
          <path d="M4 5h2l2.2 10.2A2 2 0 0 0 10.2 17h7.4a2 2 0 0 0 2-1.6L21 8H7" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="10" cy="20" r="1.3" fill="currentColor" stroke="none" />
          <circle cx="18" cy="20" r="1.3" fill="currentColor" stroke="none" />
        </svg>
      </div>
    </div>
  )
}

function SearchBar({ placeholder = 'Search fresh produce…' }: { placeholder?: string }) {
  return (
    <div className="px-[18px] pb-[10px]">
      <div className="flex items-center gap-[7px] rounded-full border border-neutral-200 bg-white py-[6px] pl-[12px] pr-[5px]">
        <svg viewBox="0 0 24 24" aria-hidden="true" className="size-[13px] text-neutral-400" fill="none" stroke="currentColor" strokeWidth="2.2">
          <circle cx="11" cy="11" r="6.5" />
          <path d="M16 16l5 5" strokeLinecap="round" />
        </svg>
        <span className="flex-1 text-[11.5px] text-neutral-400">{placeholder}</span>
        <span className="rounded-full bg-primary-700 px-[11px] py-[4px] text-[10px] font-semibold text-white">
          Search
        </span>
      </div>
    </div>
  )
}

function Tags({ product }: { product: Product }) {
  if (!product.chilled && !product.offer && !product.bulk) return null
  return (
    <div className="flex flex-wrap gap-[4px]">
      {product.chilled ? (
        <span className="rounded-full border border-primary-200 bg-white px-[7px] py-[2px] text-[8px] font-bold uppercase tracking-wide text-primary-700">
          Chilled fish
        </span>
      ) : null}
      {product.offer ? (
        <span className="rounded-full bg-secondary-100 px-[7px] py-[2px] text-[8px] font-bold uppercase tracking-wide text-secondary-700">
          Offer
        </span>
      ) : null}
      {product.bulk ? (
        <span className="rounded-full bg-primary-100 px-[7px] py-[2px] text-[8px] font-bold uppercase tracking-wide text-primary-700">
          Bulk pricing
        </span>
      ) : null}
    </div>
  )
}

function Stepper() {
  return (
    <div className="flex items-center gap-[9px] rounded-full border border-neutral-200 px-[7px] py-[3px]">
      <span className="text-[12px] leading-none text-neutral-500">−</span>
      <span className="text-[11px] font-semibold leading-none text-neutral-900">1</span>
      <span className="text-[12px] leading-none text-neutral-500">+</span>
    </div>
  )
}

function ProductCard({ product, compact = false }: { product: Product; compact?: boolean }) {
  return (
    <div className="flex flex-col gap-[6px] rounded-[16px] border border-neutral-200 bg-white p-[9px] shadow-[0_1px_3px_rgba(15,23,42,0.05)]">
      <div className="relative overflow-hidden rounded-[11px] bg-neutral-100">
        <img
          src={product.image}
          alt=""
          className={cn('w-full object-cover', compact ? 'aspect-[4/3]' : 'aspect-square')}
        />
        <span className="absolute left-[6px] top-[6px] flex size-[18px] items-center justify-center rounded-full bg-white/90 text-[9px] text-secondary-600">
          ♥
        </span>
      </div>
      <Tags product={product} />
      <p className="text-[8px] font-semibold uppercase tracking-[0.09em] text-neutral-400">
        {product.category}
      </p>
      <p className="text-[13px] font-bold leading-[16px] text-neutral-900">{product.name}</p>
      <div className="flex items-baseline gap-[4px]">
        <span className="text-[14px] font-bold text-primary-800">{product.price}</span>
        <span className="text-[9px] text-neutral-500">{product.unit}</span>
      </div>
      {product.compareAt ? (
        <span className="-mt-[3px] text-[9px] text-neutral-400 line-through">{product.compareAt}</span>
      ) : null}
      <div className="mt-[2px] flex items-center justify-between">
        <Stepper />
        <span className="rounded-full bg-primary-700 px-[12px] py-[4px] text-[10px] font-semibold text-white">
          Add
        </span>
      </div>
    </div>
  )
}

function BottomNav() {
  const items = ['home', 'search', 'categories', 'cart'] as const
  return (
    <div className="mt-auto flex shrink-0 items-center justify-around border-t border-neutral-200 bg-white px-[18px] py-[9px]">
      {items.map((icon) => (
        <span
          key={icon}
          className={cn(
            'flex size-[30px] items-center justify-center rounded-[9px]',
            icon === 'search' ? 'bg-primary-700 text-white' : 'text-neutral-500',
          )}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" className="size-[16px]" fill="none" stroke="currentColor" strokeWidth="2">
            {icon === 'home' && <path d="M4 11l8-7 8 7v9H4z" strokeLinecap="round" strokeLinejoin="round" />}
            {icon === 'search' && (
              <>
                <circle cx="11" cy="11" r="6.5" />
                <path d="M16 16l5 5" strokeLinecap="round" />
              </>
            )}
            {icon === 'categories' && (
              <>
                <rect x="4" y="4" width="7" height="7" rx="1.6" />
                <rect x="13" y="4" width="7" height="7" rx="1.6" />
                <rect x="4" y="13" width="7" height="7" rx="1.6" />
                <rect x="13" y="13" width="7" height="7" rx="1.6" />
              </>
            )}
            {icon === 'cart' && (
              <>
                <path d="M4 5h2l2.2 10.2A2 2 0 0 0 10.2 17h7.4a2 2 0 0 0 2-1.6L21 8H7" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="10" cy="20" r="1.3" fill="currentColor" stroke="none" />
                <circle cx="18" cy="20" r="1.3" fill="currentColor" stroke="none" />
              </>
            )}
          </svg>
        </span>
      ))}
    </div>
  )
}

function FiltersRow({ count = '20', chips = ['Filters', 'Relevance'] }: { count?: string; chips?: string[] }) {
  return (
    <div className="flex items-center justify-between px-[18px] pb-[9px]">
      <span className="text-[10px] font-medium text-neutral-500">{count} products</span>
      <div className="flex gap-[6px]">
        {chips.map((chip) => (
          <span
            key={chip}
            className="rounded-full border border-neutral-200 px-[10px] py-[3px] text-[9.5px] font-medium text-neutral-600"
          >
            {chip}
          </span>
        ))}
      </div>
    </div>
  )
}

function OffersScreen() {
  return (
    <div className="flex h-full flex-col">
      <StatusBar />
      <div className="flex-1 overflow-hidden">
        <div className="bg-gradient-soft-green px-[20px] pb-[14px] pt-[8px]">
          <p className="text-[8.5px] font-semibold uppercase tracking-[0.18em] text-secondary-600">
            Limited offers
          </p>
          <p className="mt-[6px] font-display text-[26px] font-bold leading-[27px] tracking-[-0.02em] text-neutral-900">
            Seasonal pricing,
            <br />
            while it lasts
          </p>
          <p className="mt-[6px] text-[10.5px] leading-[15px] text-neutral-500">
            Promotional prices apply to the items shown.
          </p>
          <p className="mt-[9px] text-[10.5px] font-semibold text-primary-700">View all offers →</p>
        </div>
        <div className="flex flex-col gap-[10px] px-[18px] pt-[12px]">
          {OFFERS.map((product) => (
            <ProductCard key={product.name} product={product} compact />
          ))}
        </div>
      </div>
      <BottomNav />
    </div>
  )
}

function MoreScreen() {
  return (
    <div className="flex h-full flex-col">
      <StatusBar />
      <Header />
      <SearchBar />
      <div className="flex-1 overflow-hidden">
        <FiltersRow />
        <div className="grid grid-cols-2 gap-[10px] px-[18px]">
          {MORE.map((product) => (
            <ProductCard key={product.name} product={product} />
          ))}
        </div>
      </div>
      <BottomNav />
    </div>
  )
}

function FishCatalogueScreen() {
  return (
    <div className="flex h-full flex-col">
      <StatusBar />
      <TopStrip />
      <Header />
      <SearchBar placeholder="Tilapia, catfish, prawns…" />
      <div className="flex-1 overflow-hidden">
        <div className="px-[18px] pb-[9px]">
          <p className="text-[8.5px] font-semibold uppercase tracking-[0.18em] text-primary-600">
            Fresh fish
          </p>
          <p className="mt-[4px] font-display text-[23px] font-bold leading-[25px] tracking-[-0.02em] text-neutral-900">
            Fresh fish, sold by weight
          </p>
          <p className="mt-[5px] text-[10.5px] leading-[15px] text-neutral-500">
            Only fish from an inspected and released batch is available to order.
          </p>
        </div>
        <FiltersRow count="8" chips={['Species', 'Condition']} />
        <div className="grid grid-cols-2 gap-[9px] px-[18px]">
          {FISH.map((product) => (
            <ProductCard key={product.name} product={product} compact />
          ))}
        </div>
      </div>
      <BottomNav />
    </div>
  )
}

export function XtraStoreMockup() {
  const host = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  // Everything is drawn at iPhone 16 size so the details stay crisp, then the whole
  // composition is scaled to the width available.
  useEffect(() => {
    const element = host.current
    if (!element) return

    const measure = () => {
      const width = element.clientWidth
      if (width > 0) setScale(Math.min(1, width / CANVAS_W))
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={host}
      className="relative mx-auto w-full max-w-[1080px]"
      data-testid="xtrastore-mockup"
      style={{ height: CANVAS_H * scale }}
    >
      <div
        className="absolute left-1/2 top-0"
        style={{
          width: CANVAS_W,
          height: CANVAS_H,
          transform: `translateX(-50%) scale(${scale})`,
          transformOrigin: 'top center',
        }}
      >
        {/* Soft halo behind the devices */}
        <div className="absolute left-1/2 top-[42%] size-[660px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-200/40 blur-3xl" />
        <div className="absolute left-1/2 top-[82%] h-[170px] w-[820px] -translate-x-1/2 rounded-[100%] bg-primary-900/10 blur-2xl" />

        <div className="relative flex h-full w-full items-end justify-center pb-[28px]">
          <PhoneFrame
            className="origin-bottom -rotate-[6deg] opacity-95"
            style={{ width: DEVICE_W, height: DEVICE_H, scale: '0.94', marginRight: -80 }}
          >
            <OffersScreen />
          </PhoneFrame>

          <PhoneFrame className="z-10">
            <FishCatalogueScreen />
          </PhoneFrame>

          <PhoneFrame
            className="origin-bottom rotate-[6deg] opacity-95"
            style={{ width: DEVICE_W, height: DEVICE_H, scale: '0.94', marginLeft: -80 }}
          >
            <MoreScreen />
          </PhoneFrame>
        </div>
      </div>
    </div>
  )
}
