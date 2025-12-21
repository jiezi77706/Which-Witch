-- 添加license_selection字段到works表
-- 这个字段存储用户选择的ABCD许可证配置

DO $ 
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
END $;

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_works_license_type ON works(license_type);
CREATE INDEX IF NOT EXISTS idx_works_license_selection ON works USING GIN (license_selection);

-- 更新现有记录的默认值（如果需要）
UPDATE works 
SET license_type = 'ALL_RIGHTS_RESERVED' 
WHERE license_type IS NULL;

-- 添加约束确保license_selection的基本结构
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