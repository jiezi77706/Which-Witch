-- ============================================
-- 投票系统数据库设置 - 完整版本
-- 在Supabase SQL编辑器中执行
-- ============================================

-- 1. 创建枚举类型（如果不存在）
DO $$ BEGIN
    CREATE TYPE voting_status AS ENUM ('upcoming', 'active', 'ended', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE voting_type AS ENUM ('character_design', 'story_setting', 'plot_direction', 'art_style', 'color_scheme', 'music_style', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. 创建投票表（如果不存在）
CREATE TABLE IF NOT EXISTS work_votings (
  id SERIAL PRIMARY KEY,
  work_id BIGINT NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  voting_type voting_type NOT NULL DEFAULT 'other',
  status voting_status DEFAULT 'active',
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  creator_address VARCHAR(42) NOT NULL,
  total_votes INTEGER DEFAULT 0,
  total_participants INTEGER DEFAULT 0,
  reward VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 创建投票选项表（如果不存在）
CREATE TABLE IF NOT EXISTS voting_options (
  id SERIAL PRIMARY KEY,
  voting_id INTEGER NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  vote_count INTEGER DEFAULT 0,
  percentage DECIMAL(5,2) DEFAULT 0.00,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (voting_id) REFERENCES work_votings(id) ON DELETE CASCADE
);

-- 4. 创建用户投票记录表（如果不存在）
CREATE TABLE IF NOT EXISTS user_votes (
  id SERIAL PRIMARY KEY,
  voting_id INTEGER NOT NULL,
  option_id INTEGER NOT NULL,
  voter_address VARCHAR(42) NOT NULL,
  voted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (voting_id) REFERENCES work_votings(id) ON DELETE CASCADE,
  FOREIGN KEY (option_id) REFERENCES voting_options(id) ON DELETE CASCADE,
  UNIQUE(voting_id, voter_address)
);

-- 5. 创建索引（如果不存在）
CREATE INDEX IF NOT EXISTS idx_work_votings_work_id ON work_votings(work_id);
CREATE INDEX IF NOT EXISTS idx_work_votings_status ON work_votings(status);
CREATE INDEX IF NOT EXISTS idx_work_votings_creator ON work_votings(creator_address);
CREATE INDEX IF NOT EXISTS idx_voting_options_voting_id ON voting_options(voting_id);
CREATE INDEX IF NOT EXISTS idx_user_votes_voting_id ON user_votes(voting_id);
CREATE INDEX IF NOT EXISTS idx_user_votes_voter ON user_votes(voter_address);

-- 6. 创建更新时间戳函数（如果不存在）
CREATE OR REPLACE FUNCTION update_voting_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. 创建触发器（如果不存在）
DROP TRIGGER IF EXISTS trigger_update_voting_timestamp ON work_votings;
CREATE TRIGGER trigger_update_voting_timestamp
BEFORE UPDATE ON work_votings
FOR EACH ROW
EXECUTE FUNCTION update_voting_timestamp();

-- 8. 添加注释
COMMENT ON TABLE work_votings IS '作品投票表';
COMMENT ON TABLE voting_options IS '投票选项表';
COMMENT ON TABLE user_votes IS '用户投票记录表';

-- 9. 插入测试数据（可选，仅在开发环境）
-- INSERT INTO work_votings (work_id, title, description, voting_type, creator_address, end_date, reward) 
-- VALUES (1, 'Test Character Design Vote', 'Choose the design style for our main character', 'character_design', '0x1234567890123456789012345678901234567890', NOW() + INTERVAL '7 days', '0.001 ETH')
-- ON CONFLICT DO NOTHING;

-- 完成！投票系统数据库结构已创建
SELECT 'Voting system tables created successfully!' as status;