-- ============================================
-- 完整许可证系统设置脚本
-- 包含work_licenses表和授权声明书功能
-- ============================================

-- 1. 确保license_options表存在
CREATE TABLE IF NOT EXISTS license_options (
  id SERIAL PRIMARY KEY,
  license_code VARCHAR(50) NOT NULL UNIQUE,
  license_name VARCHAR(100) NOT NULL,
  description TEXT,
  commercial_use VARCHAR(2) NOT NULL, -- A1, A2, A3
  derivative_works VARCHAR(2) NOT NULL, -- B1, B2
  nft_minting VARCHAR(2) NOT NULL, -- C1, C2
  share_alike VARCHAR(2) NOT NULL, -- D1, D2
  license_url TEXT,
  badge_url TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 确保work_licenses表存在
CREATE TABLE IF NOT EXISTS work_licenses (
  id SERIAL PRIMARY KEY,
  work_id BIGINT NOT NULL UNIQUE,
  commercial_use VARCHAR(2) NOT NULL, -- A1, A2, A3
  derivative_works VARCHAR(2) NOT NULL, -- B1, B2
  nft_minting VARCHAR(2) NOT NULL, -- C1, C2
  share_alike VARCHAR(2) NOT NULL, -- D1, D2
  license_code VARCHAR(50) NOT NULL,
  license_name VARCHAR(100) NOT NULL,
  custom_terms TEXT,
  ai_recommended BOOLEAN DEFAULT false,
  ai_recommendation_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (work_id) REFERENCES works(work_id) ON DELETE CASCADE
);

-- 3. 插入默认许可证选项（如果不存在）
INSERT INTO license_options (license_code, license_name, description, commercial_use, derivative_works, nft_minting, share_alike, license_url, sort_order) VALUES
('CC BY', 'CC BY - Attribution', 'Commercial use, derivatives, and NFT minting allowed. Only attribution required.', 'A1', 'B1', 'C1', 'D2', 'https://creativecommons.org/licenses/by/4.0/', 1),
('CC BY-NC', 'CC BY-NC - Non-Commercial', 'Non-commercial derivatives allowed, but no secondary NFT minting.', 'A2', 'B1', 'C2', 'D2', 'https://creativecommons.org/licenses/by-nc/4.0/', 2),
('CC BY-NC-SA', 'CC BY-NC-SA - Non-Commercial ShareAlike', 'Non-commercial derivatives with same license required.', 'A2', 'B1', 'C2', 'D1', 'https://creativecommons.org/licenses/by-nc-sa/4.0/', 3),
('CC BY-NoNFT', 'CC BY + No Secondary NFT', 'Commercial and derivatives allowed, but blockchain minting prohibited.', 'A1', 'B1', 'C2', 'D2', NULL, 4),
('CC BY-NC-CR', 'CC BY-NC + Commercial Reserved', 'Free derivatives, but commercial use requires author permission.', 'A3', 'B1', 'C2', 'D2', NULL, 5),
('ARR', 'All Rights Reserved', 'Display only - no derivatives or commercial use allowed.', 'A2', 'B2', 'C2', 'D2', NULL, 6),
('CCD', 'Custom Commercial Display License', 'Commercial use allowed but no derivatives.', 'A1', 'B2', 'C2', 'D2', NULL, 7),
('CC BY-SA', 'CC BY-SA - ShareAlike', 'Commercial derivatives allowed, must use same license.', 'A1', 'B1', 'C1', 'D1', 'https://creativecommons.org/licenses/by-sa/4.0/', 8),
('CC0', 'CC0 - Public Domain', 'Copyright waived - free for any use without restrictions.', 'A1', 'B1', 'C1', 'D2', 'https://creativecommons.org/publicdomain/zero/1.0/', 9)
ON CONFLICT (license_code) DO NOTHING;

-- 4. 创建works_with_licenses视图
CREATE OR REPLACE VIEW works_with_licenses AS
SELECT 
  w.*,
  wl.license_code,
  wl.license_name,
  wl.commercial_use,
  wl.derivative_works,
  wl.nft_minting,
  wl.share_alike,
  wl.custom_terms,
  wl.ai_recommended,
  lo.description as license_description,
  lo.license_url
FROM works w
LEFT JOIN work_licenses wl ON w.work_id = wl.work_id
LEFT JOIN license_options lo ON wl.license_code = lo.license_code;

-- 5. 创建license_declarations表（授权声明书）
CREATE TABLE IF NOT EXISTS license_declarations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    work_id BIGINT NOT NULL,
    work_title TEXT NOT NULL,
    work_type TEXT NOT NULL,
    author_name TEXT NOT NULL,
    wallet_address TEXT NOT NULL,
    license_selection JSONB NOT NULL,
    declaration_content TEXT NOT NULL,
    content_hash TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_license_declarations_work_id 
        FOREIGN KEY (work_id) REFERENCES works(work_id) ON DELETE CASCADE
);

