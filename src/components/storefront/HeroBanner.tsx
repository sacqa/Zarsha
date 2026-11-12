import React, { useEffect, useState, useMemo } from 'react';
import {
  ArrowRight,
  Sparkles,
  Truck,
  Banknote,
  ShieldCheck,
  MessageCircle,
  PartyPopper,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Country, Currency, Product, StoreSettings } from '../../types/ecommerce';
import { formatMinorUnits, resolveProductPrice } from '../../utils/commerce-engine';
import { triggerFestiveConfetti } from '../common/FestiveConfetti';

const FALLBACK_HERO_BANNER_IMAGE = '/src/assets/images/pk_hero_fashion_sale_1794509750398.jpg';

interface HeroBannerProps {
  settings: StoreSettings;
  currentCountry: Country;
  currentCurrency: Currency;
  featuredProduct?: Product;
  onShopSale: () => void;
  onExploreNewArrivals: () => void;
  onInspectProduct?: (product: Product) => void;
}

/* Crisp SVG Hanging Festive Diamond Lantern (Fanoos) matching the poster aesthetic */
const HangingLanternSvg: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 100 220"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    {/* Hanging Cord */}
    <line x1="50" y1="0" x2="50" y2="28" stroke="#FFE066" strokeWidth="1.5" strokeOpacity="0.85" />
    {/* Top Crown */}
    <rect x="28" y="28" width="44" height="14" rx="2" fill="#E11D48" stroke="#FFC700" strokeWidth="1.5" />
    <circle cx="37" cy="35" r="2.2" fill="#FFE066" />
    <circle cx="50" cy="35" r="2.2" fill="#FFE066" />
    <circle cx="63" cy="35" r="2.2" fill="#FFE066" />
    {/* Outer Diamond Body */}
    <polygon
      points="50,42 90,78 50,114 10,78"
      fill="url(#lanternGlow)"
      stroke="#FFC700"
      strokeWidth="2.5"
    />
    {/* Inner Glowing Pane */}
    <polygon
      points="50,53 74,78 50,103 26,78"
      fill="#FFF4B8"
      stroke="#FF8800"
      strokeWidth="2"
    />
    {/* Lower Skirt */}
    <rect x="28" y="114" width="44" height="14" rx="2" fill="#0EA5E9" stroke="#FFC700" strokeWidth="1.5" />
    <circle cx="37" cy="121" r="2.2" fill="#FFE066" />
    <circle cx="50" cy="121" r="2.2" fill="#FFE066" />
    <circle cx="63" cy="121" r="2.2" fill="#FFE066" />
    {/* Golden Hanging Tassels */}
    <path d="M31 128 Q26 168 32 204" stroke="#FFC700" strokeWidth="3.5" strokeLinecap="round" />
    <path d="M40 128 Q45 170 39 210" stroke="#FF9900" strokeWidth="3.5" strokeLinecap="round" />
    <path d="M50 128 Q54 174 49 214" stroke="#FFE066" strokeWidth="4" strokeLinecap="round" />
    <path d="M60 128 Q56 170 62 210" stroke="#FF9900" strokeWidth="3.5" strokeLinecap="round" />
    <path d="M69 128 Q74 166 68 202" stroke="#FFC700" strokeWidth="3.5" strokeLinecap="round" />
    <defs>
      <radialGradient id="lanternGlow" cx="50%" cy="50%" r="55%">
        <stop offset="0%" stopColor="#FFF7CC" />
        <stop offset="55%" stopColor="#FF9900" />
        <stop offset="100%" stopColor="#C81E4B" />
      </radialGradient>
    </defs>
  </svg>
);

