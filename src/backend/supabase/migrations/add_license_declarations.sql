-- 创建授权声明书表
CREATE TABLE IF NOT EXISTS license_declarations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    work_id UUID NOT NULL,
    work_title TEXT NOT NULL,
    work_type TEXT NOT NULL,
    author_name TEXT NOT NULL,
    wallet_address TEXT NOT NULL,
    license_type TEXT NOT NULL,
    declaration_content TEXT NOT NULL,
    content_hash TEXT, -- IPFS CID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 外键约束
    CONSTRAINT fk_license_declarations_work_id 
        FOREIGN KEY (work_id) REFERENCES works(id) ON DELETE CASCADE
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_license_declarations_work_id ON license_declarations(work_id);
CREATE INDEX IF NOT EXISTS idx_license_declarations_wallet_address ON license_declarations(wallet_address);
CREATE INDEX IF NOT EXISTS idx_license_declarations_created_at ON license_declarations(created_at);

-- 添加更新时间触发器
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

-- 添加RLS策略
ALTER TABLE license_declarations ENABLE ROW LEVEL SECURITY;

-- 允许所有人查看授权声明（公开信息）
CREATE POLICY "Anyone can view license declarations" ON license_declarations
    FOR SELECT USING (true);

-- 只允许作品创作者创建和更新授权声明
CREATE POLICY "Authors can create license declarations" ON license_declarations
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM works 
            WHERE works.id = work_id 
            AND works.creator_wallet = wallet_address
        )
    );

CREATE POLICY "Authors can update their license declarations" ON license_declarations
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM works 
            WHERE works.id = work_id 
            AND works.creator_wallet = wallet_address
        )
    );

-- 添加works表的license_type字段（如果不存在）
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'works' AND column_name = 'license_type'
    ) THEN
        ALTER TABLE works ADD COLUMN license_type TEXT DEFAULT 'ALL_RIGHTS_RESERVED';
    END IF;
END $$;

-- 添加works表的has_license_declaration字段
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'works' AND column_name = 'has_license_declaration'
    ) THEN
        ALTER TABLE works ADD COLUMN has_license_declaration BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- 创建函数来自动更新works表的has_license_declaration字段
CREATE OR REPLACE FUNCTION update_work_license_declaration_status()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE works 
        SET has_license_declaration = TRUE 
        WHERE id = NEW.work_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE works 
        SET has_license_declaration = (
            EXISTS (
                SELECT 1 FROM license_declarations 
                WHERE work_id = OLD.work_id
            )
        )
        WHERE id = OLD.work_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
CREATE TRIGGER trigger_update_work_license_declaration_status
    AFTER INSERT OR DELETE ON license_declarations
    FOR EACH ROW
    EXECUTE FUNCTION update_work_license_declaration_status();