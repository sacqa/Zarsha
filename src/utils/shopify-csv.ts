import { Product, ProductVariant, ProductAttribute, ProductCollection } from '../types/ecommerce';

export type ShopifyFieldKey =
  | 'handle'
  | 'title'
  | 'bodyHtml'
  | 'shortDescription'
  | 'vendor'
  | 'brand'
  | 'category'
  | 'productType'
  | 'tags'
  | 'status'
  | 'published'
  | 'option1Name'
  | 'option1Value'
  | 'option2Name'
  | 'option2Value'
  | 'option3Name'
  | 'option3Value'
  | 'sku'
  | 'barcode'
  | 'price'
  | 'compareAtPrice'
  | 'costPerItem'
  | 'inventoryQty'
  | 'inventoryPolicy'
  | 'weightGrams'
  | 'requiresShipping'
  | 'imageSrc'
  | 'imagePosition'
  | 'imageAltText'
  | 'variantImage'
  | 'collection'
  | 'seoTitle'
  | 'seoDescription'
  | 'ignore';

export interface CsvColumnMapping {
  csvHeader: string;
  headerIndex: number;
  mappedField: ShopifyFieldKey;
}

export interface CsvValidationIssue {
  rowNumber: number; // 1-indexed CSV data row (header is row 1, first data row is row 2)
  handle: string;
  field: string;
  severity: 'error' | 'warning';
  message: string;
}

export interface ParsedCsvProductPreview {
  handle: string;
  action: 'create' | 'update';
  existingProductId?: string;
  sourceRowNumbers: number[];
  product: Product;
  collectionNames: string[];
  errors: CsvValidationIssue[];
  warnings: CsvValidationIssue[];
  isValid: boolean;
}

export interface CsvParseAndValidateResult {
  headers: string[];
  rawRows: string[][];
  mappings: CsvColumnMapping[];
  products: ParsedCsvProductPreview[];
  allIssues: CsvValidationIssue[];
  validProductsCount: number;
  errorProductsCount: number;
  warningProductsCount: number;
  newProductsCount: number;
  updateProductsCount: number;
  totalVariantsCount: number;
  totalImagesCount: number;
}

export interface CsvImportExecutionReport {
  totalRowsProcessed: number;
  createdCount: number;
  updatedCount: number;
  skippedCount: number;
  variantsProcessed: number;
  imagesProcessed: number;
  collectionsLinked: number;
  createdProducts: { id: string; handle: string; name: string; sku: string; variantsCount: number }[];
  updatedProducts: { id: string; handle: string; name: string; sku: string; variantsCount: number }[];
  failedItems: { handle: string; rowNumbers: number[]; errors: string[] }[];
  completedAt: string;
}

export const SHOPIFY_FIELD_LABELS: Record<ShopifyFieldKey, string> = {
  handle: 'Handle (Unique Slug / Identifier)',
  title: 'Title (Product Name)',
  bodyHtml: 'Body (HTML) / Full Description',
  shortDescription: 'Short Description / Summary',
  vendor: 'Vendor / Manufacturer',
  brand: 'Brand',
  category: 'Product Category',
  productType: 'Type (Product Type)',
  tags: 'Tags (Comma-separated)',
  status: 'Status (active / draft / archived)',
  published: 'Published (TRUE / FALSE)',
  option1Name: 'Option1 Name (e.g. Finish, Size)',
  option1Value: 'Option1 Value',
  option2Name: 'Option2 Name (e.g. Color, Resistance)',
  option2Value: 'Option2 Value',
  option3Name: 'Option3 Name (e.g. Strength)',
  option3Value: 'Option3 Value',
  sku: 'Variant SKU',
  barcode: 'Variant Barcode (ISBN, UPC, GTIN)',
  price: 'Variant Price (PKR Rs.)',
  compareAtPrice: 'Variant Compare At Price (PKR Rs.)',
  costPerItem: 'Cost per item (PKR Rs.)',
  inventoryQty: 'Variant Inventory Qty (Stock)',
  inventoryPolicy: 'Variant Inventory Policy (deny / continue)',
  weightGrams: 'Variant Grams (Shipping Weight)',
  requiresShipping: 'Variant Requires Shipping (TRUE / FALSE)',
  imageSrc: 'Image Src (Product Image URL)',
  imagePosition: 'Image Position',
  imageAltText: 'Image Alt Text',
  variantImage: 'Variant Image URL',
  collection: 'Collection (Title or Handle)',
  seoTitle: 'SEO Title',
  seoDescription: 'SEO Description',
  ignore: '— Ignore Column —',
};

const DEFAULT_FALLBACK_IMAGE = '/src/assets/images/pk_lawn_3pc_rose_1794509751128.jpg';

/**
 * RFC 4180 compliant CSV parser that handles quoted fields, escaped quotes (""),
 * commas inside quotes, and multi-line strings inside quotes.
 */
export function parseCsvRaw(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;

  const normalized = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  for (let i = 0; i < normalized.length; i++) {
    const char = normalized[i];
    const nextChar = normalized[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentCell += '"';
        i++; // skip escaped quote
      } else if (char === '"') {
        inQuotes = false;
      } else {
        currentCell += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentCell.trim());
        currentCell = '';
      } else if (char === '\n') {
        currentRow.push(currentCell.trim());
        if (currentRow.some((cell) => cell !== '')) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentCell = '';
      } else {
        currentCell += char;
      }
    }
  }

  currentRow.push(currentCell.trim());
  if (currentRow.some((cell) => cell !== '')) {
    rows.push(currentRow);
  }

  return rows;
}

/**
 * Escape a single CSV cell according to RFC 4180
 */
