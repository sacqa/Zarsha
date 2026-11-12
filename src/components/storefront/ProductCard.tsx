import React, { useState } from 'react';
import {
  ShoppingBag,
  Eye,
  Heart,
  Star,
  Check,
  Sparkles,
} from 'lucide-react';
import { motion } from 'motion/react';
import { Country, Currency, Product, ProductVariant } from '../../types/ecommerce';
import { formatMinorUnits, resolveProductPrice } from '../../utils/commerce-engine';

interface ProductCardProps {
  product: Product;
  currentCountry: Country;
  currentCurrency: Currency;
  isWishlisted?: boolean;
  onToggleWishlist?: (productId: string) => void;
  onViewProduct: (product: Product) => void;
  onAddToCart: (product: Product, variant?: ProductVariant, quantity?: number) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  currentCountry,
  currentCurrency,
  isWishlisted = false,
  onToggleWishlist,
  onViewProduct,
  onAddToCart,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const primaryVariant = product.variants[0];
  const priceMinor = resolveProductPrice(
    product,
    currentCountry.code,
    currentCurrency,
    1.0,
    primaryVariant
  );

  const baseCompareMinor =
    primaryVariant?.compareAtPriceMinorUnits || product.compareAtPriceMinorUnits || 0;
  const compareAtTargetMinor =
    baseCompareMinor > 0
      ? Math.round(baseCompareMinor * currentCurrency.exchangeRateToBase)
      : 0;

  const hasDiscount = compareAtTargetMinor > priceMinor;
  const discountPercent = hasDiscount
    ? Math.round(((compareAtTargetMinor - priceMinor) / compareAtTargetMinor) * 100)
    : 0;

  const primaryImage =
    !imgError && product.galleryImages?.[0]
      ? product.galleryImages[0]
      : '/src/assets/images/pk_lawn_3pc_rose_1794509751128.jpg';

  const secondaryImage =
    product.galleryImages && product.galleryImages.length > 1
      ? product.galleryImages[1]
      : primaryImage;

  const displayedImage = isHovered && secondaryImage !== primaryImage ? secondaryImage : primaryImage;

  const reviews = product.reviews || [];
  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : '4.9';

  const totalStock = product.variants.reduce((sum, v) => sum + v.stockQuantity, 0);
  const isOutOfStock = totalStock <= 0 && !product.continueSellingWhenOutOfStock;

