-- ============================================
-- 作品投票系统数据库结构
-- Community Voting System for Works
-- ============================================

-- 1. 投票状态枚举
CREATE TYPE voting_status AS ENUM (
  'upcoming',   -- 即将开始
  'active',     -- 进行中
  'ended',      -- 已结束
  'cancelled'   -- 已取消
);

-- 2. 投票类型枚举
CREATE TYPE voting_type AS ENUM (
  'character_design',  -- 角色设计
  'story_setting',     -- 故事设定
  'plot_direction',    -- 情节走向
  'art_style',         -- 艺术风格
  'color_scheme',      -- 配色方案
  'music_style',       -- 音乐风格
  'other'              -- 其他
);

-- 3. 作品投票表
CREATE TABLE IF NOT EXISTS work_votings (
  id SERIAL PRIMARY KEY,
  
  -- 关联作品
  work_id BIGINT NOT NULL,
  
  -- 投票基本信息
  title VARCHAR(200) NOT NULL,
  description TEXT,
  voting_type voting_type NOT NULL,
  
  -- 投票状态和时间
  status voting_status DEFAULT 'upcoming',
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- 创建者信息
  creator_address VARCHAR(42) NOT NULL,
  
  -- 投票设置
  max_choices INTEGER DEFAULT 1, -- 最多可选择的选项数
  allow_multiple_votes BOOLEAN DEFAULT false, -- 是否允许多次投票
  require_wallet BOOLEAN DEFAULT true, -- 是否需要连接钱包
  
  -- 统计信息
  total_votes INTEGER DEFAULT 0,
  total_participants INTEGER DEFAULT 0,
  
  -- 时间戳
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 外键约束
  FOREIGN KEY (work_id) REFERENCES works(work_id) ON DELETE CASCADE
);

-- 4. 投票选项表
CREATE TABLE IF NOT EXISTS voting_options (
  id SERIAL PRIMARY KEY,
  
  -- 关联投票
  voting_id INTEGER NOT NULL,
  
  -- 选项信息
  title VARCHAR(200) NOT NULL,
  description TEXT,
  image_url TEXT, -- 选项图片（可选）
  
  -- 统计信息
  vote_count INTEGER DEFAULT 0,
  percentage DECIMAL(5,2) DEFAULT 0.00,
  
  -- 排序
  sort_order INTEGER DEFAULT 0,
  
  -- 时间戳
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 外键约束
  FOREIGN KEY (voting_id) REFERENCES work_votings(id) ON DELETE CASCADE
);

-- 5. 用户投票记录表
CREATE TABLE IF NOT EXISTS user_votes (
  id SERIAL PRIMARY KEY,
  
  -- 投票信息
  voting_id INTEGER NOT NULL,
  option_id INTEGER NOT NULL,
  
  -- 用户信息
  voter_address VARCHAR(42) NOT NULL,
  
  -- 投票权重（可用于加权投票）
  vote_weight DECIMAL(10,4) DEFAULT 1.0000,
  
  -- 投票时间
  voted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 外键约束
  FOREIGN KEY (voting_id) REFERENCES work_votings(id) ON DELETE CASCADE,
  FOREIGN KEY (option_id) REFERENCES voting_options(id) ON DELETE CASCADE,
  
  -- 唯一约束（防止重复投票，除非允许多次投票）
  UNIQUE(voting_id, voter_address, option_id)
);

-- 6. 投票统计视图
CREATE OR REPLACE VIEW voting_statistics AS
SELECT 
  wv.id as voting_id,
  wv.work_id,
  wv.title,
  wv.status,
  wv.total_votes,
  wv.total_participants,
  wv.start_date,
  wv.end_date,
  COUNT(DISTINCT uv.voter_address) as actual_participants,
  COUNT(uv.id) as actual_votes,
  CASE 
    WHEN wv.end_date < NOW() THEN 'ended'
    WHEN wv.start_date > NOW() THEN 'upcoming'
    ELSE wv.status
  END as current_status
