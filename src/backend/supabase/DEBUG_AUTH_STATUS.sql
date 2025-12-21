-- ============================================
-- 调试授权状态查询
-- 用于检查授权请求的状态和数据
-- ============================================

-- 1. 查看所有授权请求
SELECT 
    ar.id,
    ar.user_address,
    ar.work_id,
    ar.status,
    ar.tx_hash,
    ar.error_message,
    ar.created_at,
    ar.updated_at,
    w.title as work_title
FROM authorization_requests ar
LEFT JOIN works w ON ar.work_id = w.work_id
ORDER BY ar.created_at DESC
LIMIT 20;

-- 2. 查看特定用户的授权状态
-- 替换 'YOUR_WALLET_ADDRESS' 为实际的钱包地址
/*
SELECT 
    ar.work_id,
    ar.status,
    ar.created_at,
    w.title as work_title,
    w.creator_address as work_creator
FROM authorization_requests ar
LEFT JOIN works w ON ar.work_id = w.work_id
WHERE ar.user_address = 'YOUR_WALLET_ADDRESS'
ORDER BY ar.created_at DESC;
*/

-- 3. 查看每个作品的最新授权状态
SELECT DISTINCT ON (ar.work_id)
    ar.work_id,
    ar.user_address,
    ar.status,
    ar.created_at,
    w.title as work_title
FROM authorization_requests ar
LEFT JOIN works w ON ar.work_id = w.work_id
ORDER BY ar.work_id, ar.created_at DESC;

-- 4. 查看状态分布
SELECT 
    status,
    COUNT(*) as count
FROM authorization_requests
GROUP BY status
ORDER BY count DESC;

-- 5. 查看最近的状态变更
SELECT 
    ar.work_id,
    ar.user_address,
    ar.status,
    ar.tx_hash,
    ar.created_at,
    ar.updated_at,
    w.title as work_title
FROM authorization_requests ar
LEFT JOIN works w ON ar.work_id = w.work_id
WHERE ar.updated_at > NOW() - INTERVAL '1 hour'
ORDER BY ar.updated_at DESC;

-- 6. 检查是否有重复的授权请求
SELECT 
    user_address,
    work_id,
    COUNT(*) as request_count
FROM authorization_requests
GROUP BY user_address, work_id
HAVING COUNT(*) > 1
ORDER BY request_count DESC;

-- 7. 查看收藏表和授权状态的关联
SELECT 
    c.user_id,
    c.work_id,
    c.saved_at,
    ar.status as auth_status,
    ar.created_at as auth_created,
    w.title as work_title
FROM collections c
LEFT JOIN authorization_requests ar ON c.work_id = ar.work_id
LEFT JOIN works w ON c.work_id = w.work_id
ORDER BY c.saved_at DESC
LIMIT 20;