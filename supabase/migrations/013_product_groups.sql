-- ============================================================================
-- Migration 013: Product Groups & Cross-Platform Auto-Discovery Engine
-- Enables linking cross-store product variants and tracking the lowest market price
-- ============================================================================

-- 1. Product Groups Table
CREATE TABLE IF NOT EXISTS product_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  search_query TEXT,
  best_price NUMERIC,
  best_platform TEXT,
  best_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for user lookup
CREATE INDEX IF NOT EXISTS idx_product_groups_user_id ON product_groups(user_id);

-- 2. Add group_id to products table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'group_id'
  ) THEN
    ALTER TABLE products ADD COLUMN group_id UUID REFERENCES product_groups(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_products_group_id ON products(group_id);

-- 3. Cross-Platform Suggestions Table (Candidates waiting for confirmation or auto-link)
CREATE TABLE IF NOT EXISTS cross_platform_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  group_id UUID REFERENCES product_groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  title TEXT NOT NULL,
  price NUMERIC NOT NULL,
  original_price NUMERIC,
  image_url TEXT,
  product_url TEXT NOT NULL,
  similarity_score NUMERIC NOT NULL DEFAULT 0,
  confidence TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'accepted' | 'rejected'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cross_suggestions_product_id ON cross_platform_suggestions(product_id);
CREATE INDEX IF NOT EXISTS idx_cross_suggestions_group_id ON cross_platform_suggestions(group_id);
CREATE INDEX IF NOT EXISTS idx_cross_suggestions_user_id ON cross_platform_suggestions(user_id);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE product_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE cross_platform_suggestions ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for product_groups
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own product groups' AND tablename = 'product_groups') THEN
    CREATE POLICY "Users can view own product groups"
      ON product_groups FOR SELECT
      USING (auth.uid() = user_id OR user_id IS NULL);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert own product groups' AND tablename = 'product_groups') THEN
    CREATE POLICY "Users can insert own product groups"
      ON product_groups FOR INSERT
      WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own product groups' AND tablename = 'product_groups') THEN
    CREATE POLICY "Users can update own product groups"
      ON product_groups FOR UPDATE
      USING (auth.uid() = user_id OR user_id IS NULL);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete own product groups' AND tablename = 'product_groups') THEN
    CREATE POLICY "Users can delete own product groups"
      ON product_groups FOR DELETE
      USING (auth.uid() = user_id OR user_id IS NULL);
  END IF;
END $$;

-- 6. RLS Policies for cross_platform_suggestions
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own suggestions' AND tablename = 'cross_platform_suggestions') THEN
    CREATE POLICY "Users can view own suggestions"
      ON cross_platform_suggestions FOR SELECT
      USING (auth.uid() = user_id OR user_id IS NULL);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage own suggestions' AND tablename = 'cross_platform_suggestions') THEN
    CREATE POLICY "Users can manage own suggestions"
      ON cross_platform_suggestions FOR ALL
      USING (auth.uid() = user_id OR user_id IS NULL);
  END IF;
END $$;
