/**
 * Product Query Extractor & Normalizer
 * Distills noisy ecommerce product titles into high-relevance search tokens
 * for cross-platform catalog matching.
 */

// Suffixes and words frequently added by ecommerce platforms
const NOISE_WORDS = new Set([
  'online', 'india', 'buy', 'offer', 'discount', 'free', 'shipping', 'deal',
  'genuine', 'original', 'pack', 'combo', 'set', 'exclusive', 'latest',
  'trending', 'collection', 'edition', 'men', 'mens', 'women', 'womens',
  'boys', 'girls', 'kids', 'unisex', 'regular', 'casual', 'formal', 'official',
  'high', 'rise', 'mid', 'low', 'heavy', 'fade', 'light', 'wash', 'solid',
  'pure', 'premium', 'printed', 'plain', 'stylish', 'look', 'looks'
]);

// Patterns matching apparel sizes, pack counts, storage, specs
const SPEC_PATTERNS = [
  /\bpack\s*of\s*\d+\b/gi,
  /\bset\s*of\s*\d+\b/gi,
  /\b\d+\s*gb\b/gi,
  /\b\d+\s*tb\b/gi,
  /\b\d+\s*mb\b/gi,
  /\b(?:size|sz)[:\s]*[xsml0-9]+\b/gi,
  /\b[2-4][0-9]\s*(?:inch|cm|mm)\b/gi,
  /\b(?:28|30|32|34|36|38|40|42)\s*(?:waist)?\b/gi,
  /\b(?:xs|s|m|l|xl|xxl|2xl|3xl|4xl)\b/gi,
  /\b\d{6,}\b/g, // Raw numeric style IDs / SKUs
];

/**
 * Extracts a normalized, concise cross-platform search query from a raw product title.
 * 
 * Example:
 * "Glitchez Men Relaxed Fit High-Rise Heavy Fade Cargo Jeans (Grey, 32)"
 * -> "Glitchez relaxed fit cargo jeans"
 */
export function extractSearchQuery(title: string, brand?: string): string {
  if (!title || typeof title !== 'string') return '';

  let clean = title.trim();

  // 1. Remove parenthetical or bracketed details like (Grey, 32) or [Pack of 2]
  clean = clean.replace(/\([^)]*\)/g, ' ').replace(/\[[^\]]*\]/g, ' ');

  // 2. Remove trailing store suffixes like " - Buy Online | Myntra"
  clean = clean.replace(/\s+[-|]\s+.*$/, ' ');

  // 3. Remove known spec patterns (sizes, pack counts, pure digits > 5)
  for (const pattern of SPEC_PATTERNS) {
    clean = clean.replace(pattern, ' ');
  }

  // 4. Tokenize and clean punctuation
  const tokens = clean
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

// High-priority product nouns that define what an item is
const CORE_PRODUCT_NOUNS = new Set([
  'shirt', 'tshirt', 'tee', 'jeans', 'pant', 'pants', 'trousers', 'cargo', 'cargos',
  'dress', 'skirt', 'jacket', 'hoodie', 'sweatshirt', 'kurta', 'saree', 'top',
  'shoes', 'sneakers', 'sandals', 'heels', 'boots', 'slippers',
  'watch', 'smartwatch', 'headphones', 'earphones', 'earbuds', 'phone', 'laptop',
  'bag', 'backpack', 'wallet', 'belt', 'perfume', 'deodorant'
]);

  // 5. Filter out noise words while separating core nouns from descriptors
  const coreNouns: string[] = [];
  const descriptors: string[] = [];
  const seen = new Set<string>();

  for (const token of tokens) {
    if (token.length <= 1) continue;
    if (NOISE_WORDS.has(token)) continue;
    if (!seen.has(token)) {
      seen.add(token);
      if (CORE_PRODUCT_NOUNS.has(token)) {
        coreNouns.push(token);
      } else {
        descriptors.push(token);
      }
    }
  }

  // Combine: Brand + core product nouns + top descriptive qualifiers
  const combined: string[] = [];
  if (brand && brand.trim()) {
    const cleanBrand = brand.trim().toLowerCase();
    combined.push(cleanBrand);
    seen.add(cleanBrand);
  }

  // Add descriptors and core nouns
  for (const d of descriptors) {
    if (!combined.includes(d)) combined.push(d);
  }
  for (const n of coreNouns) {
    if (!combined.includes(n)) combined.push(n);
  }

  // Ensure total tokens does not exceed 5, prioritizing core nouns if length overflows
  let finalTokens = combined;
  if (finalTokens.length > 5) {
    // Keep brand and core nouns unconditionally, then fill remaining slots with descriptors
    const priority = combined.filter((t) => (brand && t === brand.toLowerCase()) || CORE_PRODUCT_NOUNS.has(t));
    const others = combined.filter((t) => !priority.includes(t));
    finalTokens = [...priority, ...others].slice(0, 5);
  }

  return finalTokens.join(' ').trim();
}
