import React, { useState, useEffect } from 'react';
import {
  X,
  ShoppingBag,
  Zap,
  Heart,
  Ruler,
  Truck,
  Banknote,
  Star,
  CheckCircle2,
  ShieldCheck,
  MessageCircle,
} from 'lucide-react';
import {
  Country,
  Currency,
  Product,
  ProductVariant,
} from '../../types/ecommerce';
import { formatMinorUnits, resolveProductPrice } from '../../utils/commerce-engine';
import { storeDb } from '../../services/store-db';

interface ProductDetailModalProps {
  product: Product | null;
  allProducts?: Product[];
  currentCountry: Country;
  currentCurrency: Currency;
  wishlistIds?: string[];
  onToggleWishlist?: (productId: string) => void;
  onSelectRelatedProduct?: (product: Product) => void;
  onReviewAdded?: () => void;
  onClose: () => void;
  onAddToCart: (product: Product, variant: ProductVariant, quantity: number) => void;
  onBuyNow: (product: Product, variant: ProductVariant, quantity: number) => void;
}

const SIZE_CHART_ROWS = [
  { size: 'XS', chest: '34"', waist: '28"', hip: '37"', length: '37"' },
  { size: 'S', chest: '36"', waist: '30"', hip: '39"', length: '38"' },
  { size: 'M', chest: '39"', waist: '33"', hip: '42"', length: '39"' },
  { size: 'L', chest: '42"', waist: '36"', hip: '45"', length: '40"' },
  { size: 'XL', chest: '45"', waist: '39"', hip: '48"', length: '41"' },
];

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  allProducts = [],
  currentCountry,
  currentCurrency,
  wishlistIds = [],
  onToggleWishlist,
  onSelectRelatedProduct,
  onReviewAdded,
  onClose,
  onAddToCart,
  onBuyNow,
}) => {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [showSizeChart, setShowSizeChart] = useState(false);

  // Interactive Review Form State
  const [reviewAuthor, setReviewAuthor] = useState('');
  const [reviewCity, setReviewCity] = useState('Lahore');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmittedMsg, setReviewSubmittedMsg] = useState<string | null>(null);

  useEffect(() => {
    if (product) {
      setSelectedVariant(product.variants[0] || null);
      setSelectedColor(
        product.colors?.[0] ||
          product.variants[0]?.attributes?.Color ||
          'Signature Shade'
      );
      setActiveImageIdx(0);
      setQuantity(1);
      setShowSizeChart(false);
      setReviewSubmittedMsg(null);
    }
  }, [product?.id]);

  if (!product) return null;

  const activeVar = selectedVariant || product.variants[0];
  const priceMinor = resolveProductPrice(
    product,
    currentCountry.code,
    currentCurrency,
    1.0,
    activeVar
  );
  const baseCompareMinor =
    activeVar?.compareAtPriceMinorUnits || product.compareAtPriceMinorUnits || 0;
  const compareTargetMinor =
    baseCompareMinor > 0
      ? Math.round(baseCompareMinor * currentCurrency.exchangeRateToBase)
      : 0;
  const hasDiscount = compareTargetMinor > priceMinor;
  const discountPercent = hasDiscount
    ? Math.round(((compareTargetMinor - priceMinor) / compareTargetMinor) * 100)
    : 0;

  const images =
    product.galleryImages && product.galleryImages.length > 0
      ? product.galleryImages
      : ['/src/assets/images/pk_lawn_3pc_rose_1794509751128.jpg'];
  const activeImg = images[activeImageIdx] || images[0];

  const isWishlisted = wishlistIds.includes(product.id);
  const totalStock = activeVar ? activeVar.stockQuantity : 0;
  const isOutOfStock = totalStock <= 0 && !product.continueSellingWhenOutOfStock;

  const relatedProducts = allProducts
    .filter((p) => p.id !== product.id && p.status === 'published')
    .sort((a, b) =>
      a.categoryId === product.categoryId && b.categoryId !== product.categoryId
        ? -1
        : 1
    )
    .slice(0, 4);

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewAuthor.trim() || !reviewComment.trim()) return;
    storeDb.addProductReview(product.id, {
      author: reviewAuthor.trim(),
      city: reviewCity.trim() || 'Lahore',
      rating: reviewRating,
      title: reviewTitle.trim() || 'Lovely quality & stitching',
      comment: reviewComment.trim(),
      verified: true,
      sizePurchased: activeVar?.attributes?.Size || activeVar?.title,
    });
    setReviewAuthor('');
    setReviewTitle('');
    setReviewComment('');
    setReviewSubmittedMsg('Thank you! Your verified review has been published.');
    onReviewAdded?.();
  };

  return (
    <div
      data-testid="product-detail-modal"
      className="fixed inset-0 z-50 overflow-y-auto bg-[#120112]/80 backdrop-blur-sm flex items-start sm:items-center justify-center p-2 sm:p-6 animate-in fade-in duration-200"
    >
      <div className="relative bg-[#240323] text-white rounded-2xl sm:rounded-3xl max-w-5xl w-full overflow-hidden shadow-2xl border border-[#7A1870] my-4 sm:my-8 max-h-[94vh] flex flex-col">
        {/* Top Modal Bar */}
        <div className="px-5 py-3.5 bg-[#340732] border-b border-[#661760] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-[#E3C4DF]">
            <span className="font-bold text-[#FFC700] uppercase tracking-wider">
              {product.brand}
            </span>
            <span>/</span>
            <span className="truncate max-w-[200px] sm:max-w-none text-white">{product.name}</span>
          </div>

          <div className="flex items-center gap-2">
            {onToggleWishlist && (
              <button
                type="button"
                onClick={() => onToggleWishlist(product.id)}
                className={`p-2 rounded-full border transition-colors cursor-pointer ${
                  isWishlisted
                    ? 'bg-[#FF9900] text-[#240323] border-[#FFC700]'
                    : 'bg-[#240323] text-white border-[#681962] hover:border-[#FFC700]'
                }`}
                aria-label="Toggle wishlist"
              >
                <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
              </button>
            )}
            <button
              type="button"
              data-testid="close-product-modal-btn"
              onClick={onClose}
              className="p-2 rounded-full text-[#E3C4DF] hover:text-white hover:bg-[#4E0C47] transition-colors cursor-pointer"
              aria-label="Close product modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-5 sm:p-8 space-y-8 grow pb-24 sm:pb-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
            {/* Left: Fashion Gallery */}
            <div className="lg:col-span-6 space-y-3">
              <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-[#340732] border border-[#681962]">
                <img
                  src={activeImg}
                  alt={product.name}
                  className="w-full h-full object-cover object-top"
                  referrerPolicy="no-referrer"
                />
                {hasDiscount && (
                  <span className="absolute top-3 left-3 px-3 py-1 rounded-md bg-gradient-to-r from-[#FF7A00] to-[#FFC700] text-[#240323] text-xs font-extrabold tracking-wider uppercase shadow-sm tabular-nums">
                    SALE • -{discountPercent}% OFF
                  </span>
                )}
              </div>

              {images.length > 1 && (
                <div className="grid grid-cols-4 gap-2.5">
                  {images.map((img, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setActiveImageIdx(i)}
                      className={`aspect-[3/4] rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                        activeImageIdx === i
                          ? 'border-[#FFC700] ring-2 ring-[#FFC700]/30'
                          : 'border-[#681962] opacity-75 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={img}
                        alt={`${product.name} view ${i + 1}`}
                        className="w-full h-full object-cover object-top"
                        referrerPolicy="no-referrer"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Pricing, Variants, Size Chart, Fabric & Purchase CTAs */}
            <div className="lg:col-span-6 space-y-5">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="px-2.5 py-0.5 rounded bg-[#4E0C47] border border-[#7A1870] text-[#FFC700] font-bold uppercase tracking-wider text-[10px]">
                    {product.fabric || 'Pakistani Designer Wear'}
                  </span>
                  <span className="text-[#D8B6D5] tabular-nums">SKU: {activeVar.sku}</span>
                  <span className="inline-flex items-center gap-1 text-[#FFC700] font-semibold">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span className="text-white">
                      4.9 ({(product.reviews?.length || 2)} Reviews)
                    </span>
                  </span>
                </div>

                <h2
                  className="text-2xl sm:text-3xl font-bold text-white leading-tight"
                  style={{ fontFamily: "'Poppins', sans-serif" }}
                >
                  {product.name}
                </h2>

                <p className="text-xs sm:text-sm text-[#E9CEE6] leading-relaxed">
                  {product.shortDescription}
                </p>
              </div>

              {/* Price Display */}
              <div className="p-4 rounded-2xl bg-[#340732] border border-[#7A1870] flex flex-wrap items-baseline justify-between gap-2">
                <div className="flex items-baseline gap-3">
                  <span className="text-2xl sm:text-3xl font-extrabold text-[#FFC700] tabular-nums">
                    {formatMinorUnits(priceMinor, currentCurrency)}
                  </span>
                  {hasDiscount && (
                    <span className="text-sm text-[#D8B6D5] line-through tabular-nums">
                      {formatMinorUnits(compareTargetMinor, currentCurrency)}
                    </span>
                  )}
                </div>
                {hasDiscount && (
                  <span className="px-2.5 py-1 rounded bg-gradient-to-r from-[#FF7A00] to-[#FFC700] text-[#240323] text-[11px] font-extrabold">
                    Save {discountPercent}% Today
                  </span>
                )}
              </div>

              {/* Size Selector + Size Chart Toggle */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white uppercase tracking-wider">
                    Select Size / Option:{' '}
                    <span className="text-[#FFC700]">{activeVar.title}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowSizeChart(!showSizeChart)}
                    className="inline-flex items-center gap-1 text-[#FFC700] font-semibold hover:underline cursor-pointer"
                  >
                    <Ruler className="w-3.5 h-3.5" />
                    <span>{showSizeChart ? 'Hide Size Chart' : 'Size Chart'}</span>
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {product.variants.map((v) => {
                    const isSelected = activeVar.id === v.id;
                    const vOut = v.stockQuantity <= 0 && !product.continueSellingWhenOutOfStock;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        disabled={vOut}
                        onClick={() => setSelectedVariant(v)}
                        className={`px-4 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-gradient-to-r from-[#FF7A00] to-[#FFC700] text-[#240323] border-[#FFC700] shadow-xs'
                            : vOut
                            ? 'bg-[#1A0219] text-[#8F6E8D] border-[#4A0F45] line-through cursor-not-allowed'
                            : 'bg-[#340732] text-white border-[#681962] hover:border-[#FFC700]'
                        }`}
                      >
                        {v.attributes?.Size || v.title}
                      </button>
                    );
                  })}
                </div>

                {/* Expandable Pakistani Pret Size Chart */}
                {showSizeChart && (
                  <div className="p-3.5 rounded-2xl bg-[#340732] border border-[#681962] space-y-2 text-[11px]">
                    <div className="font-bold text-[#FFE066]">
                      ZARIYA Pakistani Standard Measurement Chart (Inches)
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-[#5E1659] text-[#D8B6D5]">
                            <th className="py-1.5 pr-3">Size</th>
                            <th className="py-1.5 pr-3">Chest</th>
                            <th className="py-1.5 pr-3">Waist</th>
                            <th className="py-1.5 pr-3">Hip</th>
                            <th className="py-1.5">Shirt Length</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#4E0C47] tabular-nums text-white">
                          {SIZE_CHART_ROWS.map((row) => (
                            <tr key={row.size}>
                              <td className="py-1.5 pr-3 font-bold text-[#FFC700]">{row.size}</td>
                              <td className="py-1.5 pr-3">{row.chest}</td>
                              <td className="py-1.5 pr-3">{row.waist}</td>
                              <td className="py-1.5 pr-3">{row.hip}</td>
                              <td className="py-1.5">{row.length}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="text-[10px] text-[#D8B6D5]">
                      Unstitched suits include 3.0m Shirt, 2.5m Dupatta &amp; 2.5m Trouser fabric.
                    </p>
                  </div>
                )}
              </div>

              {/* Color Selector */}
              {product.colors && product.colors.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-white uppercase tracking-wider">
                    Shade: <span className="text-[#FFC700]">{selectedColor}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {product.colors.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setSelectedColor(c)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
                          selectedColor === c
                            ? 'bg-[#4E0C47] border-[#FFC700] text-[#FFE066]'
                            : 'bg-[#340732] border-[#681962] text-[#E3C4DF] hover:border-[#FFC700]'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity & Action Buttons (Desktop/Tablet) */}
              <div className="hidden sm:flex items-center gap-3 pt-1">
                <div className="inline-flex items-center border border-[#681962] rounded-xl bg-[#340732]">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="px-3.5 py-3 text-sm font-bold text-[#E3C4DF] hover:text-white cursor-pointer"
                    aria-label="Decrease quantity"
                  >
                    -
                  </button>
                  <span className="px-4 py-3 text-sm font-bold tabular-nums text-white">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(Math.max(1, totalStock), q + 1))}
                    className="px-3.5 py-3 text-sm font-bold text-[#E3C4DF] hover:text-white cursor-pointer"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  data-testid="modal-add-to-cart-btn"
                  disabled={isOutOfStock}
                  onClick={() => onAddToCart(product, activeVar, quantity)}
                  className="flex-1 py-3.5 px-5 rounded-xl bg-white hover:bg-[#FFF7E6] disabled:bg-neutral-500 text-[#240323] text-xs font-extrabold uppercase tracking-wider inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>{isOutOfStock ? 'Out of Stock' : 'Add to Cart'}</span>
                </button>

                <button
                  type="button"
                  data-testid="modal-buy-now-btn"
                  disabled={isOutOfStock}
                  onClick={() => onBuyNow(product, activeVar, quantity)}
                  className="flex-1 py-3.5 px-5 rounded-xl bg-gradient-to-r from-[#FF7A00] to-[#FFC700] hover:brightness-105 disabled:bg-neutral-500 text-[#240323] text-xs font-extrabold uppercase tracking-wider inline-flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
                >
                  <Zap className="w-4 h-4" />
                  <span>Buy Now</span>
                </button>
              </div>

              {/* Delivery & COD Promise Box */}
              <div className="p-4 rounded-2xl bg-[#340732] border border-[#681962] space-y-2.5 text-xs text-[#E9CEE6]">
                <div className="flex items-center gap-2.5 text-white font-semibold">
                  <Banknote className="w-4 h-4 text-[#FFC700] shrink-0" />
                  <span>Cash on Delivery (COD) Available Nationwide</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Truck className="w-4 h-4 text-[#FF9900] shrink-0" />
                  <span>
                    Dispatch within 24h from Lahore · Free delivery on orders over Rs. 3,000
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    In Stock ({totalStock} pieces ready) · 7-Day Easy Size Exchange
                  </span>
                </div>
                <a
                  href="https://wa.me/923008429100"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-emerald-300 font-semibold hover:underline pt-0.5"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Ask on WhatsApp (+92 300 8429100)</span>
                </a>
              </div>

              {/* Fabric & Stitching Details */}
              <div className="space-y-2.5 pt-2 border-t border-[#5E1659]">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#FFC700]">
                  Fabric &amp; Product Details
                </h3>
                <p className="text-xs text-[#E9CEE6] leading-relaxed">
                  {product.fullDescription}
                </p>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {Object.entries(product.specs || {}).map(([k, v]) => (
                    <div
                      key={k}
                      className="p-2.5 rounded-xl bg-[#340732] border border-[#681962] text-[11px]"
                    >
                      <div className="text-[#D8B6D5] font-medium">{k}</div>
                      <div className="font-bold text-white mt-0.5">{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Customer Reviews & Write Review */}
          <div className="pt-6 border-t border-[#5E1659] grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 space-y-4">
              <h3
                className="text-xl font-bold text-white"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                Verified Customer Reviews ({product.reviews?.length || 0})
              </h3>

              {!product.reviews || product.reviews.length === 0 ? (
                <p className="text-xs text-[#D8B6D5]">
                  Be the first to share your fit &amp; fabric review for this outfit.
                </p>
              ) : (
                <div className="space-y-3">
                  {product.reviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="p-4 rounded-2xl bg-[#340732] border border-[#681962] space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">
                            {rev.author}
                          </span>
                          <span className="text-[11px] text-[#D8B6D5]">({rev.city})</span>
                          {rev.verified && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-300 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3" /> Verified Buyer
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-[#D8B6D5]">{rev.date}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[#FFC700]">
                        {Array.from({ length: rev.rating }).map((_, idx) => (
                          <Star key={idx} className="w-3.5 h-3.5 fill-current" />
                        ))}
                      </div>
                      <div className="text-xs font-bold text-white">{rev.title}</div>
                      <p className="text-xs text-[#E9CEE6] leading-relaxed">{rev.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Write Review Card */}
            <form
              onSubmit={handleReviewSubmit}
              className="lg:col-span-5 p-5 rounded-2xl bg-[#340732] border border-[#7A1870] space-y-3 self-start"
            >
              <h4 className="text-sm font-bold text-[#FFE066]">Write a Review</h4>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  value={reviewAuthor}
                  onChange={(e) => setReviewAuthor(e.target.value)}
                  placeholder="Your Name *"
                  className="px-3 py-2 rounded-xl bg-[#240323] border border-[#681962] text-white placeholder-[#D8B6D5] text-xs focus:outline-hidden focus:border-[#FFC700]"
                />
                <input
                  type="text"
                  value={reviewCity}
                  onChange={(e) => setReviewCity(e.target.value)}
                  placeholder="City (e.g. Karachi)"
                  className="px-3 py-2 rounded-xl bg-[#240323] border border-[#681962] text-white placeholder-[#D8B6D5] text-xs focus:outline-hidden focus:border-[#FFC700]"
                />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#E9CEE6]">Rating:</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="cursor-pointer"
                    >
                      <Star
                        className={`w-4 h-4 ${
                          star <= reviewRating
                            ? 'text-[#FFC700] fill-current'
                            : 'text-[#681962]'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <input
                type="text"
                value={reviewTitle}
                onChange={(e) => setReviewTitle(e.target.value)}
                placeholder="Review headline"
                className="w-full px-3 py-2 rounded-xl bg-[#240323] border border-[#681962] text-white placeholder-[#D8B6D5] text-xs focus:outline-hidden focus:border-[#FFC700]"
              />
              <textarea
                rows={3}
                required
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Share details about the embroidery, fabric & fit..."
                className="w-full px-3 py-2 rounded-xl bg-[#240323] border border-[#681962] text-white placeholder-[#D8B6D5] text-xs focus:outline-hidden focus:border-[#FFC700]"
              />
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#FF7A00] to-[#FFC700] text-[#240323] text-xs font-extrabold cursor-pointer"
              >
                Submit Review
              </button>
              {reviewSubmittedMsg && (
                <p className="text-[11px] font-semibold text-emerald-300">
                  {reviewSubmittedMsg}
                </p>
              )}
            </form>
          </div>

          {/* Related Products */}
          {relatedProducts.length > 0 && onSelectRelatedProduct && (
            <div className="pt-6 border-t border-[#5E1659] space-y-4">
              <h3
                className="text-xl font-bold text-white"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                Complete Your Wardrobe — Related Styles
              </h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {relatedProducts.map((rel) => {
                  const relPrice = resolveProductPrice(rel, currentCountry.code, currentCurrency);
                  return (
                    <button
                      key={rel.id}
                      type="button"
                      onClick={() => onSelectRelatedProduct(rel)}
                      className="text-left bg-[#340732] rounded-2xl border border-[#681962] hover:border-[#FFC700] overflow-hidden transition-all cursor-pointer group"
                    >
                      <div className="aspect-[3/4] bg-[#4A0D46] overflow-hidden">
                        <img
                          src={rel.galleryImages[0]}
                          alt={rel.name}
                          className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="p-3 space-y-1">
                        <div className="text-xs font-bold text-white truncate">
                          {rel.name}
                        </div>
                        <div className="text-xs font-extrabold text-[#FFC700] tabular-nums">
                          {formatMinorUnits(relPrice, currentCurrency)}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Compact Mobile Sticky Purchase Bar */}
        <div className="sm:hidden fixed bottom-0 inset-x-0 bg-[#1A0219] border-t border-[#681962] px-4 py-2.5 flex items-center justify-between gap-2 z-20 shadow-lg">
          <div className="min-w-0">
            <div className="text-[10px] text-[#D8B6D5] truncate">{activeVar.title}</div>
            <div className="text-sm font-extrabold text-[#FFC700] tabular-nums">
              {formatMinorUnits(priceMinor, currentCurrency)}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              disabled={isOutOfStock}
              onClick={() => onAddToCart(product, activeVar, quantity)}
              className="px-3.5 py-2 rounded-xl bg-white text-[#240323] text-xs font-extrabold cursor-pointer"
            >
              Add to Cart
            </button>
            <button
              type="button"
              disabled={isOutOfStock}
              onClick={() => onBuyNow(product, activeVar, quantity)}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#FF7A00] to-[#FFC700] text-[#240323] text-xs font-extrabold cursor-pointer"
            >
              Buy Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
