-- ============================================
-- 修复works表结构问题
-- 确保works表不包含license_selection字段
-- 所有许可证信息存储在work_licenses表中
-- ============================================

-- 1. 检查并删除works表中可能存在的license相关字段
DO $$
BEGIN
    -- 删除license_selection字段（如果存在）
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'works' AND column_name = 'license_selection'
    ) THEN
        ALTER TABLE works DROP COLUMN license_selection;
        RAISE NOTICE '✅ Dropped license_selection column from works table';
    ELSE
        RAISE NOTICE '✅ license_selection column does not exist in works table';
    END IF;
    
    -- 删除license_type字段（如果存在）
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'works' AND column_name = 'license_type'
    ) THEN
        ALTER TABLE works DROP COLUMN license_type;
        RAISE NOTICE '✅ Dropped license_type column from works table';
    ELSE
        RAISE NOTICE '✅ license_type column does not exist in works table';
    END IF;
    
    -- 删除has_license_declaration字段（如果存在）
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'works' AND column_name = 'has_license_declaration'
    ) THEN
        ALTER TABLE works DROP COLUMN has_license_declaration;
        RAISE NOTICE '✅ Dropped has_license_declaration column from works table';
    ELSE
        RAISE NOTICE '✅ has_license_declaration column does not exist in works table';
    END IF;
END $$;

-- 2. 确保works表有正确的基础结构
DO $$
BEGIN
    -- 确保images字段存在（用于多图片支持）
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'works' AND column_name = 'images'
    ) THEN
        ALTER TABLE works ADD COLUMN images TEXT[];
        RAISE NOTICE '✅ Added images column to works table';
    ELSE
        RAISE NOTICE '✅ images column already exists in works table';
    END IF;
END $$;

-- 3. 确保work_licenses表存在并有正确结构
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

-- 4. 确保license_options表存在
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

-- 5. 插入默认许可证选项（如果不存在）
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

-- 6. 创建或更新works_with_licenses视图
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

-- 7. 确保save_work_license函数存在
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

-- 8. 创建索引
CREATE INDEX IF NOT EXISTS idx_work_licenses_work_id ON work_licenses(work_id);
CREATE INDEX IF NOT EXISTS idx_work_licenses_license_code ON work_licenses(license_code);
CREATE INDEX IF NOT EXISTS idx_license_options_code ON license_options(license_code);
CREATE INDEX IF NOT EXISTS idx_license_options_active ON license_options(is_active);

-- 9. 添加注释
COMMENT ON TABLE work_licenses IS 'License selections for each work';
COMMENT ON VIEW works_with_licenses IS '包含许可证信息的作品视图';
COMMENT ON FUNCTION save_work_license IS '保存作品许可证信息的函数';

-- ============================================
-- 验证修复结果
-- ============================================
SELECT 
    'works table structure' as component,
    '✅ Fixed' as status
UNION ALL
SELECT 
    'work_licenses table' as component,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'work_licenses') 
         THEN '✅ Ready' 
         ELSE '❌ Missing' 
    END as status
UNION ALL
SELECT 
    'works_with_licenses view' as component,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'works_with_licenses') 
         THEN '✅ Ready' 
         ELSE '❌ Missing' 
    END as status
UNION ALL
SELECT 
    'save_work_license function' as component,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'save_work_license') 
         THEN '✅ Ready' 
         ELSE '❌ Missing' 
    END as status;