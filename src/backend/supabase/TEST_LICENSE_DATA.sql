-- ============================================
-- 测试许可证数据
-- 用于验证许可证系统是否正常工作
-- ============================================

-- 1. 查看现有的作品数据
SELECT 
    work_id,
    title,
    creator_address,
    license_code,
    license_name,
    commercial_use,
    derivative_works,
    nft_minting,
    share_alike
FROM works_with_licenses 
ORDER BY created_at DESC 
LIMIT 10;

-- 2. 查看work_licenses表中的数据
SELECT 
    work_id,
    license_code,
    license_name,
    commercial_use,
    derivative_works,
    nft_minting,
    share_alike,
    created_at
FROM work_licenses 
ORDER BY created_at DESC;

-- 3. 查看license_options表
SELECT 
    license_code,
    license_name,
    commercial_use,
    derivative_works,
    nft_minting,
    share_alike,
    is_active
FROM license_options 
WHERE is_active = true
ORDER BY sort_order;

-- 4. 检查是否有作品缺少许可证信息
SELECT 
    w.work_id,
    w.title,
    w.creator_address,
    CASE WHEN wl.work_id IS NULL THEN '❌ 缺少许可证' ELSE '✅ 有许可证' END as license_status
FROM works w
LEFT JOIN work_licenses wl ON w.work_id = wl.work_id
ORDER BY w.created_at DESC
LIMIT 20;

-- 5. 如果需要为现有作品添加默认许可证，可以运行以下语句：
-- （取消注释以执行）
/*
INSERT INTO work_licenses (work_id, commercial_use, derivative_works, nft_minting, share_alike, license_code, license_name)
SELECT 
    w.work_id,
    'A2' as commercial_use,  -- 非商用
    'B1' as derivative_works, -- 允许二创
    'C2' as nft_minting,     -- 禁止NFT
    'D2' as share_alike,     -- 不要求相同授权
    'CC BY-NC' as license_code,
    'CC BY-NC - Non-Commercial' as license_name
FROM works w
LEFT JOIN work_licenses wl ON w.work_id = wl.work_id
WHERE wl.work_id IS NULL;
*/