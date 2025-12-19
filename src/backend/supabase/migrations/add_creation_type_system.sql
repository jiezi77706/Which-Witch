-- ============================================
-- Creation Type System Enhancement
-- 解决作品关系类型的明确枚举问题
-- ============================================

-- 1. 添加 creation_type 字段到 works 表
ALTER TABLE works 
ADD COLUMN IF NOT EXISTS creation_type TEXT NOT NULL DEFAULT 'original';

-- 2. 创建枚举约束
ALTER TABLE works 
ADD CONSTRAINT check_creation_type 
CHECK (creation_type IN (
  'original',              -- 原创根作品
  'author_continuation',   -- 原作者的延续/新设定/正史
  'authorized_derivative', -- 他人二创（已授权）
  'unauthorized_derivative' -- 他人二创（未授权，预留）
));

-- 3. 创建索引
CREATE INDEX IF NOT EXISTS idx_works_creation_type ON works(creation_type);
CREATE INDEX IF NOT EXISTS idx_works_parent_creation_type ON works(parent_work_id, creation_type);

-- 4. 更新现有数据的 creation_type
-- 根据现有的 parent_work_id 和 creator_address 关系来判断
UPDATE works 
SET creation_type = CASE
  WHEN parent_work_id IS NULL THEN 'original'
  WHEN parent_work_id IS NOT NULL AND creator_address = (
    SELECT creator_address FROM works w2 WHERE w2.work_id = works.parent_work_id
  ) THEN 'author_continuation'
  WHEN parent_work_id IS NOT NULL AND creator_address != (
    SELECT creator_address FROM works w2 WHERE w2.work_id = works.parent_work_id
  ) THEN 'authorized_derivative'
  ELSE 'original'
END;

-- 5. 创建函数：自动判断创作类型
CREATE OR REPLACE FUNCTION determine_creation_type(
  p_parent_work_id BIGINT,
  p_creator_address VARCHAR(42)
)
RETURNS TEXT AS $$
DECLARE
  parent_creator VARCHAR(42);
BEGIN
  -- 如果没有父作品，则为原创
  IF p_parent_work_id IS NULL THEN
    RETURN 'original';
  END IF;
  
  -- 获取父作品的创作者
  SELECT creator_address INTO parent_creator
  FROM works 
  WHERE work_id = p_parent_work_id;
  
  -- 如果找不到父作品，抛出异常
  IF parent_creator IS NULL THEN
    RAISE EXCEPTION 'Parent work not found: %', p_parent_work_id;
  END IF;
  
  -- 判断创作关系
  IF p_creator_address = parent_creator THEN
    RETURN 'author_continuation';
  ELSE
    RETURN 'authorized_derivative';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 6. 创建触发器函数：自动设置 creation_type
CREATE OR REPLACE FUNCTION set_creation_type_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- 只在插入时自动设置，更新时保持用户设置的值
  IF TG_OP = 'INSERT' THEN
    NEW.creation_type = determine_creation_type(NEW.parent_work_id, NEW.creator_address);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. 创建触发器
DROP TRIGGER IF EXISTS trigger_set_creation_type ON works;
CREATE TRIGGER trigger_set_creation_type
  BEFORE INSERT ON works
  FOR EACH ROW
  EXECUTE FUNCTION set_creation_type_trigger();

-- 8. 创建视图：作品关系层次结构
CREATE OR REPLACE VIEW work_relationship_hierarchy AS
WITH RECURSIVE work_tree AS (
  -- 根节点：所有原创作品
  SELECT 
    work_id,
    creator_address,
    title,
    creation_type,
    parent_work_id,
    0 as level,
    ARRAY[work_id] as path,
    work_id as root_work_id
  FROM works 
  WHERE creation_type = 'original'
  
  UNION ALL
  
  -- 递归：所有衍生作品
  SELECT 
    w.work_id,
    w.creator_address,
    w.title,
    w.creation_type,
    w.parent_work_id,
    wt.level + 1,
    wt.path || w.work_id,
    wt.root_work_id
  FROM works w
  JOIN work_tree wt ON w.parent_work_id = wt.work_id
  WHERE w.creation_type IN ('author_continuation', 'authorized_derivative')
)
SELECT 
  wt.*,
  w.image_url,
  w.tags,
  w.allow_remix,
  w.created_at,
  -- 添加统计信息
  (SELECT COUNT(*) FROM works WHERE parent_work_id = wt.work_id) as direct_derivatives_count,
  -- 添加创作者信息
  CASE 
    WHEN wt.creation_type = 'original' THEN 'Original Creator'
    WHEN wt.creation_type = 'author_continuation' THEN 'Original Creator (Continuation)'
    WHEN wt.creation_type = 'authorized_derivative' THEN 'Authorized Creator'
    ELSE 'Unknown'
  END as creator_role
FROM work_tree wt
JOIN works w ON wt.work_id = w.work_id
ORDER BY wt.root_work_id, wt.level, w.created_at;

-- 9. 创建函数：获取分类的衍生作品
CREATE OR REPLACE FUNCTION get_categorized_derivatives(p_parent_work_id BIGINT)
RETURNS TABLE(
  author_continuations JSONB,
  authorized_derivatives JSONB
) AS $$
DECLARE
  continuations JSONB;
  derivatives JSONB;
BEGIN
  -- 获取原作者延续作品
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'work_id', w.work_id,
      'title', w.title,
      'creator_address', w.creator_address,
      'image_url', w.image_url,
      'created_at', w.created_at,
      'tags', w.tags,
      'like_count', COALESCE(ws.like_count, 0),
      'remix_count', COALESCE(ws.remix_count, 0)
    )
  ), '[]'::jsonb) INTO continuations
  FROM works w
  LEFT JOIN work_stats ws ON w.work_id = ws.work_id
  WHERE w.parent_work_id = p_parent_work_id 
    AND w.creation_type = 'author_continuation'
  ORDER BY w.created_at DESC;
  
  -- 获取授权衍生作品
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'work_id', w.work_id,
      'title', w.title,
      'creator_address', w.creator_address,
      'image_url', w.image_url,
      'created_at', w.created_at,
      'tags', w.tags,
      'like_count', COALESCE(ws.like_count, 0),
      'remix_count', COALESCE(ws.remix_count, 0)
    )
  ), '[]'::jsonb) INTO derivatives
  FROM works w
  LEFT JOIN work_stats ws ON w.work_id = ws.work_id
  WHERE w.parent_work_id = p_parent_work_id 
    AND w.creation_type = 'authorized_derivative'
  ORDER BY w.created_at DESC;
  
  RETURN QUERY SELECT continuations, derivatives;
END;
$$ LANGUAGE plpgsql;

-- 10. 更新现有的 is_remix 逻辑
-- is_remix 现在只是一个 UI 标签，不再承担结构性判断
-- 可以根据 creation_type 来设置
UPDATE works 
SET is_remix = CASE 
  WHEN creation_type IN ('author_continuation', 'authorized_derivative') THEN true
  ELSE false
END;

-- 11. 创建索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_works_root_derivatives ON works(parent_work_id, creation_type, created_at DESC);

-- 验证迁移结果
SELECT 
  creation_type,
  COUNT(*) as count,
  COUNT(CASE WHEN parent_work_id IS NOT NULL THEN 1 END) as has_parent_count
FROM works 
GROUP BY creation_type
ORDER BY creation_type;

-- 显示一些示例数据
SELECT 
  work_id,
  title,
  creator_address,
  creation_type,
  parent_work_id,
  is_remix
FROM works 
ORDER BY created_at DESC 
LIMIT 10;