/* Festive Triangular Corner Bunting Pennant Garland */
const CornerBuntingSvg: React.FC<{ flip?: boolean; className?: string }> = ({
  flip = false,
  className = '',
}) => {
  const colors = ['#FFC700', '#10B981', '#FFFFFF', '#FF3B6B', '#0EA5E9', '#FF8800', '#FFFFFF', '#FFC700'];
  return (
    <svg
      viewBox="0 0 360 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${flip ? '-scale-x-100' : ''} ${className}`}
      aria-hidden="true"
    >
      {/* Top Row String */}
      <path d="M0 14 Q165 44 350 4" stroke="#FFE066" strokeWidth="1.6" strokeOpacity="0.85" />
      {colors.map((c, idx) => {
        const x = 14 + idx * 42;
        const y = 16 + Math.sin((idx / 7) * Math.PI) * 16;
        return (
          <polygon
            key={`r1-${idx}`}
            points={`${x},${y} ${x + 26},${y - 2} ${x + 11},${y + 34}`}
            fill={c}
            opacity="0.95"
          />
        );
      })}
      {/* Second Subtle Lower Row String */}
      <path d="M0 56 Q135 84 275 40" stroke="#FFE066" strokeWidth="1.2" strokeOpacity="0.65" />
      {colors.slice(0, 6).map((c, idx) => {
        const x = 8 + idx * 42;
        const y = 58 + Math.sin((idx / 5) * Math.PI) * 12;
        return (
          <polygon
            key={`r2-${idx}`}
            points={`${x},${y} ${x + 22},${y - 2} ${x + 9},${y + 28}`}
            fill={c}
            opacity="0.88"
          />
        );
      })}
    </svg>
  );
};

/* Subtle Golden Starburst Sparkle Motif */
const StarburstGlowSvg: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 240 240"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    {Array.from({ length: 24 }).map((_, i) => {
      const angle = (i * 15 * Math.PI) / 180;
      const r1 = 22;
      const r2 = i % 2 === 0 ? 112 : 76;
      const x1 = 120 + Math.cos(angle) * r1;
      const y1 = 120 + Math.sin(angle) * r1;
      const x2 = 120 + Math.cos(angle) * r2;
      const y2 = 120 + Math.sin(angle) * r2;
      return (
        <line
          key={i}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke="#FFC700"
          strokeWidth={i % 2 === 0 ? '1.8' : '1'}
          strokeLinecap="round"
          strokeOpacity="0.45"
        />
      );
    })}
    <circle cx="120" cy="120" r="18" fill="#FF9900" fillOpacity="0.22" />
  </svg>
);