export function escapeCsvCell(val: string | number | boolean | undefined | null): string {
  if (val === undefined || val === null) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Automatically maps CSV column header names to Shopify product fields.
 */
export function autoMapCsvColumns(headers: string[]): CsvColumnMapping[] {
  return headers.map((rawHeader, headerIndex) => {
    const norm = rawHeader.toLowerCase().replace(/[^a-z0-9]/g, '');

    let mappedField: ShopifyFieldKey = 'ignore';

    if (norm === 'handle' || norm === 'slug' || norm === 'urlhandle' || norm === 'producthandle') {
      mappedField = 'handle';
    } else if (norm === 'title' || norm === 'producttitle' || norm === 'name' || norm === 'productname') {
      mappedField = 'title';
    } else if (norm === 'bodyhtml' || norm === 'body' || norm === 'description' || norm === 'fulldescription' || norm === 'html') {
      mappedField = 'bodyHtml';
    } else if (norm === 'shortdescription' || norm === 'summary' || norm === 'excerpt') {
      mappedField = 'shortDescription';
    } else if (norm === 'vendor' || norm === 'manufacturer' || norm === 'supplier') {
      mappedField = 'vendor';
    } else if (norm === 'brand' || norm === 'brandname') {
      mappedField = 'brand';
    } else if (norm === 'productcategory' || norm === 'category' || norm === 'categoryid' || norm === 'googleproductcategory') {
      mappedField = 'category';
    } else if (norm === 'type' || norm === 'producttype') {
      mappedField = 'productType';
    } else if (norm === 'tags' || norm === 'tag' || norm === 'producttags' || norm === 'keywords') {
      mappedField = 'tags';
    } else if (norm === 'status' || norm === 'productstatus') {
      mappedField = 'status';
    } else if (norm === 'published') {
      mappedField = 'published';
    } else if (norm === 'option1name' || norm === 'optionname1') {
      mappedField = 'option1Name';
    } else if (norm === 'option1value' || norm === 'optionvalue1') {
      mappedField = 'option1Value';
    } else if (norm === 'option2name' || norm === 'optionname2') {
      mappedField = 'option2Name';
    } else if (norm === 'option2value' || norm === 'optionvalue2') {
      mappedField = 'option2Value';
    } else if (norm === 'option3name' || norm === 'optionname3') {
      mappedField = 'option3Name';
    } else if (norm === 'option3value' || norm === 'optionvalue3') {
      mappedField = 'option3Value';
    } else if (norm === 'variantsku' || norm === 'sku' || norm === 'itemcode') {
      mappedField = 'sku';
    } else if (norm === 'variantbarcode' || norm === 'barcode' || norm === 'isbn' || norm === 'upc' || norm === 'gtin' || norm === 'ean') {
      mappedField = 'barcode';
    } else if (
      norm === 'variantprice' ||
      norm === 'price' ||
      norm === 'priceqar' ||
      norm === 'baseprice' ||
      norm === 'unitprice'
    ) {
      mappedField = 'price';
    } else if (
      norm === 'variantcompareatprice' ||
      norm === 'compareatprice' ||
      norm === 'compareat' ||
      norm === 'compareatqar' ||
      norm === 'compareprice'
    ) {
      mappedField = 'compareAtPrice';
    } else if (norm === 'costperitem' || norm === 'cost' || norm === 'costqar' || norm === 'variantcost' || norm === 'unitcost') {
      mappedField = 'costPerItem';
    } else if (
      norm === 'variantinventoryqty' ||
      norm === 'inventoryqty' ||
      norm === 'stock' ||
      norm === 'totalstock' ||
      norm === 'quantity' ||
      norm === 'qty' ||
      norm === 'inventory'
    ) {
      mappedField = 'inventoryQty';
    } else if (norm === 'variantinventorypolicy' || norm === 'inventorypolicy') {
      mappedField = 'inventoryPolicy';
    } else if (norm === 'variantgrams' || norm === 'grams' || norm === 'weight' || norm === 'weightgrams' || norm === 'shippingweight') {
      mappedField = 'weightGrams';
    } else if (norm === 'variantrequiresshipping' || norm === 'requiresshipping' || norm === 'physicalproduct') {
      mappedField = 'requiresShipping';
    } else if (norm === 'imagesrc' || norm === 'image' || norm === 'imageurl' || norm === 'images' || norm === 'galleryimages') {
      mappedField = 'imageSrc';
    } else if (norm === 'imageposition' || norm === 'imgposition') {
      mappedField = 'imagePosition';
    } else if (norm === 'imagealttext' || norm === 'alttext' || norm === 'imagealt') {
      mappedField = 'imageAltText';
    } else if (norm === 'variantimage' || norm === 'variantimageurl') {
      mappedField = 'variantImage';
    } else if (norm === 'collection' || norm === 'collections' || norm === 'collectionhandle') {
      mappedField = 'collection';
    } else if (norm === 'seotitle' || norm === 'metatitle' || norm === 'pagetitle') {
      mappedField = 'seoTitle';
    } else if (norm === 'seodescription' || norm === 'metadescription') {
      mappedField = 'seoDescription';
    }

    return {
      csvHeader: rawHeader,
      headerIndex,
      mappedField,
    };
  });
}

function slugifyHandle(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function normalizeCategory(raw: string): string {
  if (!raw) return '3-piece-suits';
  const low = raw.toLowerCase().trim();
  if (low.includes('2 piece') || low.includes('2-piece')) return '2-piece-suits';
  if (low.includes('3 piece') || low.includes('3-piece')) return '3-piece-suits';
  if (low.includes('unstitched')) return 'unstitched-lawn';
  if (low.includes('stitched')) return 'stitched-collection';
  if (low.includes('luxury') || low.includes('pret')) return 'luxury-pret';
  if (low.includes('casual') || low.includes('kurti')) return 'casual-wear';
  if (low.includes('formal')) return 'formal-wear';
  if (low.includes('party') || low.includes('festive')) return 'party-wear';
  if (low.includes('chiffon')) return 'chiffon-collection';
  if (low.includes('winter') || low.includes('khaddar')) return 'winter-collection';
  return '3-piece-suits';
}

function normalizeProductType(raw: string, categoryId: string): Product['productType'] {
  const low = (raw || '').toLowerCase().trim();
  if (low === 'unstitched_3pc' || low.includes('unstitched')) return 'unstitched_3pc';
  if (low === 'stitched_3pc' || low.includes('stitched')) return 'stitched_3pc';
  if (low === 'two_piece' || low.includes('2 piece')) return 'two_piece';
  if (low === 'luxury_pret' || low.includes('pret')) return 'luxury_pret';
  if (low === 'kurti' || low.includes('kurti')) return 'kurti';
  if (low === 'formal_chiffon' || low.includes('chiffon')) return 'formal_chiffon';
  if (low === 'winter_khaddar' || low.includes('khaddar') || low.includes('winter')) return 'winter_khaddar';
  if (low === 'festive_organza' || low.includes('organza')) return 'festive_organza';
  if (low === 'party_wear' || low.includes('party')) return 'party_wear';
  if (low === 'casual_wear' || low.includes('casual')) return 'casual_wear';

  if (categoryId === '2-piece-suits') return 'two_piece';
  if (categoryId === 'unstitched-lawn') return 'unstitched_3pc';
  if (categoryId === 'luxury-pret') return 'luxury_pret';
  if (categoryId === 'casual-wear') return 'casual_wear';
  if (categoryId === 'chiffon-collection') return 'formal_chiffon';
  if (categoryId === 'winter-collection') return 'winter_khaddar';
  if (categoryId === 'party-wear') return 'party_wear';
  return 'stitched_3pc';
}

function stripHtmlTags(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Parses CSV rows using the provided (or auto-detected) column mappings,
 * groups multi-row variants and images by Handle (Shopify standard),
 * validates fields, and builds preview objects ready for database import.
 */
export function parseAndValidateShopifyCsv(
  csvText: string,
  existingProducts: Product[],
  customMappings?: CsvColumnMapping[]
): CsvParseAndValidateResult {
  const rawMatrix = parseCsvRaw(csvText);
  if (rawMatrix.length === 0) {
    return {
      headers: [],
      rawRows: [],
      mappings: [],
      products: [],
      allIssues: [
        {
          rowNumber: 1,
          handle: '',
          field: 'CSV File',
          severity: 'error',
          message: 'The CSV file is empty or contains no valid rows.',
        },
      ],
      validProductsCount: 0,
      errorProductsCount: 0,
      warningProductsCount: 0,
      newProductsCount: 0,
      updateProductsCount: 0,
      totalVariantsCount: 0,
      totalImagesCount: 0,
    };
  }

  const headers = rawMatrix[0];
  const rawRows = rawMatrix.slice(1);
  const mappings = customMappings && customMappings.length === headers.length ? customMappings : autoMapCsvColumns(headers);

  const getFieldVal = (row: string[], field: ShopifyFieldKey): string => {
    const found = mappings.find((m) => m.mappedField === field);
    if (!found) return '';
    return (row[found.headerIndex] ?? '').trim();
  };

  interface GroupedHandleBucket {
    handle: string;
    rows: { row: string[]; rowNumber: number }[];
  }

  const bucketsMap = new Map<string, GroupedHandleBucket>();
  const allIssues: CsvValidationIssue[] = [];
  let lastSeenHandle = '';

  rawRows.forEach((row, idx) => {
    const rowNumber = idx + 2; // Row 1 is headers
    const rawHandle = getFieldVal(row, 'handle');
    const rawTitle = getFieldVal(row, 'title');
    const rawSku = getFieldVal(row, 'sku');

    let effectiveHandle = rawHandle ? slugifyHandle(rawHandle) : '';
    if (!effectiveHandle && rawTitle) {
      effectiveHandle = slugifyHandle(rawTitle);
    } else if (!effectiveHandle && lastSeenHandle) {
      // In Shopify CSVs, additional image/variant rows sometimes omit Title; if Handle was also omitted, inherit previous handle
      effectiveHandle = lastSeenHandle;
    } else if (!effectiveHandle && rawSku) {
      effectiveHandle = slugifyHandle(rawSku);
    }

    if (!effectiveHandle) {
      allIssues.push({
        rowNumber,
        handle: `row-${rowNumber}`,
        field: 'Handle / Title',
        severity: 'error',
        message: `Row ${rowNumber} is missing both a Product Handle and Title.`,
      });
      return;
    }

    lastSeenHandle = effectiveHandle;

    let bucket = bucketsMap.get(effectiveHandle);
    if (!bucket) {
      bucket = { handle: effectiveHandle, rows: [] };
      bucketsMap.set(effectiveHandle, bucket);
    }
    bucket.rows.push({ row, rowNumber });
  });

  const previews: ParsedCsvProductPreview[] = [];
  const seenSkusAcrossHandles = new Map<string, string>(); // sku -> handle

  bucketsMap.forEach((bucket) => {
    const { handle, rows } = bucket;
    const primaryRow = rows[0].row;
    const primaryRowNum = rows[0].rowNumber;
    const sourceRowNumbers = rows.map((r) => r.rowNumber);

    const prodErrors: CsvValidationIssue[] = [];
    const prodWarnings: CsvValidationIssue[] = [];

    // Check if existing product matches by slug (handle) or SKU
    const primarySkuRaw = getFieldVal(primaryRow, 'sku');
    const existingProd = existingProducts.find(
      (p) =>
        p.slug.toLowerCase() === handle.toLowerCase() ||
        (primarySkuRaw && p.sku.toLowerCase() === primarySkuRaw.toLowerCase())
    );

    const rawTitle = getFieldVal(primaryRow, 'title') || existingProd?.name || '';
    if (!rawTitle) {
      prodErrors.push({
        rowNumber: primaryRowNum,
        handle,
        field: 'Title',
        severity: 'error',
        message: `Product "${handle}" (Row ${primaryRowNum}) is missing a required Title.`,
      });
    }

    const rawBodyHtml = getFieldVal(primaryRow, 'bodyHtml');
    const rawShortDesc = getFieldVal(primaryRow, 'shortDescription');
    const fullDescription =
      rawBodyHtml ||
      rawShortDesc ||
      existingProd?.fullDescription ||
      (rawTitle ? `${rawTitle} — signature Pakistani eastern wear tailored by ZARIYA Atelier.` : '');
    const shortDescription =
      rawShortDesc ||
      (rawBodyHtml ? stripHtmlTags(rawBodyHtml).slice(0, 180) : '') ||
      existingProd?.shortDescription ||
      fullDescription.slice(0, 160);

    const rawVendor = getFieldVal(primaryRow, 'vendor');
    const rawBrand = getFieldVal(primaryRow, 'brand');
    const brand = rawBrand || rawVendor || existingProd?.brand || 'Zariya Atelier';
    const vendor = rawVendor || rawBrand || existingProd?.vendor || brand;

    const rawCategory = getFieldVal(primaryRow, 'category');
    const categoryId = rawCategory ? normalizeCategory(rawCategory) : existingProd?.categoryId || '3-piece-suits';

    const rawProductType = getFieldVal(primaryRow, 'productType');
    const productType = rawProductType
      ? normalizeProductType(rawProductType, categoryId)
      : existingProd?.productType || normalizeProductType('', categoryId);

    const rawStatus = getFieldVal(primaryRow, 'status').toLowerCase();
    const rawPublished = getFieldVal(primaryRow, 'published').toLowerCase();
    let status: Product['status'] = existingProd?.status || 'published';

    if (rawStatus) {
      if (rawStatus === 'active' || rawStatus === 'published') {
        status = 'published';
      } else if (rawStatus === 'draft') {
        status = 'draft';
      } else if (rawStatus === 'archived') {
        status = 'archived';
      } else if (rawStatus === 'discontinued') {
        status = 'discontinued';
      } else {
        prodErrors.push({
          rowNumber: primaryRowNum,
          handle,
          field: 'Status',
          severity: 'error',
          message: `Invalid status "${rawStatus}" on row ${primaryRowNum}. Expected active, published, draft, or archived.`,
        });
      }
    } else if (rawPublished) {
      if (rawPublished === 'false' || rawPublished === '0' || rawPublished === 'no') {
        status = 'draft';
      } else if (rawPublished === 'true' || rawPublished === '1' || rawPublished === 'yes') {
        status = 'published';
      }
    }

    const rawTags = getFieldVal(primaryRow, 'tags');
    const tags = rawTags
      ? rawTags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      : existingProd?.tags || ['SALE', 'Zariya-Pakistan'];

    // Collections
    const collectionSet = new Set<string>();
    rows.forEach(({ row }) => {
      const colCell = getFieldVal(row, 'collection');
      if (colCell) {
        colCell
          .split(/[,;|]/)
          .map((c) => c.trim())
          .filter(Boolean)
          .forEach((c) => collectionSet.add(c));
      }
    });

    // Collect Images across all rows for this Handle (supporting Image Position sorting + multiple URLs in single cell)
    const imageEntries: { url: string; position: number }[] = [];
    const seenImageUrls = new Set<string>();

    rows.forEach(({ row, rowNumber }) => {
      const rawImgCell = getFieldVal(row, 'imageSrc');
      const rawPos = parseInt(getFieldVal(row, 'imagePosition') || '999', 10) || 999;
      if (rawImgCell) {
        const urls = rawImgCell
          .split(/[;|]/)
          .map((u) => u.trim())
          .filter(Boolean);
        urls.forEach((url, uIdx) => {
          if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('/')) {
            prodWarnings.push({
              rowNumber,
              handle,
              field: 'Image Src',
              severity: 'warning',
              message: `Image URL "${url}" on row ${rowNumber} does not look like a valid URL or path; fallback image may be used.`,
            });
          } else if (!seenImageUrls.has(url)) {
            seenImageUrls.add(url);
            imageEntries.push({ url, position: rawPos + uIdx });
          }
        });
      }
    });

    imageEntries.sort((a, b) => a.position - b.position);
    const galleryImages =
      imageEntries.length > 0
        ? imageEntries.map((i) => i.url)
        : existingProd?.galleryImages?.length
        ? [...existingProd.galleryImages]
        : [DEFAULT_FALLBACK_IMAGE];

    // Parse Option Names & Variants across rows
    const option1Name = getFieldVal(primaryRow, 'option1Name') || 'Edition';
    const option2Name = getFieldVal(primaryRow, 'option2Name') || '';
    const option3Name = getFieldVal(primaryRow, 'option3Name') || '';

    const attrValuesMap = new Map<string, Set<string>>();
    const variants: ProductVariant[] = [];

    rows.forEach(({ row, rowNumber }, rIdx) => {
      const rowSku = getFieldVal(row, 'sku');
      const rowPriceStr = getFieldVal(row, 'price');
      const rowCompareStr = getFieldVal(row, 'compareAtPrice');
      const rowCostStr = getFieldVal(row, 'costPerItem');
      const rowStockStr = getFieldVal(row, 'inventoryQty');
      const rowBarcode = getFieldVal(row, 'barcode');
      const rowWeightStr = getFieldVal(row, 'weightGrams');
      const rowVariantImg = getFieldVal(row, 'variantImage');
      const opt1Val = getFieldVal(row, 'option1Value');
      const opt2Val = getFieldVal(row, 'option2Value');
      const opt3Val = getFieldVal(row, 'option3Value');

      // Determine if this row is purely an additional image row (no variant info at all on subsequent row)
      const isSubsequentImageOnlyRow =
        rIdx > 0 && !rowSku && !rowPriceStr && !opt1Val && !opt2Val && !opt3Val && !rowStockStr && Boolean(getFieldVal(row, 'imageSrc'));
      if (isSubsequentImageOnlyRow) {
        return;
      }

      // Validate Price
      let priceMinorUnits = existingProd?.basePriceMinorUnits || 0;
      if (rowPriceStr !== '') {
        const cleanedPrice = Number(rowPriceStr.replace(/[^0-9.-]/g, ''));
        if (Number.isNaN(cleanedPrice) || cleanedPrice <= 0) {
          prodErrors.push({
            rowNumber,
            handle,
            field: 'Variant Price',
            severity: 'error',
            message: `Invalid or non-positive price "${rowPriceStr}" on row ${rowNumber}.`,
          });
        } else {
          priceMinorUnits = Math.round(cleanedPrice * 100);
        }
      } else if (rIdx === 0 && !existingProd) {
        prodErrors.push({
          rowNumber,
          handle,
          field: 'Variant Price',
          severity: 'error',
          message: `Missing Variant Price on row ${rowNumber}.`,
        });
      } else if (variants.length > 0) {
        priceMinorUnits = variants[0].priceMinorUnits;
      }

      // Validate Compare-At Price
      let compareAtPriceMinorUnits: number | undefined = existingProd?.compareAtPriceMinorUnits;
      if (rowCompareStr !== '') {
        const cleanedCompare = Number(rowCompareStr.replace(/[^0-9.-]/g, ''));
        if (Number.isNaN(cleanedCompare) || cleanedCompare < 0) {
          prodErrors.push({
            rowNumber,
            handle,
            field: 'Compare At Price',
            severity: 'error',
            message: `Invalid Compare At Price "${rowCompareStr}" on row ${rowNumber}.`,
          });
        } else if (cleanedCompare > 0) {
          compareAtPriceMinorUnits = Math.round(cleanedCompare * 100);
          if (compareAtPriceMinorUnits < priceMinorUnits) {
            prodWarnings.push({
              rowNumber,
              handle,
              field: 'Compare At Price',
              severity: 'warning',
              message: `Compare At Price (${cleanedCompare.toFixed(2)}) is lower than Variant Price on row ${rowNumber}.`,
            });
          }
        }
      }

      // Validate Cost per item
      let costPerItemMinorUnits: number | undefined = existingProd?.costPerItemMinorUnits;
      if (rowCostStr !== '') {
        const cleanedCost = Number(rowCostStr.replace(/[^0-9.-]/g, ''));
        if (Number.isNaN(cleanedCost) || cleanedCost < 0) {
          prodErrors.push({
            rowNumber,
            handle,
            field: 'Cost per item',
            severity: 'error',
            message: `Invalid Cost per item "${rowCostStr}" on row ${rowNumber}.`,
          });
        } else if (cleanedCost > 0) {
          costPerItemMinorUnits = Math.round(cleanedCost * 100);
        }
      }

      // Validate Stock / Inventory Qty
      let stockQuantity = 15;
      if (rowStockStr !== '') {
        const parsedStock = Number(rowStockStr);
        if (Number.isNaN(parsedStock) || !Number.isInteger(parsedStock) || parsedStock < 0) {
          prodErrors.push({
            rowNumber,
            handle,
            field: 'Inventory Qty',
            severity: 'error',
            message: `Invalid inventory quantity "${rowStockStr}" on row ${rowNumber} (must be a non-negative integer).`,
          });
        } else {
          stockQuantity = parsedStock;
        }
      } else if (existingProd?.variants[rIdx]) {
        stockQuantity = existingProd.variants[rIdx].stockQuantity;
      }

      // Weight
      let weightGrams = existingProd?.shippingWeightGrams || 200;
      if (rowWeightStr !== '') {
        const parsedWeight = Number(rowWeightStr);
        if (!Number.isNaN(parsedWeight) && parsedWeight >= 0) {
          weightGrams = Math.round(parsedWeight);
        }
      }

      // SKU check
      const finalSku =
        rowSku ||
        existingProd?.variants[rIdx]?.sku ||
        `${handle.toUpperCase().slice(0, 10)}-${rIdx + 1}`;
      if (!rowSku) {
        prodWarnings.push({
          rowNumber,
          handle,
          field: 'Variant SKU',
          severity: 'warning',
          message: `Missing SKU on row ${rowNumber}; auto-generated "${finalSku}".`,
        });
      } else {
        const prevHandleForSku = seenSkusAcrossHandles.get(finalSku.toLowerCase());
        if (prevHandleForSku && prevHandleForSku !== handle) {
          prodWarnings.push({
            rowNumber,
            handle,
            field: 'Variant SKU',
            severity: 'warning',
            message: `SKU "${finalSku}" on row ${rowNumber} is also used by product "${prevHandleForSku}".`,
          });
        }
        seenSkusAcrossHandles.set(finalSku.toLowerCase(), handle);
      }

      // Build variant attributes & title
      const attributes: Record<string, string> = {};
      const titleParts: string[] = [];

      if (opt1Val) {
        const k1 = getFieldVal(row, 'option1Name') || option1Name || 'Option 1';
        attributes[k1] = opt1Val;
        titleParts.push(opt1Val);
        if (!attrValuesMap.has(k1)) attrValuesMap.set(k1, new Set());
        attrValuesMap.get(k1)!.add(opt1Val);
      }
      if (opt2Val) {
        const k2 = getFieldVal(row, 'option2Name') || option2Name || 'Option 2';
        attributes[k2] = opt2Val;
        titleParts.push(opt2Val);
        if (!attrValuesMap.has(k2)) attrValuesMap.set(k2, new Set());
        attrValuesMap.get(k2)!.add(opt2Val);
      }
      if (opt3Val) {
        const k3 = getFieldVal(row, 'option3Name') || option3Name || 'Option 3';
        attributes[k3] = opt3Val;
        titleParts.push(opt3Val);
        if (!attrValuesMap.has(k3)) attrValuesMap.set(k3, new Set());
        attrValuesMap.get(k3)!.add(opt3Val);
      }

      if (titleParts.length === 0) {
        attributes[option1Name] = 'Default Title';
        titleParts.push('Default Title');
        if (!attrValuesMap.has(option1Name)) attrValuesMap.set(option1Name, new Set());
        attrValuesMap.get(option1Name)!.add('Default Title');
      }

      const variantTitle =
        titleParts.join(' / ') === 'Default Title' ? 'Standard Edition' : titleParts.join(' / ');

      const existingVariant = existingProd?.variants.find(
        (v) => v.sku.toLowerCase() === finalSku.toLowerCase() || v.title.toLowerCase() === variantTitle.toLowerCase()
      );

      variants.push({
        id: existingVariant?.id || `var_${slugifyHandle(finalSku)}_${rIdx + 1}`,
        sku: finalSku,
        barcode: rowBarcode || existingVariant?.barcode || existingProd?.barcode || '6291041500999',
        title: variantTitle,
        attributes,
        priceMinorUnits,
        compareAtPriceMinorUnits,
        costPerItemMinorUnits,
        stockQuantity,
        committedQuantity: existingVariant?.committedQuantity ?? 0,
        incomingQuantity: existingVariant?.incomingQuantity ?? 0,
        weightGrams,
        image: rowVariantImg || getFieldVal(row, 'imageSrc') || galleryImages[0],
      });
    });

    const attributesList: ProductAttribute[] = Array.from(attrValuesMap.entries()).map(([name, valSet], idx) => ({
      id: `attr_${idx + 1}`,
      name,
      values: Array.from(valSet),
    }));

    const primaryVariant = variants[0];
    const basePriceMinorUnits = primaryVariant?.priceMinorUnits || existingProd?.basePriceMinorUnits || 10000;
    const compareAtPriceMinorUnits =
      primaryVariant?.compareAtPriceMinorUnits ??
      existingProd?.compareAtPriceMinorUnits ??
      Math.round(basePriceMinorUnits * 1.15);
    const costPerItemMinorUnits =
      primaryVariant?.costPerItemMinorUnits ??
      existingProd?.costPerItemMinorUnits ??
      Math.round(basePriceMinorUnits * 0.5);

    const invPolicyRaw = getFieldVal(primaryRow, 'inventoryPolicy').toLowerCase();
    const continueSellingWhenOutOfStock =
      invPolicyRaw === 'continue' ? true : invPolicyRaw === 'deny' ? false : existingProd?.continueSellingWhenOutOfStock ?? false;

    const reqShippingRaw = getFieldVal(primaryRow, 'requiresShipping').toLowerCase();
    const isPhysicalProduct =
      reqShippingRaw === 'false' || reqShippingRaw === '0'
        ? false
        : reqShippingRaw === 'true' || reqShippingRaw === '1'
        ? true
        : existingProd?.isPhysicalProduct ?? true;

    const seoTitle =
      getFieldVal(primaryRow, 'seoTitle') || existingProd?.seoTitle || `${rawTitle || handle} | ZARIYA Pakistan`;
    const seoDescription =
      getFieldVal(primaryRow, 'seoDescription') || existingProd?.seoDescription || shortDescription;

    const builtProduct: Product = {
      id: existingProd?.id || `prod_csv_${Date.now()}_${previews.length + 1}`,
      name: rawTitle || handle,
      slug: handle,
      sku: primaryVariant?.sku || existingProd?.sku || `ZAR-${handle.toUpperCase()}`,
      barcode: primaryVariant?.barcode || existingProd?.barcode || '896400110099',
      brand,
      vendor,
      categoryId,
      productType,
      tags,
      collectionIds: existingProd?.collectionIds || [],
      shortDescription,
      fullDescription,
      galleryImages,
      specs: existingProd?.specs || {
        Origin: 'Gulberg III Atelier, Lahore',
        Delivery: 'Cash on Delivery Nationwide',
        Brand: vendor,
      },
      attributes: attributesList.length > 0 ? attributesList : [{ id: 'size', name: 'Size', values: ['M'] }],
      variants,
      status,
      basePriceMinorUnits,
      compareAtPriceMinorUnits,
      costPerItemMinorUnits,
      trackQuantity: true,
      continueSellingWhenOutOfStock,
      isPhysicalProduct,
      shippingWeightGrams: primaryVariant?.weightGrams || 450,
      countrySpecificPrices: {
        ...(existingProd?.countrySpecificPrices || {}),
        PK: basePriceMinorUnits,
      },
      currencySpecificPrices: {
        ...(existingProd?.currencySpecificPrices || {}),
        PKR: basePriceMinorUnits,
      },
      isAgeRestricted: false,
      complianceWarning: existingProd?.complianceWarning || 'Cash on Delivery Available',
      featured: existingProd?.featured ?? true,
      seoTitle,
      seoDescription,
      seoKeywords: tags.length > 0 ? tags : ['pakistan', 'zariya'],
      metafields: existingProd?.metafields || [],
    };

    allIssues.push(...prodErrors, ...prodWarnings);

    previews.push({
      handle,
      action: existingProd ? 'update' : 'create',
      existingProductId: existingProd?.id,
      sourceRowNumbers,
      product: builtProduct,
      collectionNames: Array.from(collectionSet),
      errors: prodErrors,
      warnings: prodWarnings,
      isValid: prodErrors.length === 0,
    });
  });

  const validProductsCount = previews.filter((p) => p.isValid).length;
  const errorProductsCount = previews.filter((p) => !p.isValid).length;
  const warningProductsCount = previews.filter((p) => p.warnings.length > 0).length;
  const newProductsCount = previews.filter((p) => p.action === 'create' && p.isValid).length;
  const updateProductsCount = previews.filter((p) => p.action === 'update' && p.isValid).length;
  const totalVariantsCount = previews.reduce((sum, p) => sum + p.product.variants.length, 0);
  const totalImagesCount = previews.reduce((sum, p) => sum + p.product.galleryImages.length, 0);

  return {
    headers,
    rawRows,
    mappings,
    products: previews,
    allIssues,
    validProductsCount,
    errorProductsCount,
    warningProductsCount,
    newProductsCount,
    updateProductsCount,
    totalVariantsCount,
    totalImagesCount,
  };
}

/**
 * Generates an official Shopify-compatible Product CSV Template containing sample multi-variant
 * and multi-image products with all key columns.
 */
export function generateShopifyCsvTemplate(): string {
  const headers = [
    'Handle',
    'Title',
    'Body (HTML)',
    'Short Description',
    'Vendor',
    'Brand',
    'Product Category',
    'Type',
    'Tags',
    'Status',
    'Published',
    'Option1 Name',
    'Option1 Value',
    'Option2 Name',
    'Option2 Value',
    'Variant SKU',
    'Variant Barcode',
    'Variant Price',
    'Variant Compare At Price',
    'Cost per item',
    'Variant Inventory Qty',
    'Variant Inventory Policy',
    'Variant Grams',
    'Variant Requires Shipping',
    'Image Src',
    'Image Position',
    'Variant Image',
    'Collection',
    'SEO Title',
    'SEO Description',
  ];

  const sampleRows = [
    [
      'zariya-blush-3pc-embroidered-lawn',
      'Zariya Blush 3 Piece Embroidered Lawn',
      '<p>Soft blush pink combed 80/80 summer lawn shirt with resham neckline embroidery, paired with a crinkle chiffon dupatta and cambric trousers.</p>',
      '3-Piece Embroidered Summer Lawn Suit with Chiffon Dupatta.',
      'Zariya Atelier Lahore',
      'Zariya Atelier',
      '3-piece-suits',
      'stitched_3pc',
      'SALE, 3 Piece, Embroidered Lawn, Best Seller',
      'active',
      'TRUE',
      'Size',
      'M',
      'Color',
      'Blush Rose',
      'ZAR-LWN3-M-ROSE',
      '896400110050',
      '3290.00',
      '5490.00',
      '1750.00',
      '18',
      'deny',
      '550',
      'TRUE',
      '/src/assets/images/pk_lawn_3pc_rose_1794509751128.jpg',
      '1',
      '/src/assets/images/pk_lawn_3pc_rose_1794509751128.jpg',
      'SALE SALE SALE',
      'Zariya Blush 3 Piece Embroidered Lawn | ZARIYA Pakistan',
      'Shop blush pink embroidered 3 piece Pakistani lawn suit at 40% off.',
    ],
    [
      'zariya-pastel-peach-casual-kurti',
      'Pastel Peach Floral Printed Kurti',
      '<p>Breathable summer cotton-lawn floral printed casual kurti tailored with pintuck neckline.</p>',
      'Everyday pastel peach printed cotton kurti under Rs. 1,999.',
      'Khaas Textile Mills',
      'Khaas Lawn',
      'casual-wear',
      'kurti',
      'SALE, Under Rs. 1,999, Casual Wear',
      'active',
      'TRUE',
      'Size',
      'S',
      'Color',
      'Pastel Peach',
      'KHA-KRT-S-PCH',
      '896400110051',
      '1290.00',
      '4300.00',
      '620.00',
      '35',
      'continue',
      '260',
      'TRUE',
      '/src/assets/images/pk_kurti_pastel_peach_1794509754295.jpg',
      '1',
      '/src/assets/images/pk_kurti_pastel_peach_1794509754295.jpg',
      'Under Rs. 1,999',
      'Pastel Peach Floral Printed Kurti | ZARIYA Sale',
      'Affordable everyday printed Pakistani kurti on sale for Rs. 1,290.',
    ],
  ];

  const lines = [
    headers.map(escapeCsvCell).join(','),
    ...sampleRows.map((row) => row.map(escapeCsvCell).join(',')),
  ];
  return lines.join('\n');
}

/**
 * Exports an array of Products to a Shopify-compatible CSV string.
 * Supports both full multi-row Shopify format (all variants & gallery images) and single-row summary format.
 */
export function exportProductsToShopifyCsv(
  productsToExport: Product[],
  collections: ProductCollection[] = [],
  format: 'shopify_multirow' | 'summary_singlerow' = 'shopify_multirow'
): string {
  if (format === 'summary_singlerow') {
    const headers = [
      'Handle',
      'Title',
      'SKU',
      'Barcode',
      'Vendor',
      'Brand',
      'Product Category',
      'Type',
      'Status',
      'Variant Price',
      'Variant Compare At Price',
      'Cost per item',
      'Variant Inventory Qty',
      'Variants Count',
      'Tags',
      'Image Src',
      'Collection',
      'SEO Title',
      'SEO Description',
    ];

    const rows = productsToExport.map((p) => {
      const totalStock = p.variants.reduce((acc, v) => acc + v.stockQuantity, 0);
      const matchedCols = collections
        .filter((c) => c.productIds.includes(p.id) || (p.collectionIds || []).includes(c.id))
        .map((c) => c.title)
        .join('; ');

      return [
        p.slug,
        p.name,
        p.sku,
        p.barcode || '',
        p.vendor || p.brand,
        p.brand,
        p.categoryId,
        p.productType,
        p.status === 'published' ? 'active' : p.status,
        (p.basePriceMinorUnits / 100).toFixed(2),
        ((p.compareAtPriceMinorUnits || 0) / 100).toFixed(2),
        ((p.costPerItemMinorUnits || 0) / 100).toFixed(2),
        String(totalStock),
        String(p.variants.length),
        (p.tags || []).join(', '),
        (p.galleryImages || []).join('; '),
        matchedCols,
        p.seoTitle || '',
        p.seoDescription || '',
      ].map(escapeCsvCell).join(',');
    });

    return [headers.map(escapeCsvCell).join(','), ...rows].join('\n');
  }

  // Full Shopify Multi-Row Format (variants + gallery images)
  const headers = [
    'Handle',
    'Title',
    'Body (HTML)',
    'Short Description',
    'Vendor',
    'Brand',
    'Product Category',
    'Type',
    'Tags',
    'Status',
    'Published',
    'Option1 Name',
    'Option1 Value',
    'Option2 Name',
    'Option2 Value',
    'Option3 Name',
    'Option3 Value',
    'Variant SKU',
    'Variant Barcode',
    'Variant Price',
    'Variant Compare At Price',
    'Cost per item',
    'Variant Inventory Qty',
    'Variant Inventory Policy',
    'Variant Grams',
    'Variant Requires Shipping',
    'Image Src',
    'Image Position',
    'Variant Image',
    'Collection',
    'SEO Title',
    'SEO Description',
  ];

  const outputRows: string[] = [headers.map(escapeCsvCell).join(',')];

  productsToExport.forEach((p) => {
    const matchedCols = collections
      .filter((c) => c.productIds.includes(p.id) || (p.collectionIds || []).includes(c.id))
      .map((c) => c.title)
      .join('; ');

    const variants = p.variants.length > 0 ? p.variants : [
      {
        id: `var_${p.id}`,
        sku: p.sku,
        barcode: p.barcode || '',
        title: 'Standard Edition',
        attributes: { Edition: 'Standard Edition' },
        priceMinorUnits: p.basePriceMinorUnits,
        compareAtPriceMinorUnits: p.compareAtPriceMinorUnits,
        costPerItemMinorUnits: p.costPerItemMinorUnits,
        stockQuantity: 0,
        weightGrams: p.shippingWeightGrams || 200,
        image: p.galleryImages[0] || '',
      },
    ];

    const images = p.galleryImages || [];
    const maxRows = Math.max(variants.length, images.length, 1);

    for (let i = 0; i < maxRows; i++) {
      const isFirstRow = i === 0;
      const variant = variants[i];
      const imageUrl = images[i] || '';
      const attrEntries = variant ? Object.entries(variant.attributes || {}) : [];
      const [opt1Name, opt1Val] = attrEntries[0] || [p.attributes?.[0]?.name || 'Title', variant?.title || 'Default Title'];
      const [opt2Name, opt2Val] = attrEntries[1] || [p.attributes?.[1]?.name || '', ''];
      const [opt3Name, opt3Val] = attrEntries[2] || [p.attributes?.[2]?.name || '', ''];

      const rowCells = [
        p.slug,
        isFirstRow ? p.name : '',
        isFirstRow ? p.fullDescription : '',
        isFirstRow ? p.shortDescription : '',
        isFirstRow ? (p.vendor || p.brand) : '',
        isFirstRow ? p.brand : '',
        isFirstRow ? p.categoryId : '',
        isFirstRow ? p.productType : '',
        isFirstRow ? (p.tags || []).join(', ') : '',
        isFirstRow ? (p.status === 'published' ? 'active' : p.status) : '',
        isFirstRow ? (p.status === 'published' ? 'TRUE' : 'FALSE') : '',
        variant ? opt1Name : '',
        variant ? opt1Val : '',
        variant ? opt2Name : '',
        variant ? opt2Val : '',
        variant ? opt3Name : '',
        variant ? opt3Val : '',
        variant ? variant.sku : '',
        variant ? (variant.barcode || p.barcode || '') : '',
        variant ? (variant.priceMinorUnits / 100).toFixed(2) : '',
        variant
          ? (((variant.compareAtPriceMinorUnits ?? p.compareAtPriceMinorUnits ?? 0) / 100).toFixed(2))
          : '',
        variant
          ? (((variant.costPerItemMinorUnits ?? p.costPerItemMinorUnits ?? 0) / 100).toFixed(2))
          : '',
        variant ? String(variant.stockQuantity) : '',
        variant ? (p.continueSellingWhenOutOfStock ? 'continue' : 'deny') : '',
        variant ? String(variant.weightGrams || p.shippingWeightGrams || 200) : '',
        variant ? ((p.isPhysicalProduct ?? true) ? 'TRUE' : 'FALSE') : '',
        imageUrl,
        imageUrl ? String(i + 1) : '',
        variant ? (variant.image || images[0] || '') : '',
        isFirstRow ? matchedCols : '',
        isFirstRow ? (p.seoTitle || '') : '',
        isFirstRow ? (p.seoDescription || '') : '',
      ];

      outputRows.push(rowCells.map(escapeCsvCell).join(','));
    }
  });

  return outputRows.join('\n');
}
