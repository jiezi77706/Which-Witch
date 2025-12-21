-- 为现有作品添加测试许可证数据
-- 这样可以测试授权声明书功能

-- 1. 首先检查哪些作品没有许可证
SELECT 
    w.work_id,
    w.title,
    w.creator_address,
    CASE WHEN wl.work_id IS NULL THEN '❌ 缺少许可证' ELSE '✅ 有许可证' END as license_status
FROM works w
LEFT JOIN work_licenses wl ON w.work_id = wl.work_id
ORDER BY w.created_at DESC
LIMIT 10;

-- 2. 为没有许可证的作品添加默认许可证（CC BY-NC）
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
WHERE wl.work_id IS NULL
LIMIT 5; -- 只为前5个作品添加，避免添加太多

-- 3. 验证添加结果
SELECT 
    w.work_id,
    w.title,
    wl.license_code,
    wl.license_name,
    wl.commercial_use,
    wl.derivative_works,
    wl.nft_minting,
    wl.share_alike
FROM works w
JOIN work_licenses wl ON w.work_id = wl.work_id
ORDER BY w.created_at DESC
LIMIT 10;

-- 4. 检查works_with_licenses视图是否正确显示数据
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
WHERE license_code IS NOT NULL
ORDER BY created_at DESC 
LIMIT 5;