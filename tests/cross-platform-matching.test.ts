import assert from 'assert';
import { extractSearchQuery } from '../scripts/scrapers/query-extractor';
import { calculateTokenJaccard, computeProductMatchScore } from '../src/lib/dsa';

console.log('🧪 Running Cross-Platform Matching & Query Extraction Test Suite...\n');

let passed = 0;

// 1. Query Extractor Tests
console.log('1. Testing Query Extractor...');

const rawTitle1 = 'Glitchez Men Relaxed Fit High-Rise Heavy Fade Cargo Jeans (Grey, 32)';
const q1 = extractSearchQuery(rawTitle1, 'Glitchez');
console.log(`  Input:  "${rawTitle1}"`);
console.log(`  Output: "${q1}"`);
assert(q1.includes('glitchez'), 'Query must retain brand Glitchez');
assert(q1.includes('cargo'), 'Query must retain core product type cargo');
assert(q1.includes('jeans'), 'Query must retain core product type jeans');
assert(!q1.includes('32'), 'Query must strip size 32');
assert(!q1.includes('men'), 'Query must strip noise token men');
console.log('  ✅ [PASS] Cleaned apparel title with size & noisy words removed.');
passed++;

const rawTitle2 = 'GAP Men Logo Crew Neck T-Shirt - Buy Online | Myntra [Pack of 2]';
const q2 = extractSearchQuery(rawTitle2, 'GAP');
console.log(`  Input:  "${rawTitle2}"`);
console.log(`  Output: "${q2}"`);
assert(q2.includes('gap'), 'Query must retain brand GAP');
assert(q2.includes('shirt'), 'Query must retain core product type shirt');
assert(!q2.includes('myntra'), 'Query must strip site name');
assert(!q2.includes('pack'), 'Query must strip pack of 2');
console.log('  ✅ [PASS] Cleaned promo slogans and pack specifications.');
passed++;

// 2. Token Jaccard Similarity Tests
console.log('\n2. Testing Token Jaccard Similarity...');

const j1 = calculateTokenJaccard(
  'Glitchez Men Relaxed Fit Cargo Jeans',
  'Glitchez Relaxed Fit Heavy Cargo Denim Jeans'
);
assert(j1 > 0.5, `Jaccard overlap should be high for similar titles, got ${j1}`);
console.log(`  ✅ [PASS] High Jaccard similarity for close titles: ${(j1 * 100).toFixed(1)}%`);
passed++;

const j2 = calculateTokenJaccard(
  'Apple iPhone 15 Pro Max 256GB Natural Titanium',
  'Women Floral Print Rayon Kurta with Pant'
);
assert(j2 === 0, 'Jaccard overlap should be zero for completely disjoint products');
console.log('  ✅ [PASS] Zero Jaccard similarity for unrelated products.');
passed++;

// 3. Multi-Signal Match Scoring Tests
console.log('\n3. Testing Multi-Signal Match Scoring...');

const highMatch = computeProductMatchScore(
  {
    title: 'Glitchez Men Relaxed Fit Cargo Jeans Grey',
    price: 879,
    brand: 'Glitchez',
    platform: 'myntra',
  },
  {
    title: 'Glitchez Relaxed Fit Cargo Pants / Jeans',
    price: 799,
    brand: 'Glitchez',
    platform: 'amazon',
  }
);
console.log(`  Match Score: ${highMatch.score}/100, Confidence: ${highMatch.confidence}`);
assert(highMatch.score >= 70, 'Should score >= 70 for same brand and close price');
assert.strictEqual(highMatch.confidence, 'high');
assert.strictEqual(highMatch.brandMatched, true);
console.log('  ✅ [PASS] High confidence match correctly detected across stores.');
passed++;

const priceMismatch = computeProductMatchScore(
  {
    title: 'Sony WH-1000XM5 Wireless Headphones',
    price: 29990,
    brand: 'Sony',
    platform: 'amazon',
  },
  {
    title: 'Sony WH-1000XM5 Headphone Replacement Ear Cushion Pads',
    price: 999,
    brand: 'Sony',
    platform: 'flipkart',
  }
);
console.log(`  Accessory Match Score: ${priceMismatch.score}/100, Confidence: ${priceMismatch.confidence}`);
assert(priceMismatch.confidence !== 'high', 'Accessory with 95% price drop should NOT be high confidence');
console.log('  ✅ [PASS] Price proximity barrier prevented accessory false-positive.');
passed++;

console.log(`\n🎉 Cross-Platform Match Suite Passed: ${passed}/${passed} tests successful!`);
