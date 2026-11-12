import React, { useState } from 'react';
import {
  ArrowRight,
  ChevronDown,
  Truck,
  Banknote,
  RotateCcw,
  MessageCircle,
  Sparkles,
  Star,
  BookOpen,
  Clock,
  Heart,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BlogPost,
  Category,
  Country,
  Currency,
  Product,
  ProductVariant,
  StoreSettings,
} from '../../types/ecommerce';
import { ProductCard } from './ProductCard';

export const staggerContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

export const staggerItemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export const staggerCardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
  },
};

// ============================================================================
// 1. IMAGE-BASED 10-CATEGORY SHOWCASE
// ============================================================================
interface ZariyaCategoryShowcaseProps {
  categories: Category[];
  onSelectCategory: (categoryId: string) => void;
  onViewAllCollections: () => void;
}

export const ZariyaCategoryShowcase: React.FC<ZariyaCategoryShowcaseProps> = ({
  categories,
  onSelectCategory,
  onViewAllCollections,
}) => {
  return (
    <section
      id="categories"
      data-testid="zariya-category-showcase"
      className="bg-[#240323] py-10 sm:py-14 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#FFC700]">
              Explore By Style
            </span>
            <h2
              className="text-2xl sm:text-3xl font-bold text-white"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              Shop Pakistani Fashion Categories
            </h2>
          </div>
          <button
            type="button"
            onClick={onViewAllCollections}
            className="text-xs font-bold text-[#FFC700] hover:underline inline-flex items-center gap-1 self-start sm:self-auto cursor-pointer"
          >
            <span>View All Collections</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <motion.div
          variants={staggerContainerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5 sm:gap-4"
        >
          {categories.map((cat) => (
            <motion.button
              key={cat.id}
              type="button"
              variants={staggerCardVariants}
              whileHover={{ y: -3 }}
              data-testid={`category-tile-${cat.id}`}
              onClick={() => onSelectCategory(cat.id)}
              className="group relative rounded-2xl overflow-hidden bg-[#340732] border border-[#681962] hover:border-[#FFC700] text-left transition-all cursor-pointer shadow-md"
            >
              <div className="aspect-[4/5] overflow-hidden">
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#240323]/90 via-[#240323]/25 to-transparent" />
              </div>

              <div className="absolute inset-x-0 bottom-0 p-3 sm:p-3.5 text-white">
                <div
                  className="text-xs sm:text-sm font-bold leading-snug"
                  style={{ fontFamily: "'Poppins', sans-serif" }}
                >
                  {cat.name}
                </div>
                <div className="text-[10px] font-semibold text-[#FFC700] flex items-center gap-1 mt-0.5">
                  <span>Shop Now</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </motion.button>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

// ============================================================================
// 2. REUSABLE 4-COL DESKTOP / 2-COL MOBILE FEATURED PRODUCT BAND
// ============================================================================
interface ZariyaFeaturedProductBandProps {
  id?: string;
  eyebrow: string;
  title: string;
  subtitle?: string;
  products: Product[];
  currentCountry: Country;
  currentCurrency: Currency;
  wishlistIds: string[];
  onToggleWishlist: (productId: string) => void;
  onViewProduct: (product: Product) => void;
  onAddToCart: (product: Product, variant?: ProductVariant, quantity?: number) => void;
  onViewAll: () => void;
  viewAllLabel?: string;
  variantStyle?: 'ivory' | 'blush' | 'beige';
}

export const ZariyaFeaturedProductBand: React.FC<ZariyaFeaturedProductBandProps> = ({
  id,
  eyebrow,
  title,
  subtitle,
  products,
  currentCountry,
  currentCurrency,
  wishlistIds,
  onToggleWishlist,
  onViewProduct,
  onAddToCart,
  onViewAll,
  viewAllLabel = 'View All',
  variantStyle = 'ivory',
}) => {
  if (!products || products.length === 0) return null;

  const bgClass =
    variantStyle === 'blush'
      ? 'bg-gradient-to-b from-[#3E083C] via-[#4E0C47] to-[#360734] border-y border-[#7A1870]/70'
      : variantStyle === 'beige'
      ? 'bg-[#2E062D] border-y border-[#5E1659]/70'
      : 'bg-[#240323]';

  return (
    <section
      id={id}
      data-testid={id ? `section-${id}` : undefined}
      className={`${bgClass} py-11 sm:py-14 px-4 sm:px-6 lg:px-8`}
    >
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-[#FFC700]">
                <Sparkles className="w-3 h-3 text-[#FF9900]" />
                <span>{eyebrow}</span>
              </span>

              {id === 'sale-sale-sale' && (
                <span className="inline-flex items-stretch border border-[#FFE066]/75 p-0.5 bg-[#1B021B] text-[10px] font-extrabold uppercase tracking-wider">
                  <span className="px-2 py-0.5 text-white">DISCOUNT</span>
                  <span className="px-2 py-0.5 bg-[#7A1870] text-[#FFE066]">UP TO 70%</span>
                </span>
              )}
            </div>
            <h2
              className="text-2xl sm:text-3xl font-bold text-white"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              {title}
            </h2>
            {subtitle && <p className="text-xs sm:text-sm text-[#E9CEE6]">{subtitle}</p>}
          </div>

          <button
            type="button"
            onClick={onViewAll}
            className="px-4 py-2 rounded-full bg-[#3A0738] border border-[#FFC700]/45 hover:bg-gradient-to-r hover:from-[#FF7A00] hover:to-[#FFC700] text-xs font-bold text-[#FFE066] hover:text-[#240323] inline-flex items-center gap-1.5 self-start sm:self-auto transition-all cursor-pointer shrink-0"
          >
            <span>{viewAllLabel}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <motion.div
          variants={staggerContainerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.08 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
        >
          {products.slice(0, 4).map((product) => (
            <motion.div key={product.id} variants={staggerCardVariants}>
              <ProductCard
                product={product}
                currentCountry={currentCountry}
                currentCurrency={currentCurrency}
                isWishlisted={wishlistIds.includes(product.id)}
                onToggleWishlist={onToggleWishlist}
                onViewProduct={onViewProduct}
                onAddToCart={onAddToCart}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

// ============================================================================
// 3. PROMOTIONAL MID-CAMPAIGN BANNER (FESTIVE / CHIFFON SALE)
// ============================================================================
interface ZariyaPromotionalMidBannerProps {
  onShopSale: () => void;
  onExploreLuxury: () => void;
}

export const ZariyaPromotionalMidBanner: React.FC<ZariyaPromotionalMidBannerProps> = ({
  onShopSale,
  onExploreLuxury,
}) => {
  return (
    <section className="bg-[#240323] py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-7xl mx-auto rounded-[28px] overflow-hidden relative text-white border border-[#FFC700]/45 shadow-2xl"
        style={{
          background:
            'radial-gradient(circle at 20% 30%, rgba(255, 145, 0, 0.28), transparent 55%), linear-gradient(120deg, #5E0E56 0%, #3E083C 50%, #240323 100%)',
        }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 items-center">
          <div className="lg:col-span-6 p-7 sm:p-12 space-y-4 relative z-10">
            <div className="inline-flex items-stretch border border-[#FFE066]/80 p-0.5 bg-[#1B021B] text-[10px] font-extrabold uppercase tracking-wider">
              <span className="px-2.5 py-1 text-white">FESTIVE OFFER</span>
              <span className="px-3 py-1 bg-gradient-to-r from-[#FF7A00] to-[#FFC700] text-[#240323]">
                FLAT 30% OFF
              </span>
            </div>

            <h2
              className="text-2xl sm:text-4xl font-extrabold leading-tight text-white"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              Flat 30% Off Selected Festive Chiffon &amp; Organza Pret
            </h2>
            <p className="text-xs sm:text-sm text-[#F3DDF0] leading-relaxed max-w-md">
              Hand-embellished dupattas, tilla embroidery, and luminous silhouettes tailored for Pakistani weddings, dholkis, and Eid evenings.
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <button
                type="button"
                onClick={onShopSale}
                className="cta-shimmer px-6 py-3 rounded-full bg-gradient-to-r from-[#FF7A00] to-[#FFC700] hover:brightness-105 text-[#240323] text-xs font-extrabold uppercase tracking-wider inline-flex items-center gap-2 cursor-pointer shadow-md"
              >
                <span>Shop Festive Sale</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={onExploreLuxury}
                className="px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white border border-[#FFE066]/45 text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                Explore Chiffon
              </button>
            </div>
          </div>

          <div className="lg:col-span-6 relative h-64 sm:h-80 lg:h-[380px]">
            <img
              src="/src/assets/images/pk_festive_campaign_1794509751042.jpg"
              alt="Pakistani Festive Wear Fashion Campaign"
              className="w-full h-full object-cover object-center"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
            <div className="hidden lg:block absolute inset-0 bg-gradient-to-r from-[#2D052B] via-transparent to-transparent" />
          </div>
        </div>
      </motion.div>
    </section>
  );
};

// ============================================================================
// 4. PAKISTANI SHOPPING PROMISE / TRUST STRIP
// ============================================================================
export const ZariyaTrustStrip: React.FC<{ settings: StoreSettings }> = ({ settings }) => {
  const pillars = [
    {
      icon: Banknote,
      title: 'Cash on Delivery (COD)',
      desc: 'Pay comfortably at your doorstep across Lahore, Karachi, Islamabad & nationwide.',
    },
    {
      icon: Truck,
      title: 'Free Delivery Rs. 3,000+',
      desc: 'Flat Rs. 200 TCS/Leopards courier under Rs. 3,000. Free nationwide shipping above.',
    },
    {
      icon: RotateCcw,
      title: '7-Day Easy Exchange',
      desc: 'Simple size exchange or return on unworn tagged garments within 7 days.',
    },
    {
      icon: MessageCircle,
      title: 'WhatsApp Stylist Help',
      desc: `Direct order assistance & sizing guidance on ${settings.whatsappNumber || '+92 300 8429100'}.`,
    },
  ];

  return (
    <section className="bg-[#31062F] border-y border-[#661760] py-8 px-4 sm:px-6 lg:px-8">
      <motion.div
        variants={staggerContainerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
        className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
      >
        {pillars.map((p) => {
          const Icon = p.icon;
          return (
            <motion.div
              key={p.title}
              variants={staggerItemVariants}
              whileHover={{ y: -3 }}
              className="flex items-start gap-3.5 p-4 rounded-2xl bg-[#240323] border border-[#681962] hover:border-[#FFC700]/60 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-[#4E0C47] border border-[#FFC700]/40 text-[#FFC700] flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-xs font-bold text-white">{p.title}</h3>
                <p className="text-[11px] text-[#E3C4DF] leading-relaxed">{p.desc}</p>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </section>
  );
};

// ============================================================================
// 5. ZARIYA BRAND STORY (LAHORE ATELIER)
// ============================================================================
export const ZariyaBrandStory: React.FC<{
  settings: StoreSettings;
  onExploreShop: () => void;
  onOpenAbout: () => void;
}> = ({ settings, onExploreShop, onOpenAbout }) => {
  return (
    <section
      id="brand-story"
      className="bg-[#240323] py-12 sm:py-16 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        <div className="lg:col-span-6 space-y-4">
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#FFC700]">
            Crafted in Pakistan
          </span>
          <h2
            className="text-2xl sm:text-4xl font-bold text-white leading-tight"
            style={{ fontFamily: "'Poppins', sans-serif" }}
          >
            Modern Pakistani Silhouettes, Rooted in Heritage Looms
          </h2>
          <p className="text-xs sm:text-sm text-[#E9CEE6] leading-relaxed">
            Born in Gulberg, Lahore, {settings.storeName} brings together fine Swiss voile lawn, pure winter khaddar, and hand-worked festive organza at honest prices. Whether you love tailored ready-to-wear kurtis or classic 3-piece unstitched suits, every piece is inspected for stitch strength, dye fastness, and graceful drape.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onExploreShop}
              className="px-6 py-3 rounded-full bg-gradient-to-r from-[#FF7A00] to-[#FFC700] hover:brightness-105 text-[#240323] text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer shadow-md"
            >
              Shop New Season
            </button>
            <button
              type="button"
              onClick={onOpenAbout}
              className="px-6 py-3 rounded-full border border-[#FFC700]/45 bg-[#340732] hover:bg-[#490B45] text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
            >
              Read Our Story
            </button>
          </div>
        </div>

        <div className="lg:col-span-6">
          <div className="rounded-[28px] overflow-hidden bg-[#340732] border border-[#FFC700]/35 p-3 sm:p-4 shadow-xl">
            <img
              src="/src/assets/images/pk_editorial_atelier_1794509750649.jpg"
              alt="ZARIYA Lahore Pakistani Embroidery Atelier"
              className="w-full aspect-[16/10] object-cover rounded-2xl"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

// ============================================================================
// 6. VERIFIED PAKISTANI CUSTOMER REVIEWS CAROUSEL
// ============================================================================
export const ZariyaCustomerReviews: React.FC<{
  products: Product[];
  onViewProduct: (product: Product) => void;
}> = ({ products, onViewProduct }) => {
  const reviewCards = products
    .flatMap((p) =>
      (p.reviews || []).map((r) => ({
        ...r,
        product: p,
      }))
    )
    .slice(0, 3);

  if (reviewCards.length === 0) return null;

  return (
    <section className="bg-[#340732] border-y border-[#661760] py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center space-y-1.5">
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#FFC700]">
            Loved Across Pakistan
          </span>
          <h2
            className="text-2xl sm:text-3xl font-bold text-white"
            style={{ fontFamily: "'Poppins', sans-serif" }}
          >
            What Our Shoppers Say
          </h2>
        </div>

        <motion.div
          variants={staggerContainerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.12 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-5"
        >
          {reviewCards.map((item) => (
            <motion.div
              key={item.id}
              variants={staggerCardVariants}
              whileHover={{ y: -4 }}
              className="bg-[#240323] rounded-2xl border border-[#681962] hover:border-[#FFC700]/65 p-5 space-y-3 flex flex-col justify-between shadow-md transition-colors"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-0.5 text-[#FFC700]">
                    {Array.from({ length: item.rating }).map((_, idx) => (
                      <Star key={idx} className="w-3.5 h-3.5 fill-current" />
                    ))}
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-300 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                    Verified Purchase
                  </span>
                </div>
                <div className="text-xs font-bold text-white">{item.title}</div>
                <p className="text-xs text-[#E9CEE6] leading-relaxed">“{item.comment}”</p>
              </div>

              <div className="pt-3 border-t border-[#5E1659] flex items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-bold text-white">{item.author}</div>
                  <div className="text-[10px] text-[#D8B6D5]">{item.city}</div>
                </div>
                <button
                  type="button"
                  onClick={() => onViewProduct(item.product)}
                  className="text-[11px] font-bold text-[#FFC700] hover:underline truncate max-w-[140px] cursor-pointer"
                >
                  {item.product.name} →
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

// ============================================================================
// 7. STYLE JOURNAL BLOG PREVIEW
// ============================================================================
export const ZariyaStyleJournal: React.FC<{
  posts: BlogPost[];
  onOpenBlog: () => void;
}> = ({ posts, onOpenBlog }) => {
  if (!posts || posts.length === 0) return null;
  return (
    <section className="bg-[#240323] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-end justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#FFC700]">
              Style &amp; Fabric Care
            </span>
            <h2
              className="text-2xl sm:text-3xl font-bold text-white"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              The ZARIYA Fashion Journal
            </h2>
          </div>
          <button
            type="button"
            onClick={onOpenBlog}
            className="text-xs font-bold text-[#FFC700] hover:underline inline-flex items-center gap-1 cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Read All Guides</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {posts.slice(0, 3).map((post) => (
            <button
              key={post.id}
              type="button"
              onClick={onOpenBlog}
              className="text-left bg-[#340732] rounded-2xl border border-[#681962] hover:border-[#FFC700] overflow-hidden transition-all cursor-pointer group shadow-md"
            >
              <div className="aspect-[16/10] bg-[#4A0D46] overflow-hidden">
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="p-4 space-y-2">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[#FFC700]">
                  <span>{post.category}</span>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1 text-[#E3C4DF]">
                    <Clock className="w-3 h-3" /> {post.readTime}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white group-hover:text-[#FFC700] line-clamp-2">
                  {post.title}
                </h3>
                <p className="text-xs text-[#E3C4DF] line-clamp-2">{post.excerpt}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

// ============================================================================
// 8. FAQ SECTION (SHIPPING, COD, SIZES, EXCHANGE)
// ============================================================================
export const ZariyaFaqSection: React.FC<{
  settings: StoreSettings;
  onOpenContact: () => void;
}> = ({ settings, onOpenContact }) => {
  const [openIdx, setOpenIdx] = useState(0);

  const faqs = [
    {
      num: '01',
      q: 'How does Cash on Delivery (COD) and Free Shipping work across Pakistan?',
      a: 'We deliver all across Pakistan via TCS and Leopards Courier. Orders of Rs. 3,000 or more qualify for Free Delivery nationwide. Below Rs. 3,000, standard shipping is just Rs. 200. You can pay cash to the rider at your doorstep or use Bank Transfer (IBFT), JazzCash, Easypaisa, or Card.',
    },
    {
      num: '02',
      q: 'What is included in your 3-Piece Lawn & Chiffon Suits?',
      a: 'Stitched 3-Piece suits include a tailored embroidered shirt, matching trouser, and dupatta. Unstitched 3-Piece suits come with 3.0m shirt fabric, embroidered motifs/borders, 2.5m dupatta (voile, chiffon, or organza), and 2.5m dyed trouser fabric.',
    },
    {
      num: '03',
      q: 'Can I exchange a size if it does not fit me?',
      a: 'Yes! Unworn garments with original tags and packaging can be exchanged within 7 days of delivery. Contact our Lahore support team on WhatsApp at +92 300 8429100 with your order number.',
    },
    {
      num: '04',
      q: 'How long will delivery take to Lahore, Karachi, Islamabad, and other cities?',
      a: 'Same-day courier is available in Lahore. Major cities (Karachi, Islamabad, Rawalpindi, Faisalabad, Multan) receive parcels within 2–3 business days. Other cities across Punjab, Sindh, KPK, and Balochistan deliver within 3–5 business days.',
    },
  ];

  return (
    <section className="bg-[#31062F] border-t border-[#661760] py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-5 space-y-5">
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#FFC700]">
              Need Help?
            </span>
            <h2
              className="text-2xl sm:text-3xl font-bold text-white"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              Frequently Asked Questions
            </h2>
            <p className="text-xs sm:text-sm text-[#E9CEE6]">
              Everything about ZARIYA Pakistani sizing, fabric care, Cash on Delivery, and easy exchanges.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-gradient-to-br from-[#5E0E56] to-[#3A0738] border border-[#FFC700]/40 text-white space-y-3 shadow-lg">
            <h3 className="text-base font-bold text-[#FFE066]">Need Sizing or Fabric Advice?</h3>
            <p className="text-xs text-[#F3DDF0] leading-relaxed">
              Message our Lahore styling team directly on WhatsApp or visit our Contact page for instant help with custom orders and tracking.
            </p>
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <a
                href="https://wa.me/923008429100"
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-full bg-gradient-to-r from-[#FF7A00] to-[#FFC700] text-[#240323] text-xs font-extrabold inline-flex items-center gap-1.5"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp {settings.whatsappNumber || '+92 300 8429100'}</span>
              </a>
              <button
                type="button"
                onClick={onOpenContact}
                className="px-4 py-2 rounded-full border border-white/40 text-white text-xs font-bold hover:bg-white/10 cursor-pointer"
              >
                Contact Us
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 space-y-3">
          {faqs.map((item, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={item.num}
                className="rounded-2xl bg-[#240323] border border-[#681962] overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setOpenIdx(isOpen ? -1 : idx)}
                  className="w-full p-4 sm:p-5 flex items-center justify-between gap-4 text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-[#4E0C47] border border-[#FFC700]/40 text-[#FFC700] text-xs font-bold flex items-center justify-center shrink-0 tabular-nums">
                      {item.num}
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-white">
                      {item.q}
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-[#D8B6D5] transition-transform shrink-0 ${
                      isOpen ? 'rotate-180 text-[#FFC700]' : ''
                    }`}
                  />
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-4 pl-15 text-xs text-[#E9CEE6] leading-relaxed">
                        {item.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

// ============================================================================
// 9. RECENTLY VIEWED STRIP
// ============================================================================
export const ZariyaRecentlyViewedStrip: React.FC<{
  products: Product[];
  recentIds: string[];
  currentCountry: Country;
  currentCurrency: Currency;
  wishlistIds: string[];
  onToggleWishlist: (productId: string) => void;
  onViewProduct: (product: Product) => void;
  onAddToCart: (product: Product, variant?: ProductVariant, quantity?: number) => void;
}> = ({
  products,
  recentIds,
  currentCountry,
  currentCurrency,
  wishlistIds,
  onToggleWishlist,
  onViewProduct,
  onAddToCart,
}) => {
  const recentProducts = recentIds
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is Product => Boolean(p))
    .slice(0, 4);

  if (recentProducts.length === 0) return null;

  return (
    <section className="bg-[#240323] border-t border-[#5E1659] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <h3
            className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2"
            style={{ fontFamily: "'Poppins', sans-serif" }}
          >
            <Heart className="w-5 h-5 text-[#FFC700]" />
            <span>Recently Viewed Outfits</span>
          </h3>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {recentProducts.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              currentCountry={currentCountry}
              currentCurrency={currentCurrency}
              isWishlisted={wishlistIds.includes(p.id)}
              onToggleWishlist={onToggleWishlist}
              onViewProduct={onViewProduct}
              onAddToCart={onAddToCart}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
