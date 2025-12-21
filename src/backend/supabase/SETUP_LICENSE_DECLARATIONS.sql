-- ============================================
-- 授权声明书功能完整设置脚本
-- 请在Supabase SQL编辑器中按顺序执行
-- ============================================

-- 1. 首先确保基础表结构存在
-- 如果works表不存在，先创建基础结构
CREATE TABLE IF NOT EXISTS works (
  id SERIAL PRIMARY KEY,
  work_id BIGINT UNIQUE NOT NULL,  -- 链上作品ID
  creator_address VARCHAR(42) NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  story TEXT,
  image_url TEXT NOT NULL,  -- IPFS URL
  metadata_uri TEXT NOT NULL,  -- 完整元数据 IPFS URI
  material TEXT[],
  tags TEXT[],
  allow_remix BOOLEAN DEFAULT true,
  license_fee VARCHAR(50),  -- 以 ETH 为单位的字符串
  parent_work_id BIGINT,  -- 父作品ID（如果是衍生作品）
  is_remix BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (parent_work_id) REFERENCES works(work_id) ON DELETE SET NULL
);

-- 创建基础索引
CREATE INDEX IF NOT EXISTS idx_works_work_id ON works(work_id);
CREATE INDEX IF NOT EXISTS idx_works_creator ON works(creator_address);
CREATE INDEX IF NOT EXISTS idx_works_parent ON works(parent_work_id);
CREATE INDEX IF NOT EXISTS idx_works_created_at ON works(created_at DESC);

-- 2. 添加license_selection字段到works表
DO $$ 
BEGIN
    -- 添加license_selection字段（JSONB类型存储完整的许可证选择对象）
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'works' AND column_name = 'license_selection'
    ) THEN
        ALTER TABLE works ADD COLUMN license_selection JSONB;
        
        -- 添加注释
        COMMENT ON COLUMN works.license_selection IS '许可证选择配置，包含commercial, derivative, nft, shareAlike等字段';
    END IF;
    
    -- 添加license_type字段（如果不存在）- 用于向后兼容
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'works' AND column_name = 'license_type'
    ) THEN
        ALTER TABLE works ADD COLUMN license_type TEXT DEFAULT 'ALL_RIGHTS_RESERVED';
        
        -- 添加注释
        COMMENT ON COLUMN works.license_type IS '许可证类型代码，如CC BY, CC BY-NC等';
    END IF;
    
    -- 添加has_license_declaration字段
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'works' AND column_name = 'has_license_declaration'
    ) THEN
        ALTER TABLE works ADD COLUMN has_license_declaration BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_works_license_type ON works(license_type);
CREATE INDEX IF NOT EXISTS idx_works_license_selection ON works USING GIN (license_selection);

-- 更新现有记录的默认值（如果需要）
UPDATE works 
SET license_type = 'ALL_RIGHTS_RESERVED' 
WHERE license_type IS NULL;

-- 添加约束确保license_selection的基本结构
DO $$
BEGIN
    -- 先删除可能存在的约束
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_license_selection_structure' 
        AND table_name = 'works'
    ) THEN
        ALTER TABLE works DROP CONSTRAINT check_license_selection_structure;
    END IF;
    
    -- 添加新约束
    ALTER TABLE works ADD CONSTRAINT check_license_selection_structure 
    CHECK (
        license_selection IS NULL OR (
            license_selection ? 'commercial' AND
            license_selection ? 'derivative' AND
            license_selection ? 'nft' AND
            license_selection ? 'shareAlike' AND
            license_selection ? 'licenseCode' AND
            license_selection ? 'licenseName'
        )
    );
END $$;

-- 3. 创建授权声明书表
CREATE TABLE IF NOT EXISTS license_declarations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    work_id BIGINT NOT NULL, -- 使用链上作品ID，不是数据库ID
    work_title TEXT NOT NULL,
    work_type TEXT NOT NULL,
    author_name TEXT NOT NULL,
    wallet_address TEXT NOT NULL,
    license_selection JSONB NOT NULL, -- 存储完整的许可证选择对象
    declaration_content TEXT NOT NULL,
    content_hash TEXT, -- IPFS CID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 外键约束 - 引用works表的work_id字段（链上ID）
    CONSTRAINT fk_license_declarations_work_id 
        FOREIGN KEY (work_id) REFERENCES works(work_id) ON DELETE CASCADE
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_license_declarations_work_id ON license_declarations(work_id);
CREATE INDEX IF NOT EXISTS idx_license_declarations_wallet_address ON license_declarations(wallet_address);
CREATE INDEX IF NOT EXISTS idx_license_declarations_created_at ON license_declarations(created_at);

-- 4. 添加更新时间触发器
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

-- 5. 添加RLS策略
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

-- 6. 创建函数来自动更新works表的has_license_declaration字段
CREATE OR REPLACE FUNCTION update_work_license_declaration_status()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE works 
        SET has_license_declaration = TRUE 
        WHERE work_id = NEW.work_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE works 
        SET has_license_declaration = (
            EXISTS (
                SELECT 1 FROM license_declarations 
                WHERE work_id = OLD.work_id
            )
        )
        WHERE work_id = OLD.work_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 删除可能存在的旧触发器
DROP TRIGGER IF EXISTS trigger_update_work_license_declaration_status ON license_declarations;

-- 创建触发器
CREATE TRIGGER trigger_update_work_license_declaration_status
    AFTER INSERT OR DELETE ON license_declarations
    FOR EACH ROW
    EXECUTE FUNCTION update_work_license_declaration_status();

-- 7. 添加注释
COMMENT ON TABLE license_declarations IS '作品授权声明书表';
COMMENT ON COLUMN license_declarations.work_id IS '链上作品ID';
COMMENT ON COLUMN license_declarations.license_selection IS '完整的许可证选择对象（ABCD配置）';
COMMENT ON COLUMN license_declarations.declaration_content IS '生成的声明书内容（Markdown格式）';
COMMENT ON COLUMN license_declarations.content_hash IS 'IPFS内容哈希';

-- 8. 插入测试数据（可选）
-- 如果需要测试，可以取消注释以下代码
/*
INSERT INTO works (work_id, creator_address, title, description, image_url, metadata_uri, license_selection) 
VALUES (
    999999,
    '0x1234567890123456789012345678901234567890',
    '测试作品',
    '这是一个测试作品',
    'https://example.com/image.jpg',
    'https://example.com/metadata.json',
    '{"commercial": "A2", "derivative": "B1", "nft": "C2", "shareAlike": "D1", "licenseCode": "CC BY-NC-SA", "licenseName": "CC BY-NC-SA - ShareAlike", "description": "Non-commercial derivatives allowed, must use same license"}'::jsonb
) ON CONFLICT (work_id) DO NOTHING;
*/

-- ============================================
-- 设置完成！
-- 现在可以使用授权声明书功能了
-- ============================================

-- 验证设置
SELECT 
    'license_declarations table' as component,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'license_declarations') 
         THEN '✅ Created' 
         ELSE '❌ Missing' 
    END as status
UNION ALL
SELECT 
    'works.license_selection column' as component,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'works' AND column_name = 'license_selection') 
         THEN '✅ Added' 
         ELSE '❌ Missing' 
    END as status
UNION ALL
SELECT 
    'RLS policies' as component,
    CASE WHEN EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'license_declarations') 
         THEN '✅ Enabled' 
         ELSE '❌ Missing' 
    END as status;