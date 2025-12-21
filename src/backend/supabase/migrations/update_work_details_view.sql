-- 更新work_details视图以确保包含license_selection字段
-- 这个脚本确保视图包含所有最新的字段

-- 删除并重新创建视图
DROP VIEW IF EXISTS work_details;

CREATE OR REPLACE VIEW work_details AS
SELECT 
  w.id,
  w.work_id,
  w.creator_address,
  w.title,
  w.description,
  w.story,
  w.image_url,
  w.images,
  w.metadata_uri,
  w.material,
  w.tags,
  w.allow_remix,
  w.license_fee,
  w.license_selection,  -- 确保包含许可证选择
  w.license_type,       -- 确保包含许可证类型
  w.has_license_declaration, -- 确保包含声明书状态
  w.parent_work_id,
  w.is_remix,
  w.created_at,
  w.updated_at,
  u.name as creator_name,
  u.avatar_url as creator_avatar,
  COALESCE(ws.view_count, 0) as view_count,
  COALESCE(ws.like_count, 0) as like_count,
  COALESCE(ws.remix_count, 0) as remix_count,
  COALESCE(ws.total_derivatives, 0) as total_derivatives
FROM works w
LEFT JOIN users u ON w.creator_address = u.wallet_address
LEFT JOIN work_stats ws ON w.work_id = ws.work_id;

-- 添加注释
COMMENT ON VIEW work_details IS '作品详情视图，包含统计信息和许可证信息';