export const HeroBanner: React.FC<HeroBannerProps> = ({
  settings,
  currentCountry,
  currentCurrency,
  featuredProduct,
  onShopSale,
  onExploreNewArrivals,
  onInspectProduct,
}) => {
  const [slideIdx, setSlideIdx] = useState(0);
  const [imgLoadFailed, setImgLoadFailed] = useState(false);

  const primaryConfiguredBanner = settings.heroBannerImage || FALLBACK_HERO_BANNER_IMAGE;
  const savedGallery = useMemo(() => {
    const list = (settings.heroBannerImages || []).filter(Boolean);
    if (!list.includes(primaryConfiguredBanner)) {
      return [primaryConfiguredBanner, ...list];
    }
    return [primaryConfiguredBanner, ...list.filter((u) => u !== primaryConfiguredBanner)];
  }, [primaryConfiguredBanner, settings.heroBannerImages]);

  const shouldRotate = Boolean(settings.heroBannerAutoRotate && savedGallery.length > 1);

  useEffect(() => {
    setSlideIdx(0);
    setImgLoadFailed(false);
  }, [primaryConfiguredBanner, shouldRotate]);

  useEffect(() => {
    if (!shouldRotate) return;
    const intervalMs = Math.max(2000, (settings.heroBannerRotateIntervalSec || 5) * 1000);
    const id = window.setInterval(() => {
      setImgLoadFailed(false);
      setSlideIdx((prev) => (prev + 1) % savedGallery.length);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [shouldRotate, savedGallery.length, settings.heroBannerRotateIntervalSec]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      triggerFestiveConfetti('hero');
    }, 350);
    return () => window.clearTimeout(timer);
  }, []);

  const activeBannerSrc = imgLoadFailed
    ? FALLBACK_HERO_BANNER_IMAGE
    : shouldRotate
    ? savedGallery[slideIdx % savedGallery.length] || primaryConfiguredBanner
    : primaryConfiguredBanner;

  const freeThresholdMinor = Math.round(
    (settings.freeShippingThresholdMinorUnits || 300000) * currentCurrency.exchangeRateToBase
  );

  const spotlightPriceMinor = featuredProduct
    ? resolveProductPrice(featuredProduct, currentCountry.code, currentCurrency)
    : 499000;

  return (
    <section
      data-testid="zariya-hero-banner"
      className="bg-[#240323] pt-3 sm:pt-4 pb-5 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-7xl mx-auto">
        <div
          className="relative rounded-[26px] sm:rounded-[32px] overflow-hidden border border-[#7A1870] shadow-2xl lg:h-[400px] flex flex-col justify-between"
          style={{
            background:
              'radial-gradient(circle at 28% 22%, rgba(255, 145, 0, 0.34) 0%, rgba(166, 26, 122, 0.28) 32%, rgba(36, 3, 35, 0.98) 72%), linear-gradient(135deg, #5E0E56 0%, #3A0738 48%, #210220 100%)',
          }}
        >
          {/* Poster Decorative Layer (Pointer Events None so CTAs & Text are unobstructed) */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
            {/* Festive Triangular Bunting Garlands */}
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 0.92, y: 0 }}
              transition={{ duration: 0.65, ease: 'easeOut' }}
            >
              <CornerBuntingSvg className="absolute -top-1 -left-2 w-40 sm:w-52 lg:w-60 opacity-90" />
              <CornerBuntingSvg flip className="hidden lg:block absolute -top-1 -right-2 w-52 opacity-85" />
            </motion.div>

            {/* Slowly Rotating Golden Starburst Fireworks Backdrop */}
            <StarburstGlowSvg className="animate-starburst-spin absolute -top-10 left-1/4 w-52 h-52 opacity-70" />
            <StarburstGlowSvg className="animate-starburst-spin hidden md:block absolute top-2 right-[38%] w-44 h-44 opacity-45" />

            {/* Hanging Gently Swaying Golden Fanoos Lanterns */}
            <HangingLanternSvg className="animate-lantern-sway hidden xl:block absolute -top-2 right-4 w-16 drop-shadow-[0_10px_24px_rgba(255,153,0,0.45)] opacity-95" />
            <HangingLanternSvg className="animate-lantern-sway hidden md:block absolute -top-3 left-[44%] w-10 opacity-65" />

            {/* Ambient Twinkling Poster Sparkles & Confetti Glints */}
            {[
              { top: '16%', left: '8%', color: '#FFC700', delay: '0s', size: 'w-2 h-2' },
              { top: '26%', left: '49%', color: '#FFFFFF', delay: '0.6s', size: 'w-1.5 h-1.5' },
              { top: '72%', left: '6%', color: '#FF9900', delay: '1.1s', size: 'w-2 h-2' },
              { top: '42%', left: '53%', color: '#10B981', delay: '1.5s', size: 'w-2 h-2 rotate-45 rounded-none' },
              { top: '20%', left: '62%', color: '#FFE066', delay: '0.9s', size: 'w-1.5 h-1.5' },
              { top: '65%', left: '48%', color: '#FF3B6B', delay: '1.8s', size: 'w-2 h-2 rotate-45 rounded-none' },
            ].map((dot, idx) => (
              <span
                key={idx}
                className={`animate-twinkle absolute rounded-full ${dot.size}`}
                style={{
                  top: dot.top,
                  left: dot.left,
                  backgroundColor: dot.color,
                  animationDelay: dot.delay,
                  boxShadow: `0 0 12px ${dot.color}`,
                }}
              />
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch flex-1 min-h-0 relative z-10">
            {/* Left Copy, Tilted Poster Typography & CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="lg:col-span-7 px-6 py-7 pt-11 sm:px-9 sm:py-8 lg:px-11 lg:py-5 flex flex-col justify-center space-y-2.5 sm:space-y-3 relative z-10"
            >
              {/* Poster-Style Tilted Festive Sale Placard (Click to Pop Confetti!) */}
              <div className="self-start">
                <motion.button
                  type="button"
                  onClick={() => triggerFestiveConfetti('hero')}
                  initial={{ opacity: 0, scale: 0.9, rotate: -6 }}
                  animate={{ opacity: 1, scale: 1, rotate: -2 }}
                  whileHover={{ scale: 1.03, rotate: -1 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                  title="Click for festive confetti!"
                  className="cta-shimmer text-left inline-block bg-gradient-to-br from-[#68125E] via-[#4D0B46] to-[#340630] border border-[#FFE066]/55 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl shadow-[0_10px_24px_rgba(0,0,0,0.45)] cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-2.5 text-[10px] font-extrabold uppercase tracking-[0.22em] text-[#FF9900]">
                    <span>ZARIYA FESTIVE EDITION</span>
                    <PartyPopper className="w-3 h-3 text-[#FFE066]" />
                  </div>
                  <div className="flex flex-wrap items-baseline gap-2 leading-none mt-0.5">
                    <span className="text-xl sm:text-2xl lg:text-[28px] font-black italic uppercase tracking-tight text-white drop-shadow-[0_2px_10px_rgba(255,199,0,0.28)]">
                      DHAMAKA
                    </span>
                    <span className="text-xl sm:text-2xl lg:text-[28px] font-black italic uppercase tracking-tight bg-gradient-to-b from-[#FFE066] to-[#FF7A00] bg-clip-text text-transparent">
                      SALE
                    </span>
                  </div>
                </motion.button>
              </div>

              {/* Main SEO / Campaign Headline */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-1.5"
              >
                <h1
                  data-testid="hero-headline"
                  className="text-2xl sm:text-3xl lg:text-[32px] font-extrabold text-white leading-[1.12] tracking-tight"
                  style={{ fontFamily: "'Poppins', sans-serif" }}
                >
                  {settings.heroHeadline || 'THE BIGGEST FASHION SALE IS HERE!'}
                </h1>

                <p className="text-xs sm:text-sm text-[#F3DDF0] max-w-xl leading-snug line-clamp-2">
                  {settings.heroDescription ||
                    'Discover Your Favourite Styles at Unbeatable Prices.'}{' '}
                  Hand-embroidered Pakistani lawn, luxury pret &amp; festive 3-piece ensembles.
                </p>
              </motion.div>

              {/* Poster Signature Double-Box Split Discount Callout: [ DISCOUNT ] [ UP TO 70% OFF ] */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                className="flex flex-wrap items-center gap-3"
              >
                <div className="inline-flex items-stretch border border-[#FFE066]/85 p-0.5 bg-[#1A0219]/90 shadow-lg">
                  <span className="bg-[#1A0219] px-3 py-1 text-[10px] sm:text-[11px] font-bold tracking-[0.18em] uppercase text-white flex items-center">
                    DISCOUNT
                  </span>
                  <span className="bg-gradient-to-r from-[#5E0E56] via-[#8F197E] to-[#6B1261] px-3.5 py-1 text-[11px] sm:text-xs font-extrabold tracking-wider uppercase text-[#FFE066] flex items-center tabular-nums">
                    UP TO 70% OFF
                  </span>
                </div>

                <span className="text-[11px] sm:text-xs font-semibold text-[#F9E6F7]">
                  Code <strong className="text-[#FFC700] tracking-wider">ZARIYA15</strong> · Extra 15% Off
                </span>
              </motion.div>

              {/* Primary CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.28, duration: 0.4 }}
                className="flex flex-wrap items-center gap-2.5 pt-0.5"
              >
                <motion.button
                  type="button"
                  data-testid="hero-shop-sale-btn"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    triggerFestiveConfetti('hero');
                    onShopSale();
                  }}
                  className="cta-shimmer px-5 sm:px-6 py-2.5 rounded-full bg-gradient-to-r from-[#FF7A00] via-[#FF9900] to-[#FFC700] hover:brightness-105 text-[#240323] text-xs font-extrabold tracking-wider uppercase inline-flex items-center gap-2 shadow-[0_8px_22px_rgba(255,153,0,0.35)] transition-all cursor-pointer"
                >
                  <span>{settings.heroPrimaryButtonText || 'SHOP SALE'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </motion.button>

                <motion.button
                  type="button"
                  data-testid="hero-new-arrivals-btn"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onExploreNewArrivals}
                  className="px-5 sm:px-6 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white border border-[#FFE066]/55 text-xs font-bold tracking-wider uppercase inline-flex items-center gap-2 backdrop-blur-xs transition-all cursor-pointer"
                >
                  <span>{settings.heroSecondaryButtonText || 'EXPLORE NEW ARRIVALS'}</span>
                </motion.button>
              </motion.div>
            </motion.div>

            {/* Right Fashion Campaign Photography in Golden Spotlight Arch */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="lg:col-span-5 relative h-56 sm:h-64 lg:h-full overflow-hidden flex items-end justify-center lg:pr-8 lg:pt-4"
            >
              <div className="relative w-full h-full rounded-t-[24px] lg:rounded-t-[130px] overflow-hidden border-2 border-[#FFC700]/45 shadow-[0_0_40px_rgba(255,153,0,0.28)]">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={activeBannerSrc}
                    src={activeBannerSrc}
                    initial={{ opacity: 0.35, scale: 1.03 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0.35 }}
                    transition={{ duration: 0.45, ease: 'easeOut' }}
                    onError={() => setImgLoadFailed(true)}
                    alt="Pakistani Fashion Campaign Models in Embroidered Eastern Wear"
                    className="w-full h-full object-cover object-top"
                    referrerPolicy="no-referrer"
                  />
                </AnimatePresence>
                <div className="absolute inset-0 bg-gradient-to-t from-[#240323]/80 via-transparent to-transparent pointer-events-none" />

                {shouldRotate && savedGallery.length > 1 && (
                  <div className="absolute top-3 right-3 sm:right-5 z-20 flex items-center gap-1.5 bg-[#240323]/75 backdrop-blur-xs px-2.5 py-1 rounded-full border border-[#FFC700]/40">
                    {savedGallery.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        aria-label={`View hero banner ${i + 1}`}
                        onClick={() => {
                          setImgLoadFailed(false);
                          setSlideIdx(i);
                        }}
                        className={`h-1.5 rounded-full transition-all cursor-pointer ${
                          i === slideIdx % savedGallery.length
                            ? 'w-4 bg-[#FFC700]'
                            : 'w-1.5 bg-white/45 hover:bg-white/80'
                        }`}
                      />
                    ))}
                  </div>
                )}

                {/* Floating Spotlight Card */}
                {featuredProduct && onInspectProduct && (
                  <motion.button
                    type="button"
                    whileHover={{ y: -3, scale: 1.02 }}
                    onClick={() => onInspectProduct(featuredProduct)}
                    className="animate-float-slow absolute bottom-3 left-3 right-3 sm:left-auto sm:right-4 sm:bottom-3.5 bg-[#240323]/92 backdrop-blur-md border border-[#FFC700]/50 rounded-2xl p-2.5 flex items-center gap-2.5 shadow-xl hover:border-[#FFE066] transition-colors text-left sm:max-w-[245px] cursor-pointer"
                  >
                    <img
                      src={featuredProduct.galleryImages[0]}
                      alt={featuredProduct.name}
                      className="w-10 h-12 rounded-xl object-cover border border-[#FFC700]/40 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0">
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-gradient-to-r from-[#FF7A00] to-[#FFC700] text-[#240323] text-[8px] font-extrabold uppercase tracking-wider mb-0.5">
                        <Sparkles className="w-2.5 h-2.5" />
                        <span>Season Highlight</span>
                      </span>
                      <div className="text-[11px] font-bold text-white truncate">
                        {featuredProduct.name}
                      </div>
                      <div className="text-[11px] font-extrabold text-[#FFC700] tabular-nums">
                        {formatMinorUnits(spotlightPriceMinor, currentCurrency)}
                      </div>
                    </div>
                  </motion.button>
                )}
              </div>
            </motion.div>
          </div>

          {/* Bottom Service Guarantee Bar */}
          <div className="bg-[#180117]/95 border-t border-[#661760] px-5 sm:px-6 py-2.5 grid grid-cols-2 lg:grid-cols-4 gap-2 text-[11px] font-medium text-[#F5E4F3] relative z-10 shrink-0">
            <div className="flex items-center gap-2">
              <Banknote className="w-3.5 h-3.5 text-[#FFC700] shrink-0" />
              <span className="truncate">Cash on Delivery All Over Pakistan</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="w-3.5 h-3.5 text-[#FFC700] shrink-0" />
              <span className="truncate">
                Free Delivery Above{' '}
                <strong className="tabular-nums text-[#FFE066]">
                  {formatMinorUnits(freeThresholdMinor, currentCurrency)}
                </strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-[#FF9900] shrink-0" />
              <span className="truncate">100% Original Fabrics &amp; Embroidery</span>
            </div>
            <a
              href="https://wa.me/923008429100"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 hover:text-[#FFC700] transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate">WhatsApp Help: {settings.whatsappNumber || '+92 300 8429100'}</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