FROM work_votings wv
LEFT JOIN user_votes uv ON wv.id = uv.voting_id
GROUP BY wv.id, wv.work_id, wv.title, wv.status, wv.total_votes, wv.total_participants, wv.start_date, wv.end_date;

-- ============================================
-- 索引
-- ============================================

CREATE INDEX IF NOT EXISTS idx_work_votings_work_id ON work_votings(work_id);
CREATE INDEX IF NOT EXISTS idx_work_votings_status ON work_votings(status);
CREATE INDEX IF NOT EXISTS idx_work_votings_creator ON work_votings(creator_address);
CREATE INDEX IF NOT EXISTS idx_work_votings_dates ON work_votings(start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_voting_options_voting_id ON voting_options(voting_id);
CREATE INDEX IF NOT EXISTS idx_voting_options_sort ON voting_options(voting_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_user_votes_voting_id ON user_votes(voting_id);
CREATE INDEX IF NOT EXISTS idx_user_votes_voter ON user_votes(voter_address);
CREATE INDEX IF NOT EXISTS idx_user_votes_option ON user_votes(option_id);

-- ============================================
-- 函数
-- ============================================

-- 提交投票函数
CREATE OR REPLACE FUNCTION submit_vote(
  p_voting_id INTEGER,
  p_option_id INTEGER,
  p_voter_address VARCHAR(42),
  p_vote_weight DECIMAL(10,4) DEFAULT 1.0000
)
RETURNS BOOLEAN AS $$
DECLARE
  v_voting_record RECORD;
  v_existing_vote_count INTEGER;
BEGIN
  -- 获取投票信息
  SELECT * INTO v_voting_record
  FROM work_votings 
  WHERE id = p_voting_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Voting not found';
  END IF;
  
  -- 检查投票是否活跃
  IF v_voting_record.status != 'active' OR 
     v_voting_record.start_date > NOW() OR 
     v_voting_record.end_date < NOW() THEN
    RAISE EXCEPTION 'Voting is not active';
  END IF;
  
  -- 检查是否已经投票（如果不允许多次投票）
  IF NOT v_voting_record.allow_multiple_votes THEN
    SELECT COUNT(*) INTO v_existing_vote_count
    FROM user_votes 
    WHERE voting_id = p_voting_id AND voter_address = LOWER(p_voter_address);
    
    IF v_existing_vote_count > 0 THEN
      RAISE EXCEPTION 'User has already voted';
    END IF;
  END IF;
  
  -- 验证选项存在
  IF NOT EXISTS (SELECT 1 FROM voting_options WHERE id = p_option_id AND voting_id = p_voting_id) THEN
    RAISE EXCEPTION 'Invalid voting option';
  END IF;
  
  -- 插入投票记录
  INSERT INTO user_votes (voting_id, option_id, voter_address, vote_weight)
  VALUES (p_voting_id, p_option_id, LOWER(p_voter_address), p_vote_weight);
  
  -- 更新选项投票数
  UPDATE voting_options 
  SET vote_count = vote_count + 1
  WHERE id = p_option_id;
  
  -- 更新投票总数
  UPDATE work_votings 
  SET 
    total_votes = total_votes + 1,
    total_participants = (
      SELECT COUNT(DISTINCT voter_address) 
      FROM user_votes 
      WHERE voting_id = p_voting_id
    ),
    updated_at = NOW()
  WHERE id = p_voting_id;
  
  -- 重新计算百分比
  PERFORM update_voting_percentages(p_voting_id);
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 更新投票百分比函数
CREATE OR REPLACE FUNCTION update_voting_percentages(p_voting_id INTEGER)
RETURNS VOID AS $$
DECLARE
  v_total_votes INTEGER;
BEGIN
  -- 获取总投票数
  SELECT total_votes INTO v_total_votes
  FROM work_votings 
  WHERE id = p_voting_id;
  
  -- 更新每个选项的百分比
  UPDATE voting_options 
  SET percentage = CASE 
    WHEN v_total_votes > 0 THEN ROUND((vote_count::DECIMAL / v_total_votes) * 100, 2)
    ELSE 0
  END
  WHERE voting_id = p_voting_id;
END;
$$ LANGUAGE plpgsql;

-- 创建投票函数
CREATE OR REPLACE FUNCTION create_work_voting(
  p_work_id BIGINT,
  p_title VARCHAR(200),
  p_description TEXT,
  p_voting_type voting_type,
  p_creator_address VARCHAR(42),
  p_end_date TIMESTAMP WITH TIME ZONE,
  p_options JSONB -- [{"title": "Option 1", "description": "Desc 1"}, ...]
)
RETURNS INTEGER AS $$
DECLARE
  v_voting_id INTEGER;
  v_option JSONB;
  v_sort_order INTEGER := 0;
BEGIN
  -- 创建投票
  INSERT INTO work_votings (
    work_id, title, description, voting_type, 
    creator_address, end_date, status
  ) VALUES (
    p_work_id, p_title, p_description, p_voting_type,
    LOWER(p_creator_address), p_end_date, 'active'
  ) RETURNING id INTO v_voting_id;
  
  -- 创建投票选项
  FOR v_option IN SELECT * FROM jsonb_array_elements(p_options)
  LOOP
    INSERT INTO voting_options (
      voting_id, title, description, sort_order
    ) VALUES (
      v_voting_id,
      v_option->>'title',
      v_option->>'description',
      v_sort_order
    );
    
    v_sort_order := v_sort_order + 1;
  END LOOP;
  
  RETURN v_voting_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 触发器
-- ============================================

-- 更新时间戳触发器
CREATE OR REPLACE FUNCTION update_voting_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_voting_timestamp
BEFORE UPDATE ON work_votings
FOR EACH ROW
EXECUTE FUNCTION update_voting_timestamp();

-- 自动更新投票状态触发器
CREATE OR REPLACE FUNCTION auto_update_voting_status()
RETURNS TRIGGER AS $$
BEGIN
  -- 检查是否需要更新状态
  IF NEW.end_date < NOW() AND NEW.status = 'active' THEN
    NEW.status = 'ended';
  ELSIF NEW.start_date <= NOW() AND NEW.end_date > NOW() AND NEW.status = 'upcoming' THEN
    NEW.status = 'active';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_update_voting_status
BEFORE UPDATE ON work_votings
FOR EACH ROW
EXECUTE FUNCTION auto_update_voting_status();

-- ============================================
-- 示例数据插入
-- ============================================

-- 插入示例投票（可选）
/*
INSERT INTO work_votings (work_id, title, description, voting_type, creator_address, end_date, status)
VALUES (1, 'Character Design Direction', 'Which character design style should be used?', 'character_design', '0x1234567890123456789012345678901234567890', NOW() + INTERVAL '7 days', 'active');

INSERT INTO voting_options (voting_id, title, description, sort_order) VALUES
(1, 'Realistic Style', 'Detailed, lifelike character design', 0),
(1, 'Anime Style', 'Japanese animation inspired design', 1),
(1, 'Minimalist Style', 'Simple, clean geometric design', 2);
*/

-- ============================================
-- 注释
-- ============================================

COMMENT ON TABLE work_votings IS '作品投票表';
COMMENT ON TABLE voting_options IS '投票选项表';
COMMENT ON TABLE user_votes IS '用户投票记录表';

COMMENT ON COLUMN work_votings.max_choices IS '最多可选择的选项数';
COMMENT ON COLUMN work_votings.allow_multiple_votes IS '是否允许用户多次投票';
COMMENT ON COLUMN user_votes.vote_weight IS '投票权重，用于加权投票';

-- ============================================
-- 权限设置（根据需要调整）
-- ============================================

-- 如果使用RLS，可以添加相应的策略
-- ALTER TABLE work_votings ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE voting_options ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_votes ENABLE ROW LEVEL SECURITY;