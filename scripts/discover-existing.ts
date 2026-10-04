import { getServiceSupabase, supabase } from '../src/lib/supabase';
import { extractSearchQuery } from './scrapers/query-extractor';
import { searchPlatform } from './scrapers/search';
import { computeProductMatchScore } from '../src/lib/dsa';
import { Platform, Product } from '../src/types';

/**
 * Cross-Platform Batch Discovery Worker
 * Scans all existing tracked products, performs cross-store searches,
 * identifies lowest market alternatives, and clusters them into product groups.
 */
async function runBatchDiscovery() {
  console.log('🚀 Initiating Cross-Platform Batch Product Discovery Job...\n');

  const db = getServiceSupabase ? getServiceSupabase() : supabase;
  const ALL_PLATFORMS: Platform[] = ['amazon', 'flipkart', 'meesho', 'myntra', 'ajio', 'westside'];

  // 1. Fetch active products
  const { data: products, error } = await db
    .from('products')
    .select('*')
    .eq('is_active', true);

  if (error || !products) {
    console.error('❌ Failed to fetch products:', error?.message);
    process.exit(1);
  }

  console.log(`📦 Found ${products.length} active products to evaluate for cross-platform matches.`);

  let groupsCreated = 0;
  let matchesFound = 0;

  for (const product of products as Product[]) {
    console.log(`\n🔍 Analyzing product: "${product.title.slice(0, 40)}..." [${product.platform.toUpperCase()}]`);

    const query = extractSearchQuery(product.title);
    if (!query) {
      console.log('  ⚠️ Skipping: unable to extract search tokens.');
      continue;
    }

    console.log(`  🎯 Extracted query: "${query}"`);

    // Ensure group exists
    let groupId = product.group_id;
    if (!groupId) {
      const { data: newGroup, error: gErr } = await db
        .from('product_groups')
        .insert({
          user_id: product.user_id,
          title: product.title,
          search_query: query,
          best_price: product.current_price,
          best_platform: product.platform,
          best_url: product.url,
        })
        .select()
        .single();

      if (!gErr && newGroup) {
        groupId = newGroup.id;
        groupsCreated++;
        await db.from('products').update({ group_id: groupId }).eq('id', product.id);
        console.log(`  ✨ Created product group: ${groupId}`);
      }
    }

    // Query other platforms
    const targetPlatforms = ALL_PLATFORMS.filter((p) => p !== product.platform);
    for (const p of targetPlatforms) {
      try {
        const results = await searchPlatform(p, query, 3);
        for (const item of results) {
          const match = computeProductMatchScore(
            { title: product.title, price: product.current_price, platform: product.platform },
            { title: item.title, price: item.price, brand: item.brand, platform: p }
          );

          if (match.score >= 50) {
            matchesFound++;
            console.log(
              `    🌟 Discovered on [${p.toUpperCase()}]: "${item.title.slice(0, 30)}" - ₹${item.price} (${match.score}% match, ${match.confidence})`
            );

            if (groupId) {
              await db.from('cross_platform_suggestions').upsert(
                {
                  product_id: product.id,
                  group_id: groupId,
                  user_id: product.user_id,
                  platform: p,
                  title: item.title,
                  price: item.price,
                  original_price: item.originalPrice || null,
                  product_url: item.productUrl,
                  image_url: item.imageUrl || null,
                  similarity_score: match.score,
                  confidence: match.confidence,
                  status: 'pending',
                },
                { onConflict: 'group_id,platform,product_url' }
              );
            }
          }
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`    ⚠️ Platform search error on ${p}: ${msg}`);
      }
    }
  }

  console.log(`\n🎉 Cross-Platform Discovery Complete!`);
  console.log(`  • Product Groups Created/Updated: ${groupsCreated}`);
  console.log(`  • Cross-Store Matches Discovered: ${matchesFound}`);
}

runBatchDiscovery().catch((err) => {
  console.error('Fatal batch discovery failure:', err);
  process.exit(1);
});
