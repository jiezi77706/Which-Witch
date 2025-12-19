-- ============================================
-- 投票系统数据库设置 - 简化版本
-- 在Supabase SQL编辑器中执行
-- ============================================

-- 1. 创建枚举类型
CREATE TYPE voting_status AS ENUM ('upcoming', 'active', 'ended', 'cancelled');
CREATE TYPE voting_type AS ENUM ('character_design', 'story_setting', 'plot_direction', 'art_style', 'color_scheme', 'music_style', 'other');

-- 2. 创建投票表
CREATE TABLE work_votings (
  id SERIAL PRIMARY KEY,
  work_id BIGINT NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  voting_type voting_type NOT NULL,
  status voting_status DEFAULT 'active',
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  creator_address VARCHAR(42) NOT NULL,
  total_votes INTEGER DEFAULT 0,
  total_participants INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 创建投票选项表
CREATE TABLE voting_options (
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

-- 4. 创建用户投票记录表
CREATE TABLE user_votes (
  id SERIAL PRIMARY KEY,
  voting_id INTEGER NOT NULL,
  option_id INTEGER NOT NULL,
  voter_address VARCHAR(42) NOT NULL,
  voted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (voting_id) REFERENCES work_votings(id) ON DELETE CASCADE,
  FOREIGN KEY (option_id) REFERENCES voting_options(id) ON DELETE CASCADE,
  UNIQUE(voting_id, voter_address, option_id)
);

-- 5. 创建索引
CREATE INDEX idx_work_votings_work_id ON work_votings(work_id);
CREATE INDEX idx_voting_options_voting_id ON voting_options(voting_id);
CREATE INDEX idx_user_votes_voting_id ON user_votes(voting_id);
CREATE INDEX idx_user_votes_voter ON user_votes(voter_address);

-- 6. 插入示例数据（可选）
INSERT INTO work_votings (work_id, title, description, voting_type, creator_address, end_date) 
VALUES (1, 'Character Design Direction', 'Which character design style should be used for the main protagonist?', 'character_design', '0x1234567890123456789012345678901234567890', NOW() + INTERVAL '7 days');

INSERT INTO voting_options (voting_id, title, description, sort_order) VALUES
(1, 'Realistic Style', 'Detailed, lifelike character design', 0),
(1, 'Anime Style', 'Japanese animation inspired design', 1),
(1, 'Minimalist Style', 'Simple, clean geometric design', 2);

-- 完成！投票系统数据库结构已创建