  const sizesPreview =
    product.sizes && product.sizes.length > 0
      ? product.sizes.slice(0, 4)
      : product.variants.map((v) => v.attributes?.Size || v.title).slice(0, 4);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock) return;
    onAddToCart(product, primaryVariant, 1);
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1200);
  };

  return (
    <motion.article
      data-testid={`product-card-${product.id}`}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onViewProduct(product)}
      className="group bg-[#340732] rounded-2xl border border-[#681962] hover:border-[#FFC700] overflow-hidden shadow-md hover:shadow-[0_14px_34px_rgba(0,0,0,0.45)] transition-colors duration-200 flex flex-col cursor-pointer text-white"
    >
      {/* Portrait Fashion Image Container (3:4) */}
      <div className="relative aspect-[3/4] bg-[#4A0D46] overflow-hidden">
        <img
          src={displayedImage}
          alt={product.name}
          onError={() => setImgError(true)}
          className={`w-full h-full object-cover object-top transition-transform duration-500 ${
            isHovered ? 'scale-105' : 'scale-100'
          }`}
          loading="lazy"
          referrerPolicy="no-referrer"
        />

        {/* Subtle Top-Left SALE + Discount Ribbon */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10">
          {hasDiscount ? (
            <span className="cta-shimmer inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-gradient-to-r from-[#FF7A00] to-[#FFC700] text-[#240323] text-[10px] font-extrabold tracking-wider uppercase shadow-sm tabular-nums">
              <span>SALE</span>
              <span>-{discountPercent}%</span>
            </span>
          ) : product.tags?.some((t) => t.toLowerCase().includes('new')) ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#240323]/90 text-[#FFE066] border border-[#FFC700]/45 text-[9px] font-bold uppercase tracking-wider">
              <Sparkles className="w-2.5 h-2.5 text-[#FFC700]" />
              <span>New</span>
            </span>
          ) : null}
        </div>

        {/* Top-Right Wishlist Button */}
        {onToggleWishlist && (
          <motion.button
            type="button"
            data-testid={`wishlist-toggle-${product.id}`}
            whileTap={{ scale: 0.82 }}
            animate={isWishlisted ? { scale: [1, 1.28, 1] } : { scale: 1 }}
            transition={{ duration: 0.3 }}
            onClick={(e) => {
              e.stopPropagation();
              onToggleWishlist(product.id);
            }}
            aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center transition-colors z-10 cursor-pointer shadow-sm ${
              isWishlisted
                ? 'bg-[#FF7A00] text-[#240323]'
                : 'bg-[#240323]/80 text-white hover:bg-[#FFC700] hover:text-[#240323] border border-white/20'
            }`}
          >
            <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
          </motion.button>
        )}

        {/* Desktop Hover Overlay: Quick View & Add to Cart */}
        <div
          className={`hidden sm:flex absolute inset-x-3 bottom-3 gap-2 transition-all duration-200 z-10 ${
            isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none'
          }`}
        >
          <button
            type="button"
            data-testid={`quick-view-${product.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onViewProduct(product);
            }}
            className="flex-1 py-2.5 px-3 rounded-xl bg-white hover:bg-[#FFF8EB] text-[#240323] text-[11px] font-bold flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Quick View</span>
          </button>
          <button
            type="button"
            data-testid={`quick-add-${product.id}`}
            onClick={handleQuickAdd}
            disabled={isOutOfStock}
            className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#FF7A00] to-[#FFC700] hover:brightness-105 disabled:bg-neutral-500 text-[#240323] text-[11px] font-extrabold flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
          >
            {justAdded ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Added</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>{isOutOfStock ? 'Sold Out' : 'Add to Cart'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Product Details Body */}
      <div className="p-3 sm:p-4 flex flex-col grow justify-between space-y-2.5">
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-2 text-[10px] font-semibold uppercase tracking-wider text-[#E3C4DF]">
            <span className="truncate">{product.fabric || product.brand}</span>
            <span className="inline-flex items-center gap-0.5 text-[#FFC700] shrink-0">
              <Star className="w-3 h-3 fill-current" />
              <span className="text-white tabular-nums">{avgRating}</span>
            </span>
          </div>

          <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-[#FFC700] transition-colors line-clamp-2 leading-snug">
            {product.name}
          </h3>
        </div>

        {/* Clean Unboxed Hairline Sizes */}
        {sizesPreview.length > 0 && (
          <div className="text-[10px] font-medium text-[#D8B6D5] truncate">
            {sizesPreview.join(' · ')}
          </div>
        )}

        {/* Price & Mobile Add Row */}
        <div className="pt-2 border-t border-[#5E1659] flex items-center justify-between gap-2">
          <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2">
            <span
              data-testid={`product-sale-price-${product.id}`}
              className="text-sm sm:text-base font-extrabold text-[#FFC700] tabular-nums"
            >
              {formatMinorUnits(priceMinor, currentCurrency)}
            </span>
            {hasDiscount && (
              <span className="text-[11px] text-[#C9A3C6] line-through tabular-nums">
                {formatMinorUnits(compareAtTargetMinor, currentCurrency)}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleQuickAdd}
            disabled={isOutOfStock}
            aria-label={`Add ${product.name} to cart`}
            className="sm:hidden p-2 rounded-full bg-gradient-to-r from-[#FF7A00] to-[#FFC700] text-[#240323] disabled:bg-neutral-400 cursor-pointer shrink-0"
          >
            {justAdded ? <Check className="w-3.5 h-3.5" /> : <ShoppingBag className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </motion.article>
  );
};
