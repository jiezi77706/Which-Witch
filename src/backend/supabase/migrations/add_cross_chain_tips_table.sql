-- 创建跨链打赏记录表
CREATE TABLE IF NOT EXISTS cross_chain_tips (
    id SERIAL PRIMARY KEY,
    transaction_hash VARCHAR(66) NOT NULL UNIQUE, -- ZetaChain 交易哈希
    from_address VARCHAR(42) NOT NULL, -- 发送者地址
    to_address VARCHAR(42) NOT NULL, -- 接收者地址
    amount VARCHAR(50) NOT NULL, -- 打赏金额 (以字符串存储避免精度问题)
    target_chain_id INTEGER NOT NULL, -- 目标链 ID
    work_id INTEGER, -- 作品 ID (可选)
    creator_name VARCHAR(255), -- 创作者名称 (可选)
    status VARCHAR(20) DEFAULT 'pending', -- 状态: pending, completed, failed
    target_transaction_hash VARCHAR(66), -- 目标链交易哈希 (完成后填入)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_cross_chain_tips_from_address ON cross_chain_tips(from_address);
CREATE INDEX IF NOT EXISTS idx_cross_chain_tips_to_address ON cross_chain_tips(to_address);
CREATE INDEX IF NOT EXISTS idx_cross_chain_tips_work_id ON cross_chain_tips(work_id);
CREATE INDEX IF NOT EXISTS idx_cross_chain_tips_status ON cross_chain_tips(status);
CREATE INDEX IF NOT EXISTS idx_cross_chain_tips_created_at ON cross_chain_tips(created_at);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_cross_chain_tips_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_cross_chain_tips_updated_at
    BEFORE UPDATE ON cross_chain_tips
    FOR EACH ROW
    EXECUTE FUNCTION update_cross_chain_tips_updated_at();

-- 添加注释
COMMENT ON TABLE cross_chain_tips IS '跨链打赏记录表';
COMMENT ON COLUMN cross_chain_tips.transaction_hash IS 'ZetaChain 上的交易哈希';
COMMENT ON COLUMN cross_chain_tips.from_address IS '发送者钱包地址';
COMMENT ON COLUMN cross_chain_tips.to_address IS '接收者钱包地址';
COMMENT ON COLUMN cross_chain_tips.amount IS '打赏金额 (ZETA)';
COMMENT ON COLUMN cross_chain_tips.target_chain_id IS '目标链 ID (如 11155111 为 Sepolia)';
COMMENT ON COLUMN cross_chain_tips.work_id IS '关联的作品 ID';
COMMENT ON COLUMN cross_chain_tips.creator_name IS '创作者显示名称';
COMMENT ON COLUMN cross_chain_tips.status IS '交易状态: pending(处理中), completed(已完成), failed(失败)';
COMMENT ON COLUMN cross_chain_tips.target_transaction_hash IS '目标链上的交易哈希 (跨链完成后)';

-- 插入一些示例数据 (可选)
-- INSERT INTO cross_chain_tips (
--     transaction_hash,
--     from_address,
--     to_address,
--     amount,
--     target_chain_id,
--     work_id,
--     creator_name,
--     status
-- ) VALUES (
--     '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
--     '0x742d35cc6634c0532925a3b8d4c9db96c4b4d8b6',
--     '0x169f03c4dd0c3c400e648194acf024f13c9c7f514',
--     '0.001',
--     11155111,
--     123,
--     'Demo Creator',
--     'completed'
-- );