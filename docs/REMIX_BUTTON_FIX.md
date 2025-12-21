# 二创授权按钮问题修复

## 问题描述

用户支付完二创费用后，许可证按钮没有变成 "Upload Work" 按钮，无法进入上传页面。

## 问题分析

经过调查，发现了以下几个问题：

### 1. 数据结构不匹配
- 授权声明书功能期望从 `works` 表的 `license_selection` 字段获取许可证信息
- 但实际上许可证信息存储在 `work_licenses` 表中，包含 `license_code`, `license_name` 等字段
- 需要使用 `works_with_licenses` 视图来获取完整的许可证信息

### 2. 数据刷新问题
- 支付成功后使用 `window.location.reload()` 刷新页面，体验不好
- 应该使用 `useCollections` hook 的 `refetch` 方法来刷新数据

### 3. 回调函数数据格式问题
- `collections-view.tsx` 中传递给 `onUploadWork` 的数据格式不正确
- 字段名不匹配导致上传结果页面无法正确显示

## 修复方案

### 1. 更新许可证数据获取方式

**修改文件：** `lib/supabase/services/work.service.ts`

```typescript
// 使用 works_with_licenses 视图替代 work_details 视图
export async function getAllWorks(limit = 100): Promise<Work[]> {
  const { data, error } = await supabase
    .from('works_with_licenses')  // 改为使用包含许可证信息的视图
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  // ...
}
```

### 2. 更新组件接口

**修改文件：** `components/whichwitch/license-declaration-link.tsx`

```typescript
interface LicenseDeclarationLinkProps {
  // 从 work_licenses 表获取的许可证信息
  licenseCode?: string;
  licenseName?: string;
  commercialUse?: string;
  derivativeWorks?: string;
  nftMinting?: string;
  shareAlike?: string;
  // 移除 licenseSelection?: LicenseSelection;
}
```

### 3. 更新作品卡片数据传递

**修改文件：** `components/whichwitch/work-card.tsx`

```typescript
<LicenseDeclarationLink
  // 传递来自 work_licenses 表的字段
  licenseCode={work.license_code}
  licenseName={work.license_name}
  commercialUse={work.commercial_use}
  derivativeWorks={work.derivative_works}
  nftMinting={work.nft_minting}
  shareAlike={work.share_alike}
  // 移除 licenseSelection={work.license_selection}
/>
```

### 4. 修复数据刷新逻辑

**修改文件：** `components/whichwitch/collections-view.tsx`

```typescript
// 使用 refetch 方法替代页面刷新
const { refetch: refetchCollections } = useCollections(user?.id);

// 支付成功后
console.log("Authorization granted successfully!")
setRemixModalOpen(false)

// 刷新数据
await refetchCollections()  // 替代 window.location.reload()
```

### 5. 修复回调数据格式

**修改文件：** `components/whichwitch/collections-view.tsx`

```typescript
onUploadWork({
  id: work.id,
  title: work.title,
  image: work.image  // 使用正确的字段名
})
```

### 6. 更新数据类型定义

**修改文件：** `lib/supabase/client.ts`

```typescript
export interface Work {
  // 原有字段...
  // 许可证信息（来自work_licenses表）
  license_code?: string;
  license_name?: string;
  commercial_use?: string;
  derivative_works?: string;
  nft_minting?: string;
  share_alike?: string;
  custom_terms?: string;
  license_description?: string;
  license_url?: string;
}
```

## 数据库设置

需要确保以下数据库结构存在：

### 1. 运行许可证系统设置脚本

```sql
-- 在 Supabase SQL 编辑器中执行
src/backend/supabase/SETUP_COMPLETE_LICENSE_SYSTEM.sql
```

### 2. 验证数据结构

```sql
-- 检查 works_with_licenses 视图
SELECT * FROM works_with_licenses LIMIT 5;

-- 检查 work_licenses 表
SELECT * FROM work_licenses LIMIT 5;

-- 检查 authorization_requests 表
SELECT * FROM authorization_requests LIMIT 5;
```

## 测试流程

1. **上传作品并设置许可证**
   - 访问 Create 页面
   - 上传作品并选择 ABCD 许可证配置
   - 确认作品创建成功

2. **收藏作品**
   - 在 Square 页面收藏刚创建的作品
   - 切换到 Saved 页面查看收藏

3. **申请二创授权**
   - 在 Saved 页面点击 "Apply for License" 按钮
   - 支付二创费用
   - 确认交易成功

4. **验证按钮状态**
   - 支付成功后，按钮应该变为 "Upload Work"
   - 点击按钮应该跳转到上传结果页面

5. **验证许可证信息显示**
   - 在作品卡片中应该显示正确的许可证类型
   - 许可证摘要应该显示具体的权限信息

## 调试信息

添加了详细的调试日志来帮助诊断问题：

```typescript
// collections-view.tsx
console.log('🎯 handleRemixClick called with work:', work);
console.log('🎯 work.collectionStatus:', work.collectionStatus);

// app-container.tsx  
console.log('🎯 onUploadWork called with workData:', workData);
console.log('🎯 Setting showUploadResult to true');
```

## 相关文件

### 核心修改文件
- `components/whichwitch/collections-view.tsx`
- `components/whichwitch/license-declaration-link.tsx`
- `components/whichwitch/work-card.tsx`
- `lib/supabase/services/work.service.ts`
- `lib/supabase/client.ts`
- `components/whichwitch/app-container.tsx`

### 数据库文件
- `src/backend/supabase/SETUP_COMPLETE_LICENSE_SYSTEM.sql`
- `src/backend/supabase/TEST_LICENSE_DATA.sql`

### 文档文件
- `docs/LICENSE_DECLARATION_FEATURE.md`
- `docs/REMIX_BUTTON_FIX.md`

## 预期结果

修复后，用户支付完二创费用后：

1. ✅ 按钮文本从 "Apply for License" 变为 "Upload Work"
2. ✅ 按钮颜色从黄色变为绿色
3. ✅ 点击按钮跳转到上传结果页面而不是支付模态框
4. ✅ 许可证信息正确显示在作品卡片中
5. ✅ 授权声明书功能正常工作

## 注意事项

1. **数据库迁移**：确保运行了完整的许可证系统设置脚本
2. **缓存清理**：如果遇到问题，清理 `.next` 缓存并重新构建
3. **状态同步**：支付成功后会自动刷新收藏数据，无需手动刷新页面
4. **错误处理**：添加了完善的错误处理和用户反馈机制

修复完成后，二创授权流程应该能够正常工作！