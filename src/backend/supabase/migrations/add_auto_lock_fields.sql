-- 添加自动锁定相关字段到版权争议表
-- 支持AI自动检测和锁定功能

-- 添加新的相似度字段
ALTER TABLE copyright_disputes 
ADD COLUMN IF NOT EXISTS content_similarity DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS text_similarity DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS textual_similarities JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS plagiarism_risk VARCHAR(20) DEFAULT 'low';

-- 添加自动锁定相关字段
ALTER TABLE copyright_disputes 
ADD COLUMN IF NOT EXISTS auto_lock_tx_hash VARCHAR(66),
ADD COLUMN IF NOT EXISTS auto_lock_reason TEXT,
ADD COLUMN IF NOT EXISTS funds_locked_amount BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS lock_timestamp TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS withdrawal_disabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS withdrawal_disable_tx_hash VARCHAR(66),
ADD COLUMN IF NOT EXISTS withdrawal_disable_reason TEXT,
ADD COLUMN IF NOT EXISTS withdrawal_disable_timestamp TIMESTAMP WITH TIME ZONE;

-- 更新状态枚举，添加新的状态
-- 注意：PostgreSQL 不能直接修改枚举，需要先添加新值
DO $$ 
BEGIN
    -- 检查是否已存在新的状态值
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'auto_locked' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'dispute_status')
    ) THEN
        ALTER TYPE dispute_status ADD VALUE 'auto_locked';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'high_risk' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'dispute_status')
    ) THEN
        ALTER TYPE dispute_status ADD VALUE 'high_risk';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'withdrawal_disabled' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'dispute_status')
    ) THEN
        ALTER TYPE dispute_status ADD VALUE 'withdrawal_disabled';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'critical_risk' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'dispute_status')
    ) THEN
        ALTER TYPE dispute_status ADD VALUE 'critical_risk';
    END IF;
END $$;

-- 添加索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_copyright_disputes_plagiarism_risk 
ON copyright_disputes(plagiarism_risk);

CREATE INDEX IF NOT EXISTS idx_copyright_disputes_auto_lock 
ON copyright_disputes(auto_lock_tx_hash) 
WHERE auto_lock_tx_hash IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_copyright_disputes_similarity_score 
ON copyright_disputes(similarity_score DESC);

-- 添加注释
COMMENT ON COLUMN copyright_disputes.content_similarity IS '内容相似度 (0-100)';
COMMENT ON COLUMN copyright_disputes.text_similarity IS '文本相似度 (0-100)';
COMMENT ON COLUMN copyright_disputes.textual_similarities IS '文本相似性详情 (JSON数组)';
COMMENT ON COLUMN copyright_disputes.plagiarism_risk IS '抄袭风险等级: low, medium, high, critical';
COMMENT ON COLUMN copyright_disputes.auto_lock_tx_hash IS '自动锁定交易哈希';
COMMENT ON COLUMN copyright_disputes.auto_lock_reason IS '自动锁定原因';
COMMENT ON COLUMN copyright_disputes.funds_locked_amount IS '锁定资金数量 (wei)';
COMMENT ON COLUMN copyright_disputes.lock_timestamp IS '资金锁定时间';
COMMENT ON COLUMN copyright_disputes.withdrawal_disabled IS '是否禁用提款功能';
COMMENT ON COLUMN copyright_disputes.withdrawal_disable_tx_hash IS '提款禁用交易哈希';
COMMENT ON COLUMN copyright_disputes.withdrawal_disable_reason IS '提款禁用原因';
COMMENT ON COLUMN copyright_disputes.withdrawal_disable_timestamp IS '提款禁用时间';

-- 创建视图：高风险争议
CREATE OR REPLACE VIEW high_risk_disputes AS
SELECT 
    cd.*,
    ow.title as original_work_title,
    ow.image_url as original_work_image,
    ow.creator_address as original_creator,
    aw.title as accused_work_title,
    aw.image_url as accused_work_image,
    aw.creator_address as accused_creator,
    CASE 
        WHEN cd.withdrawal_disabled = true THEN 'CRITICAL - Withdrawal Disabled'
        WHEN cd.similarity_score >= 90 THEN 'CRITICAL - 90%+ Similarity'
        WHEN cd.similarity_score >= 80 THEN 'HIGH - 80%+ Similarity'
        ELSE 'MEDIUM'
    END as risk_level
FROM copyright_disputes cd
JOIN works ow ON cd.original_work_id = ow.work_id
JOIN works aw ON cd.accused_work_id = aw.work_id
WHERE cd.similarity_score >= 80 
   OR cd.plagiarism_risk IN ('high', 'critical')
   OR cd.status IN ('auto_locked', 'high_risk', 'withdrawal_disabled', 'critical_risk')
ORDER BY cd.similarity_score DESC, cd.created_at DESC;