-- 6. 创建索引
CREATE INDEX IF NOT EXISTS idx_work_licenses_work_id ON work_licenses(work_id);
CREATE INDEX IF NOT EXISTS idx_work_licenses_license_code ON work_licenses(license_code);
CREATE INDEX IF NOT EXISTS idx_license_options_code ON license_options(license_code);
CREATE INDEX IF NOT EXISTS idx_license_options_active ON license_options(is_active);
CREATE INDEX IF NOT EXISTS idx_license_declarations_work_id ON license_declarations(work_id);
CREATE INDEX IF NOT EXISTS idx_license_declarations_wallet_address ON license_declarations(wallet_address);
CREATE INDEX IF NOT EXISTS idx_license_declarations_created_at ON license_declarations(created_at);

-- 7. 创建RLS策略
ALTER TABLE license_declarations ENABLE ROW LEVEL SECURITY;

-- 删除可能存在的旧策略
DROP POLICY IF EXISTS "Anyone can view license declarations" ON license_declarations;
DROP POLICY IF EXISTS "Authors can create license declarations" ON license_declarations;
DROP POLICY IF EXISTS "Authors can update their license declarations" ON license_declarations;

-- 允许所有人查看授权声明（公开信息）
CREATE POLICY "Anyone can view license declarations" ON license_declarations
    FOR SELECT USING (true);

-- 只允许作品创作者创建和更新授权声明
CREATE POLICY "Authors can create license declarations" ON license_declarations
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM works 
            WHERE works.work_id = license_declarations.work_id 
            AND works.creator_address = wallet_address
        )
    );

CREATE POLICY "Authors can update their license declarations" ON license_declarations
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM works 
            WHERE works.work_id = license_declarations.work_id 
            AND works.creator_address = wallet_address
        )
    );

-- 8. 创建函数
CREATE OR REPLACE FUNCTION save_work_license(
  p_work_id BIGINT,
  p_commercial VARCHAR(2),
  p_derivative VARCHAR(2),
  p_nft VARCHAR(2),
  p_sharealike VARCHAR(2),
  p_custom_terms TEXT DEFAULT NULL,
  p_ai_recommended BOOLEAN DEFAULT false,
  p_ai_data JSONB DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  v_license_code VARCHAR(50);
  v_license_name VARCHAR(100);
  v_work_license_id INTEGER;
BEGIN
  -- Get matching license
  SELECT license_code, license_name INTO v_license_code, v_license_name
  FROM license_options
  WHERE commercial_use = p_commercial
    AND derivative_works = p_derivative
    AND nft_minting = p_nft
    AND share_alike = p_sharealike
    AND is_active = true
  LIMIT 1;
  
  -- If no exact match, use custom
  IF v_license_code IS NULL THEN
    v_license_code := 'CUSTOM';
    v_license_name := 'Custom License';
  END IF;
  
  -- Insert or update work license
  INSERT INTO work_licenses (
    work_id,
    commercial_use,
    derivative_works,
    nft_minting,
    share_alike,
    license_code,
    license_name,
    custom_terms,
    ai_recommended,
    ai_recommendation_data
  ) VALUES (
    p_work_id,
    p_commercial,
    p_derivative,
    p_nft,
    p_sharealike,
    v_license_code,
    v_license_name,
    p_custom_terms,
    p_ai_recommended,
    p_ai_data
  )
  ON CONFLICT (work_id) DO UPDATE SET
    commercial_use = EXCLUDED.commercial_use,
    derivative_works = EXCLUDED.derivative_works,
    nft_minting = EXCLUDED.nft_minting,
    share_alike = EXCLUDED.share_alike,
    license_code = EXCLUDED.license_code,
    license_name = EXCLUDED.license_name,
    custom_terms = EXCLUDED.custom_terms,
    ai_recommended = EXCLUDED.ai_recommended,
    ai_recommendation_data = EXCLUDED.ai_recommendation_data,
    updated_at = NOW()
  RETURNING id INTO v_work_license_id;
  
  RETURN v_work_license_id;
END;
$$ LANGUAGE plpgsql;

-- 9. 创建触发器
CREATE OR REPLACE FUNCTION update_license_declarations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_license_declarations_updated_at
    BEFORE UPDATE ON license_declarations
    FOR EACH ROW
    EXECUTE FUNCTION update_license_declarations_updated_at();

-- 10. 添加注释
COMMENT ON TABLE license_options IS 'Predefined license options (CC BY, CC BY-NC, etc.)';
COMMENT ON TABLE work_licenses IS 'License selections for each work';
COMMENT ON TABLE license_declarations IS '作品授权声明书表';
COMMENT ON VIEW works_with_licenses IS '包含许可证信息的作品视图';

-- ============================================
-- 验证设置
-- ============================================
SELECT 
    'license_options table' as component,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'license_options') 
         THEN '✅ Created' 
         ELSE '❌ Missing' 
    END as status
UNION ALL
SELECT 
    'work_licenses table' as component,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'work_licenses') 
         THEN '✅ Created' 
         ELSE '❌ Missing' 
    END as status
UNION ALL
SELECT 
    'license_declarations table' as component,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'license_declarations') 
         THEN '✅ Created' 
         ELSE '❌ Missing' 
    END as status
UNION ALL
SELECT 
    'works_with_licenses view' as component,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'works_with_licenses') 
         THEN '✅ Created' 
         ELSE '❌ Missing' 
    END as status;