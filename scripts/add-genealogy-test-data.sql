-- 添加Creation Genealogy测试数据
-- 这个脚本会创建一个完整的作品谱系来测试Creation Genealogy功能

-- 1. 首先确保我们有一个根作品（原创作品）
INSERT INTO works (
  work_id, 
  creator_address, 
  title, 
  description, 
  image_url, 
  metadata_uri, 
  material, 
  tags, 
  allow_remix, 
  license_fee,
  creation_type,
  parent_work_id,
  is_remix
) VALUES 
-- 根作品：原创小说
(100, '0x1111111111111111111111111111111111111111', 
 'The Magical Forest', 
 'An original fantasy story about a magical forest and its inhabitants', 
 'https://example.com/magical-forest.jpg', 
 'ipfs://QmMagicalForest', 
 ARRAY['Digital Story'], 
 ARRAY['fantasy', 'original', 'story'], 
 true, 
 '0.02',
 'original',
 NULL,
 false),

-- 2. 原作者的延续作品（Official Continuations）
(101, '0x1111111111111111111111111111111111111111', 
 'The Magical Forest: Chapter 2', 
 'The official continuation by the original author', 
 'https://example.com/magical-forest-2.jpg', 
 'ipfs://QmMagicalForest2', 
 ARRAY['Digital Story'], 
 ARRAY['fantasy', 'continuation', 'story'], 
 true, 
 '0.02',
 'author_continuation',
 100,
 true),

(102, '0x1111111111111111111111111111111111111111', 
 'The Magical Forest: Prequel', 
 'The backstory of the magical forest, by original author', 
 'https://example.com/magical-forest-prequel.jpg', 
 'ipfs://QmMagicalForestPrequel', 
 ARRAY['Digital Story'], 
 ARRAY['fantasy', 'prequel', 'story'], 
 true, 
 '0.02',
 'author_continuation',
 100,
 true),

-- 3. 社区衍生作品（Community Derivatives）
(103, '0x2222222222222222222222222222222222222222', 
 'Forest Creatures: A Side Story', 
 'A fan-created story focusing on the forest creatures', 
 'https://example.com/forest-creatures.jpg', 
 'ipfs://QmForestCreatures', 
 ARRAY['Digital Story'], 
 ARRAY['fantasy', 'fanfiction', 'creatures'], 
 true, 
 '0.01',
 'authorized_derivative',
 100,
 true),

(104, '0x3333333333333333333333333333333333333333', 
 'The Dark Side of the Forest', 
 'A darker interpretation of the magical forest', 
 'https://example.com/dark-forest.jpg', 
 'ipfs://QmDarkForest', 
 ARRAY['Digital Story'], 
 ARRAY['fantasy', 'dark', 'alternative'], 
 true, 
 '0.015',
 'authorized_derivative',
 100,
 true),

(105, '0x4444444444444444444444444444444444444444', 
 'Magical Forest: Visual Novel', 
 'A visual novel adaptation of the original story', 
 'https://example.com/forest-visual-novel.jpg', 
 'ipfs://QmForestVisualNovel', 
 ARRAY['Digital Game'], 
 ARRAY['fantasy', 'visual-novel', 'adaptation'], 
 true, 
 '0.03',
 'authorized_derivative',
 100,
 true),

-- 4. 二级衍生作品（衍生作品的衍生作品）
(106, '0x2222222222222222222222222222222222222222', 
 'Forest Creatures: The Dragon', 
 'A continuation of the Forest Creatures story', 
 'https://example.com/forest-dragon.jpg', 
 'ipfs://QmForestDragon', 
 ARRAY['Digital Story'], 
 ARRAY['fantasy', 'dragon', 'continuation'], 
 true, 
 '0.01',
 'author_continuation',
 103,
 true),

(107, '0x5555555555555555555555555555555555555555', 
 'Forest Creatures: Art Collection', 
 'Fan art inspired by the Forest Creatures story', 
 'https://example.com/forest-art.jpg', 
 'ipfs://QmForestArt', 
 ARRAY['Digital Art'], 
 ARRAY['fantasy', 'art', 'fanart'], 
 true, 
 '0.005',
 'authorized_derivative',
 103,
 true);

-- 5. 更新work_stats表以反映正确的统计信息
INSERT INTO work_stats (work_id, remix_count, like_count, last_updated)
VALUES 
  (100, 5, 0, NOW()),  -- 根作品有5个直接衍生作品
  (101, 0, 0, NOW()),  -- 延续作品
  (102, 0, 0, NOW()),  -- 前传
  (103, 2, 0, NOW()),  -- 这个衍生作品又有2个衍生作品
  (104, 0, 0, NOW()),  -- 黑暗版本
  (105, 0, 0, NOW()),  -- 视觉小说
  (106, 0, 0, NOW()),  -- 二级延续
  (107, 0, 0, NOW())   -- 二级衍生
ON CONFLICT (work_id) 
DO UPDATE SET 
  remix_count = EXCLUDED.remix_count,
  last_updated = EXCLUDED.last_updated;

-- 6. 添加一些用户数据以便显示
INSERT INTO users (wallet_address, username, display_name, bio, skills)
VALUES 
  ('0x1111111111111111111111111111111111111111', 'AUTHOR001', 'Alice Creator', 'Original fantasy author', ARRAY['Writing', 'Storytelling']),
  ('0x2222222222222222222222222222222222222222', 'FAN001', 'Bob Fan', 'Fantasy story enthusiast', ARRAY['Writing', 'Fan Fiction']),
  ('0x3333333333333333333333333333333333333333', 'DARK001', 'Charlie Dark', 'Dark fantasy specialist', ARRAY['Writing', 'Horror']),
  ('0x4444444444444444444444444444444444444444', 'GAME001', 'Diana Game', 'Visual novel developer', ARRAY['Game Development', 'Art']),
  ('0x5555555555555555555555555555555555555555', 'ART001', 'Eve Artist', 'Digital artist', ARRAY['Digital Art', 'Illustration'])
ON CONFLICT (wallet_address) DO NOTHING;

-- 验证数据
SELECT 
  w.work_id,
  w.title,
  w.creation_type,
  w.parent_work_id,
  w.creator_address,
  u.display_name as creator_name
FROM works w
LEFT JOIN users u ON w.creator_address = u.wallet_address
WHERE w.work_id >= 100
ORDER BY w.work_id;