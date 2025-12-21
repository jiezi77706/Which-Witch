-- 调试创作者地址问题
-- 检查作品数据中的创作者地址字段

-- 1. 检查works表中的创作者地址
SELECT 
    work_id,
    title,
    creator_address,
    CASE 
        WHEN creator_address IS NULL THEN '❌ NULL'
        WHEN creator_address = '' THEN '❌ 空字符串'
        WHEN creator_address = '0x0000000000000000000000000000000000000000' THEN '❌ 零地址'
        WHEN LENGTH(creator_address) != 42 THEN '❌ 长度错误'
        WHEN creator_address NOT LIKE '0x%' THEN '❌ 格式错误'
        ELSE '✅ 正常'
    END as address_status,
    created_at
FROM works 
ORDER BY created_at DESC 
LIMIT 10;

-- 2. 统计创作者地址的状态
SELECT 
    CASE 
        WHEN creator_address IS NULL THEN 'NULL'
        WHEN creator_address = '' THEN '空字符串'
        WHEN creator_address = '0x0000000000000000000000000000000000000000' THEN '零地址'
        WHEN LENGTH(creator_address) != 42 THEN '长度错误'
        WHEN creator_address NOT LIKE '0x%' THEN '格式错误'
        ELSE '正常'
    END as status,
    COUNT(*) as count
FROM works 
GROUP BY 
    CASE 
        WHEN creator_address IS NULL THEN 'NULL'
        WHEN creator_address = '' THEN '空字符串'
        WHEN creator_address = '0x0000000000000000000000000000000000000000' THEN '零地址'
        WHEN LENGTH(creator_address) != 42 THEN '长度错误'
        WHEN creator_address NOT LIKE '0x%' THEN '格式错误'
        ELSE '正常'
    END
ORDER BY count DESC;

-- 3. 如果有问题的地址，可以更新为测试地址
-- （取消注释以执行）
/*
UPDATE works 
SET creator_address = '0x1234567890123456789012345678901234567890'
WHERE creator_address IS NULL 
   OR creator_address = '' 
   OR creator_address = '0x0000000000000000000000000000000000000000'
   OR LENGTH(creator_address) != 42;
*/

-- 4. 验证更新结果
SELECT 
    'After Update' as status,
    COUNT(*) as total_works,
    COUNT(CASE WHEN creator_address IS NOT NULL 
               AND creator_address != '' 
               AND creator_address != '0x0000000000000000000000000000000000000000'
               AND LENGTH(creator_address) = 42 
               THEN 1 END) as valid_addresses
FROM works;