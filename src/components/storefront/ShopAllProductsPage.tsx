import React, { useState, useMemo } from 'react';
import {
  Search,
  SlidersHorizontal,
  ArrowLeft,
  X,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import {
  Category,
  Country,
  Currency,
  Product,
  ProductCollection,
  ProductVariant,
} from '../../types/ecommerce';
import { resolveProductPrice } from '../../utils/commerce-engine';
import { ProductCard } from './ProductCard';

export type ShopMode = 'all' | 'sale' | 'new_arrivals' | 'best_sellers' | 'under_1999';

export function extractProductSizes(product: Product): string[] {
  const sizes = new Set<string>(product.sizes || []);
  product.variants.forEach((v) => {
    if (v.attributes?.Size) sizes.add(v.attributes.Size);
  });
  return Array.from(sizes);
}

export function extractProductColors(product: Product): string[] {
  const colors = new Set<string>(product.colors || []);
  product.variants.forEach((v) => {
    if (v.attributes?.Color) colors.add(v.attributes.Color);
  });
  return Array.from(colors);
}

interface ShopAllProductsPageProps {
  products: Product[];
  categories: Category[];
  collections: ProductCollection[];
  currentCountry: Country;
  currentCurrency: Currency;
  defaultProductsPerPage?: number;
  initialCategory?: string;
  initialSearchQuery?: string;
  shopMode?: ShopMode;
  wishlistIds?: string[];
  onToggleWishlist?: (productId: string) => void;
  onBackToHome: () => void;
  onViewProduct: (product: Product) => void;
  onAddToCart: (product: Product, variant?: ProductVariant, quantity?: number) => void;
}

export const ShopAllProductsPage: React.FC<ShopAllProductsPageProps> = ({
  products,
  categories,
  currentCountry,
  currentCurrency,
  defaultProductsPerPage = 12,
  initialCategory = 'all',
  initialSearchQuery = '',
  shopMode = 'all',
  wishlistIds = [],
  onToggleWishlist,
  onBackToHome,
  onViewProduct,
  onAddToCart,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [searchQuery, setSearchQuery] = useState<string>(initialSearchQuery);
  const [pricePreset, setPricePreset] = useState<'all' | 'under_1999' | '2000_4999' | '5000_plus'>(
    shopMode === 'under_1999' ? 'under_1999' : 'all'
  );
  const [selectedSize, setSelectedSize] = useState<string>('all');
  const [selectedFabric, setSelectedFabric] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'featured' | 'best_selling' | 'price_asc' | 'price_desc' | 'discount_desc'>(
    shopMode === 'best_sellers' ? 'best_selling' : shopMode === 'sale' ? 'discount_desc' : 'featured'
  );
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const publishedProducts = useMemo(
    () => products.filter((p) => p.status === 'published'),
    [products]
  );

  const allSizes = useMemo(() => {
    const s = new Set<string>();
    publishedProducts.forEach((p) => extractProductSizes(p).forEach((sz) => s.add(sz)));
    return Array.from(s);
  }, [publishedProducts]);

  const allFabrics = useMemo(() => {
    const f = new Set<string>();
    publishedProducts.forEach((p) => {
      if (p.fabric) f.add(p.fabric);
    });
    return Array.from(f);
  }, [publishedProducts]);

  const filteredProducts = useMemo(() => {
    return publishedProducts
      .filter((p) => {
        if (selectedCategory !== 'all' && p.categoryId !== selectedCategory) return false;

        if (shopMode === 'new_arrivals') {
          const hasNewTag = (p.tags || []).some((t) => t.toLowerCase().includes('new'));
          if (!hasNewTag && !p.collectionIds?.includes('col_new_arrivals')) return false;
        }

        if (shopMode === 'sale') {
          const compare = p.compareAtPriceMinorUnits || p.variants[0]?.compareAtPriceMinorUnits || 0;
          if (compare <= p.basePriceMinorUnits) return false;
        }

        if (selectedSize !== 'all') {
          const sizes = extractProductSizes(p);
          if (!sizes.includes(selectedSize)) return false;
        }

        if (selectedFabric !== 'all' && p.fabric !== selectedFabric) return false;

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const hit =
            p.name.toLowerCase().includes(q) ||
            p.brand.toLowerCase().includes(q) ||
            (p.fabric || '').toLowerCase().includes(q) ||
            p.shortDescription.toLowerCase().includes(q) ||
            (p.tags || []).some((t) => t.toLowerCase().includes(q));
          if (!hit) return false;
        }

        const priceMinor = resolveProductPrice(p, currentCountry.code, currentCurrency);
        // Minor units are always major * 100 in catalog storage
        const priceMajor = priceMinor / 100;
        if (pricePreset === 'under_1999' && priceMajor > 1999) return false;
        if (pricePreset === '2000_4999' && (priceMajor < 2000 || priceMajor > 4999)) return false;
        if (pricePreset === '5000_plus' && priceMajor < 5000) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'best_selling') return (b.salesCount || 0) - (a.salesCount || 0);
        if (sortBy === 'price_asc') {
          return (
            resolveProductPrice(a, currentCountry.code, currentCurrency) -
            resolveProductPrice(b, currentCountry.code, currentCurrency)
          );
        }
        if (sortBy === 'price_desc') {
          return (
            resolveProductPrice(b, currentCountry.code, currentCurrency) -
            resolveProductPrice(a, currentCountry.code, currentCurrency)
          );
        }
        if (sortBy === 'discount_desc') {
          const discA = a.compareAtPriceMinorUnits
            ? (a.compareAtPriceMinorUnits - a.basePriceMinorUnits) / a.compareAtPriceMinorUnits
            : 0;
          const discB = b.compareAtPriceMinorUnits
            ? (b.compareAtPriceMinorUnits - b.basePriceMinorUnits) / b.compareAtPriceMinorUnits
            : 0;
          return discB - discA;
        }
        return Number(b.featured) - Number(a.featured);
      });
  }, [
    publishedProducts,
    selectedCategory,
    shopMode,
    selectedSize,
    selectedFabric,
    searchQuery,
    pricePreset,
    sortBy,
    currentCountry.code,
    currentCurrency,
  ]);

  const pageHeading =
    shopMode === 'sale'
      ? 'SALE SALE SALE — Up to 70% Off'
      : shopMode === 'new_arrivals'
      ? 'New Arrivals — Fresh Season Drop'
      : shopMode === 'best_sellers'
      ? 'Best Selling Pakistani Suits'
      : shopMode === 'under_1999'
      ? 'Steal Deals Under Rs. 1,999'
      : 'Shop All Pakistani Women’s Wear';

  const resetFilters = () => {
    setSelectedCategory('all');
    setSearchQuery('');
    setPricePreset('all');
    setSelectedSize('all');
    setSelectedFabric('all');
    setSortBy('featured');
  };

  return (
    <div
      data-testid="shop-all-products-page"
      className="bg-[#240323] text-white min-h-screen pb-16"
    >
      {/* Top Hero Header */}
      <div
        className="border-b border-[#661760]"
        style={{
          background:
            'radial-gradient(circle at 20% 25%, rgba(255, 145, 0, 0.24), transparent 55%), linear-gradient(120deg, #5C0E54 0%, #3A0738 55%, #240323 100%)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-3">
          <button
            type="button"
            onClick={onBackToHome}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#E9CEE6] hover:text-[#FFC700] cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </button>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-[#FFC700]">
                <Sparkles className="w-3.5 h-3.5" />
                <span>ZARIYA Pakistan • Cash on Delivery Available</span>
              </div>
              <h1
                className="text-2xl sm:text-4xl font-extrabold text-white"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                {pageHeading}
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-[#E9CEE6] tabular-nums">
              Showing <strong className="text-[#FFC700]">{filteredProducts.length}</strong> of{' '}
              {publishedProducts.length} outfits (Up to {defaultProductsPerPage}+ styles ready to ship)
            </p>
          </div>
        </div>
      </div>

      {/* Category Filter Strip */}
      <div className="bg-[#31062F] border-b border-[#5E1659]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-gradient-to-r from-[#FF7A00] to-[#FFC700] text-[#240323]'
                : 'bg-[#240323] text-white border border-[#681962] hover:border-[#FFC700]'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-gradient-to-r from-[#FF7A00] to-[#FFC700] text-[#240323]'
                  : 'bg-[#240323] text-white border border-[#681962] hover:border-[#FFC700]'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Filter Toolbar & Results Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#340732] p-4 rounded-2xl border border-[#681962]">
          {/* Search + Mobile Filter Trigger */}
          <div className="flex items-center gap-2 flex-1">
            <div className="relative grow max-w-md">
              <Search className="w-4 h-4 text-[#D8B6D5] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search lawn, organza, kurti, chiffon..."
                className="w-full pl-9 pr-4 py-2 rounded-full bg-[#240323] border border-[#6B1A64] text-xs text-white placeholder-[#D8B6D5] focus:outline-hidden focus:border-[#FFC700]"
              />
            </div>

            <button
              type="button"
              onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
              className="lg:hidden px-3.5 py-2 rounded-full border border-[#FFC700]/50 bg-[#4E0C47] text-xs font-bold text-[#FFE066] inline-flex items-center gap-1.5 cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters</span>
            </button>
          </div>

          {/* Desktop Inline Controls */}
          <div className="hidden lg:flex flex-wrap items-center gap-2.5 text-xs">
            {/* Price Presets */}
            <div className="flex items-center gap-1.5">
              {[
                { id: 'all', label: 'All Prices' },
                { id: 'under_1999', label: 'Under Rs. 1,999' },
                { id: '2000_4999', label: 'Rs. 2,000 – 4,999' },
                { id: '5000_plus', label: 'Rs. 5,000+' },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPricePreset(p.id as any)}
                  className={`px-3 py-1.5 rounded-full font-semibold transition-colors cursor-pointer ${
                    pricePreset === p.id
                      ? 'bg-[#FFC700] text-[#240323] font-bold'
                      : 'bg-[#240323] text-[#E9CEE6] hover:text-white border border-[#5E1659]'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Size Dropdown */}
            <select
              value={selectedSize}
              onChange={(e) => setSelectedSize(e.target.value)}
              aria-label="Filter by size"
              className="bg-[#240323] border border-[#681962] rounded-full px-3 py-1.5 font-semibold text-white"
            >
              <option value="all" className="bg-[#240323]">All Sizes</option>
              {allSizes.map((s) => (
                <option key={s} value={s} className="bg-[#240323]">
                  Size: {s}
                </option>
              ))}
            </select>

            {/* Fabric Dropdown */}
            <select
              value={selectedFabric}
              onChange={(e) => setSelectedFabric(e.target.value)}
              aria-label="Filter by fabric"
              className="bg-[#240323] border border-[#681962] rounded-full px-3 py-1.5 font-semibold text-white"
            >
              <option value="all" className="bg-[#240323]">All Fabrics</option>
              {allFabrics.map((f) => (
                <option key={f} value={f} className="bg-[#240323]">
                  {f}
                </option>
              ))}
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              aria-label="Sort outfits"
              className="bg-[#4E0C47] border border-[#FFC700]/50 rounded-full px-3.5 py-1.5 font-bold text-[#FFE066]"
            >
              <option value="featured" className="bg-[#240323]">Sort: Featured</option>
              <option value="best_selling" className="bg-[#240323]">Best Selling</option>
              <option value="discount_desc" className="bg-[#240323]">Biggest Discount (%)</option>
              <option value="price_asc" className="bg-[#240323]">Price: Low to High</option>
              <option value="price_desc" className="bg-[#240323]">Price: High to Low</option>
            </select>

            {(selectedCategory !== 'all' ||
              pricePreset !== 'all' ||
              selectedSize !== 'all' ||
              selectedFabric !== 'all' ||
              searchQuery.trim() !== '') && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1 text-[#FFC700] font-bold hover:underline cursor-pointer pl-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Expandable Filters */}
        {mobileFiltersOpen && (
          <div className="lg:hidden bg-[#340732] p-4 rounded-2xl border border-[#681962] space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white">Filter &amp; Sort</span>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="p-1 text-[#E3C4DF]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'all', label: 'All Prices' },
                { id: 'under_1999', label: 'Under Rs. 1,999' },
                { id: '2000_4999', label: 'Rs. 2,000 – 4,999' },
                { id: '5000_plus', label: 'Rs. 5,000+' },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPricePreset(p.id as any)}
                  className={`px-3 py-1.5 rounded-full font-semibold ${
                    pricePreset === p.id
                      ? 'bg-[#FFC700] text-[#240323] font-bold'
                      : 'bg-[#240323] text-[#E9CEE6]'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={selectedSize}
                onChange={(e) => setSelectedSize(e.target.value)}
                className="bg-[#240323] border border-[#681962] text-white rounded-xl px-3 py-2 font-semibold"
              >
                <option value="all">All Sizes</option>
                {allSizes.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-[#240323] border border-[#681962] text-white rounded-xl px-3 py-2 font-semibold"
              >
                <option value="featured">Featured</option>
                <option value="best_selling">Best Selling</option>
                <option value="discount_desc">Biggest Sale</option>
                <option value="price_asc">Price Low-High</option>
                <option value="price_desc">Price High-Low</option>
              </select>
            </div>
          </div>
        )}

        {/* 2-Column Mobile / 4-Column Desktop Product Grid */}
        {filteredProducts.length === 0 ? (
          <div className="bg-[#340732] rounded-3xl border border-[#681962] p-12 text-center space-y-3">
            <Search className="w-8 h-8 text-[#FFC700] mx-auto" />
            <h3 className="text-lg font-bold text-white">No Outfits Match Your Filters</h3>
            <p className="text-xs text-[#E3C4DF]">
              Try clearing your price or category filter to explore our full Pakistani fashion collection.
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#FF7A00] to-[#FFC700] text-[#240323] text-xs font-extrabold cursor-pointer"
            >
              Show All Outfits
            </button>
          </div>
        ) : (
          <div
            data-testid="shop-products-grid"
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
          >
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                currentCountry={currentCountry}
                currentCurrency={currentCurrency}
                isWishlisted={wishlistIds.includes(product.id)}
                onToggleWishlist={onToggleWishlist}
                onViewProduct={onViewProduct}
                onAddToCart={onAddToCart}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
