-- ============================================
-- License Options System
-- Creative Commons & Custom Licensing
-- ============================================

-- 1. License Options Table
CREATE TABLE IF NOT EXISTS license_options (
  id SERIAL PRIMARY KEY,
  
  -- License Code (e.g., "CC BY", "CC BY-NC-SA", etc.)
  license_code VARCHAR(50) NOT NULL UNIQUE,
  
  -- License Display Name
  license_name VARCHAR(100) NOT NULL,
  
  -- License Description
  description TEXT,
  
  -- Option Mapping (A1/A2/A3, B1/B2, C1/C2, D1/D2)
  commercial_use VARCHAR(2) NOT NULL, -- A1, A2, A3
  derivative_works VARCHAR(2) NOT NULL, -- B1, B2
  nft_minting VARCHAR(2) NOT NULL, -- C1, C2
  share_alike VARCHAR(2) NOT NULL, -- D1, D2
  
  -- Full License URL
  license_url TEXT,
  
  -- Icon or Badge URL
  badge_url TEXT,
  
  -- Is Active
  is_active BOOLEAN DEFAULT true,
  
  -- Sort Order
  sort_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Work Licenses Table (extends works table)
CREATE TABLE IF NOT EXISTS work_licenses (
  id SERIAL PRIMARY KEY,
  work_id BIGINT NOT NULL UNIQUE,
  
  -- Selected Options
  commercial_use VARCHAR(2) NOT NULL, -- A1, A2, A3
  derivative_works VARCHAR(2) NOT NULL, -- B1, B2
  nft_minting VARCHAR(2) NOT NULL, -- C1, C2
  share_alike VARCHAR(2) NOT NULL, -- D1, D2
  
  -- Generated License
  license_code VARCHAR(50) NOT NULL,
  license_name VARCHAR(100) NOT NULL,
  
  -- Custom Terms (if any)
  custom_terms TEXT,
  
  -- AI Recommendation (if used)
  ai_recommended BOOLEAN DEFAULT false,
  ai_recommendation_data JSONB,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  FOREIGN KEY (work_id) REFERENCES works(work_id) ON DELETE CASCADE,
  FOREIGN KEY (license_code) REFERENCES license_options(license_code)
);

-- 3. Insert Default License Options
INSERT INTO license_options (license_code, license_name, description, commercial_use, derivative_works, nft_minting, share_alike, license_url, sort_order) VALUES
-- ① CC BY
('CC BY', 'CC BY - Attribution', 'Commercial use, derivatives, and NFT minting allowed. Only attribution required.', 'A1', 'B1', 'C1', 'D2', 'https://creativecommons.org/licenses/by/4.0/', 1),

-- ② CC BY-NC
('CC BY-NC', 'CC BY-NC - Non-Commercial', 'Non-commercial derivatives allowed, but no secondary NFT minting.', 'A2', 'B1', 'C2', 'D2', 'https://creativecommons.org/licenses/by-nc/4.0/', 2),

-- ③ CC BY-NC-SA
('CC BY-NC-SA', 'CC BY-NC-SA - Non-Commercial ShareAlike', 'Non-commercial derivatives with same license required.', 'A2', 'B1', 'C2', 'D1', 'https://creativecommons.org/licenses/by-nc-sa/4.0/', 3),

-- ④ CC BY + No Secondary NFT
('CC BY-NoNFT', 'CC BY + No Secondary NFT', 'Commercial and derivatives allowed, but blockchain minting prohibited.', 'A1', 'B1', 'C2', 'D2', NULL, 4),

-- ⑤ CC BY-NC + Commercial Reserved
('CC BY-NC-CR', 'CC BY-NC + Commercial Reserved', 'Free derivatives, but commercial use requires author permission.', 'A3', 'B1', 'C2', 'D2', NULL, 5),

-- ⑥ All Rights Reserved
('ARR', 'All Rights Reserved', 'Display only - no derivatives or commercial use allowed.', 'A2', 'B2', 'C2', 'D2', NULL, 6),

-- ⑦ Custom Commercial Display
('CCD', 'Custom Commercial Display License', 'Commercial use allowed but no derivatives.', 'A1', 'B2', 'C2', 'D2', NULL, 7),

-- ⑧ CC BY-SA
('CC BY-SA', 'CC BY-SA - ShareAlike', 'Commercial derivatives allowed, must use same license.', 'A1', 'B1', 'C1', 'D1', 'https://creativecommons.org/licenses/by-sa/4.0/', 8),

-- ⑨ CC0
('CC0', 'CC0 - Public Domain', 'Copyright waived - free for any use without restrictions.', 'A1', 'B1', 'C1', 'D2', 'https://creativecommons.org/publicdomain/zero/1.0/', 9);

-- 4. License Option Descriptions Table
CREATE TABLE IF NOT EXISTS license_option_descriptions (
  id SERIAL PRIMARY KEY,
  option_code VARCHAR(2) NOT NULL UNIQUE,
  option_category VARCHAR(20) NOT NULL, -- commercial, derivative, nft, sharealike
  option_label VARCHAR(100) NOT NULL,
  option_description TEXT,
  sort_order INTEGER DEFAULT 0
);

-- Insert Option Descriptions
INSERT INTO license_option_descriptions (option_code, option_category, option_label, option_description, sort_order) VALUES
-- Commercial Use Options
('A1', 'commercial', 'Commercial Use Allowed', 'Others can use your work for commercial purposes', 1),
('A2', 'commercial', 'Non-Commercial Only', 'Work can only be used for non-commercial purposes', 2),
('A3', 'commercial', 'Commercial Authorization Required', 'Commercial use requires separate permission from creator', 3),

-- Derivative Works Options
('B1', 'derivative', 'Derivatives Allowed', 'Others can create derivative works based on your creation', 1),
('B2', 'derivative', 'No Derivatives', 'No modifications or derivative works allowed', 2),

-- NFT Minting Options
('C1', 'nft', 'NFT Minting Allowed', 'Derivative works can be minted as NFTs', 1),
('C2', 'nft', 'No Secondary NFT', 'Prohibit any form of secondary NFT minting', 2),

-- ShareAlike Options
('D1', 'sharealike', 'ShareAlike Required', 'Derivative works must use the same license (SA)', 1),
('D2', 'sharealike', 'No ShareAlike', 'Derivative works can use different licenses', 2);

-- ============================================
-- Indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_work_licenses_work_id ON work_licenses(work_id);
CREATE INDEX IF NOT EXISTS idx_work_licenses_license_code ON work_licenses(license_code);
CREATE INDEX IF NOT EXISTS idx_license_options_code ON license_options(license_code);
CREATE INDEX IF NOT EXISTS idx_license_options_active ON license_options(is_active);

-- ============================================
-- Functions
-- ============================================

-- Function: Get License by Options
CREATE OR REPLACE FUNCTION get_license_by_options(
  p_commercial VARCHAR(2),
  p_derivative VARCHAR(2),
  p_nft VARCHAR(2),
  p_sharealike VARCHAR(2)
)
RETURNS TABLE (
  license_code VARCHAR(50),
  license_name VARCHAR(100),
  description TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    lo.license_code,
    lo.license_name,
    lo.description
  FROM license_options lo
  WHERE lo.commercial_use = p_commercial
    AND lo.derivative_works = p_derivative
    AND lo.nft_minting = p_nft
    AND lo.share_alike = p_sharealike
    AND lo.is_active = true
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function: Save Work License
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
  FROM get_license_by_options(p_commercial, p_derivative, p_nft, p_sharealike);
  
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

-- ============================================
-- Views
-- ============================================

-- View: Works with License Info
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

-- ============================================
-- Triggers
-- ============================================

-- Trigger: Update work_licenses timestamp
CREATE OR REPLACE FUNCTION update_work_license_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_work_license_timestamp
BEFORE UPDATE ON work_licenses
FOR EACH ROW
EXECUTE FUNCTION update_work_license_timestamp();

-- ============================================
-- Comments
-- ============================================

COMMENT ON TABLE license_options IS 'Predefined license options (CC BY, CC BY-NC, etc.)';
COMMENT ON TABLE work_licenses IS 'License selections for each work';
COMMENT ON TABLE license_option_descriptions IS 'Descriptions for each option code (A1, A2, B1, etc.)';

COMMENT ON COLUMN work_licenses.commercial_use IS 'A1=允许商用, A2=不允许商用, A3=需授权';
COMMENT ON COLUMN work_licenses.derivative_works IS 'B1=允许二创, B2=禁止二创';
COMMENT ON COLUMN work_licenses.nft_minting IS 'C1=允许NFT, C2=禁止NFT';
COMMENT ON COLUMN work_licenses.share_alike IS 'D1=需同协议, D2=不强制';
