-- ============================================
-- 验证许可证系统设置
-- 检查所有必要的表、视图和函数是否存在
-- ============================================

-- 1. 检查表是否存在
SELECT 
    'works table' as component,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'works') 
         THEN '✅ Exists' 
         ELSE '❌ Missing' 
    END as status
UNION ALL
SELECT 
    'work_licenses table' as component,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'work_licenses') 
         THEN '✅ Exists' 
         ELSE '❌ Missing' 
    END as status
UNION ALL
SELECT 
    'license_options table' as component,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'license_options') 
         THEN '✅ Exists' 
         ELSE '❌ Missing' 
    END as status
UNION ALL
SELECT 
    'authorization_requests table' as component,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'authorization_requests') 
         THEN '✅ Exists' 
         ELSE '❌ Missing' 
    END as status;

-- 2. 检查视图是否存在
SELECT 
    'works_with_licenses view' as component,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'works_with_licenses') 
         THEN '✅ Exists' 
         ELSE '❌ Missing' 
    END as status;

-- 3. 检查函数是否存在
SELECT 
    'save_work_license function' as component,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'save_work_license') 
         THEN '✅ Exists' 
         ELSE '❌ Missing' 
    END as status;

-- 4. 检查works表的字段
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'works' 
ORDER BY ordinal_position;

-- 5. 检查work_licenses表的字段
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'work_licenses' 
ORDER BY ordinal_position;

-- 6. 检查是否有许可证选项数据
SELECT 
    license_code,
    license_name,
    is_active
FROM license_options 
WHERE is_active = true
ORDER BY sort_order;

-- 7. 测试save_work_license函数（可选）
-- 取消注释以下代码来测试函数
/*
SELECT save_work_license(
    999999::BIGINT,  -- 测试work_id
    'A2'::VARCHAR(2),  -- 非商用
    'B1'::VARCHAR(2),  -- 允许二创
    'C2'::VARCHAR(2),  -- 禁止NFT
    'D2'::VARCHAR(2)   -- 不要求相同授权
) as test_result;

-- 查看测试结果
SELECT * FROM work_licenses WHERE work_id = 999999;

-- 清理测试数据
DELETE FROM work_licenses WHERE work_id = 999999;
*/