-- 创建函数：自动锁定统计
CREATE OR REPLACE FUNCTION get_auto_lock_stats()
RETURNS TABLE(
    total_locked_users BIGINT,
    total_locked_amount BIGINT,
    avg_similarity_score DECIMAL,
    locked_today BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT accused_address)::BIGINT as total_locked_users,
        COALESCE(SUM(funds_locked_amount), 0)::BIGINT as total_locked_amount,
        COALESCE(AVG(similarity_score), 0)::DECIMAL as avg_similarity_score,
        COUNT(CASE WHEN DATE(lock_timestamp) = CURRENT_DATE THEN 1 END)::BIGINT as locked_today
    FROM copyright_disputes 
    WHERE status = 'auto_locked' 
      AND auto_lock_tx_hash IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器：自动更新锁定时间戳
CREATE OR REPLACE FUNCTION update_lock_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    -- 当状态变为 auto_locked 时，自动设置锁定时间戳
    IF NEW.status = 'auto_locked' AND OLD.status != 'auto_locked' THEN
        NEW.lock_timestamp = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
DROP TRIGGER IF EXISTS trigger_update_lock_timestamp ON copyright_disputes;
CREATE TRIGGER trigger_update_lock_timestamp
    BEFORE UPDATE ON copyright_disputes
    FOR EACH ROW
    EXECUTE FUNCTION update_lock_timestamp();

-- 插入测试数据（可选）
-- INSERT INTO copyright_disputes (
--     reporter_address,
--     accused_address, 
--     original_work_id,
--     accused_work_id,
--     dispute_reason,
--     status,
--     similarity_score,
--     plagiarism_risk,
--     auto_lock_reason
-- ) VALUES (
--     '0x1234567890123456789012345678901234567890',
--     '0x0987654321098765432109876543210987654321',
--     1,
--     2,
--     'High similarity detected by AI',
--     'auto_locked',
--     85.5,
--     'critical',
--     'Automatic lock due to 85.5% similarity'
-- );

-- 验证迁移
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'copyright_disputes' 
  AND column_name IN (
    'content_similarity', 
    'text_similarity', 
    'textual_similarities',
    'plagiarism_risk',
    'auto_lock_tx_hash',
    'auto_lock_reason',
    'funds_locked_amount',
    'lock_timestamp'
  )
ORDER BY column_name;

-- 创建增强的自动锁定统计函数
CREATE OR REPLACE FUNCTION get_enhanced_auto_lock_stats()
RETURNS TABLE(
    total_locked_users BIGINT,
    total_locked_amount BIGINT,
    avg_similarity_score DECIMAL,
    locked_today BIGINT,
    withdrawal_disabled_users BIGINT,
    critical_cases BIGINT
) AS $
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT accused_address)::BIGINT as total_locked_users,
        COALESCE(SUM(funds_locked_amount), 0)::BIGINT as total_locked_amount,
        COALESCE(AVG(similarity_score), 0)::DECIMAL as avg_similarity_score,
        COUNT(CASE WHEN DATE(lock_timestamp) = CURRENT_DATE THEN 1 END)::BIGINT as locked_today,
        COUNT(CASE WHEN withdrawal_disabled = true THEN 1 END)::BIGINT as withdrawal_disabled_users,
        COUNT(CASE WHEN similarity_score >= 90 THEN 1 END)::BIGINT as critical_cases
    FROM copyright_disputes 
    WHERE status IN ('auto_locked', 'withdrawal_disabled', 'critical_risk')
      AND auto_lock_tx_hash IS NOT NULL;
END;
$ LANGUAGE plpgsql;

-- 创建提款禁用触发器
CREATE OR REPLACE FUNCTION update_withdrawal_disable_timestamp()
RETURNS TRIGGER AS $
BEGIN
    -- 当提款被禁用时，自动设置禁用时间戳
    IF NEW.withdrawal_disabled = true AND (OLD.withdrawal_disabled IS NULL OR OLD.withdrawal_disabled = false) THEN
        NEW.withdrawal_disable_timestamp = NOW();
    END IF;
    
    RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- 创建提款禁用触发器
DROP TRIGGER IF EXISTS trigger_update_withdrawal_disable_timestamp ON copyright_disputes;
CREATE TRIGGER trigger_update_withdrawal_disable_timestamp
    BEFORE UPDATE ON copyright_disputes
    FOR EACH ROW
    EXECUTE FUNCTION update_withdrawal_disable_timestamp();

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_copyright_disputes_withdrawal_disabled 
ON copyright_disputes(withdrawal_disabled) 
WHERE withdrawal_disabled = true;

CREATE INDEX IF NOT EXISTS idx_copyright_disputes_critical_similarity 
ON copyright_disputes(similarity_score DESC) 
WHERE similarity_score >= 90;

-- 验证新字段
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'copyright_disputes' 
  AND column_name IN (
    'withdrawal_disabled', 
    'withdrawal_disable_tx_hash', 
    'withdrawal_disable_reason',
    'withdrawal_disable_timestamp'
  )
ORDER BY column_name;