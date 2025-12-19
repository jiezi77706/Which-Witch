# Creation Type System Implementation

## 概述

根据用户的深度分析，我们实施了创作关系类型的明确枚举系统，解决了之前数据模型在概念上已经分层但在数据层和查询层没有分层的问题。

## 核心问题分析

### 之前的问题
1. **模型混乱**: `is_remix` 承担了过多语义（既是"是否二创"，又被用来区分类型）
2. **查询不分层**: `getDerivativeWorks` 只按 `parent_work_id` 查询，不区分"作者关系"
3. **UI混合**: Creation Genealogy 时间线把"原作者延续"和"他人二创"混在同一层级渲染

### 解决方案
引入 `creation_type` 字段作为「创作关系类型」的明确枚举，实现三层正交结构。

## 实施的改进

### 1. 数据库层面 (`add_creation_type_system.sql`)

#### 新增字段
```sql
ALTER TABLE works 
ADD COLUMN IF NOT EXISTS creation_type TEXT NOT NULL DEFAULT 'original';
```

#### 枚举约束
```sql
CHECK (creation_type IN (
  'original',              -- 原创根作品
  'author_continuation',   -- 原作者的延续/新设定/正史
  'authorized_derivative', -- 他人二创（已授权）
  'unauthorized_derivative' -- 他人二创（未授权，预留）
))
```

#### 自动判断逻辑
```sql
CREATE OR REPLACE FUNCTION determine_creation_type(
  p_parent_work_id BIGINT,
  p_creator_address VARCHAR(42)
)
```

判断规则：
- 无父作品 → `original`
- 有父作品 + 同一创作者 → `author_continuation`
- 有父作品 + 不同创作者 → `authorized_derivative`

#### 触发器
自动在插入新作品时设置正确的 `creation_type`。

### 2. 服务层面 (`work.service.ts`)

#### 新增函数

1. **getCategorizedDerivatives**: 返回结构化的衍生作品数据
```typescript
{
  authorContinuations: Work[];
  authorizedDerivatives: Work[];
}
```

2. **getWorkGenealogy**: 获取完整谱系信息
```typescript
{
  root: Work | null;
  continuations: Work[];
  derivatives: Work[];
  totalDerivatives: number;
}
```

3. **getWorksByCreationType**: 根据创作类型筛选作品

### 3. UI层面 (`work-card.tsx`)

#### 分层显示
- **🟣 Official Continuations (by original creator)**: 原作者的正典延续
- **🔵 Community Derivatives**: 社区授权衍生作品

#### 视觉区分
- 不同颜色的时间线（紫色 vs 蓝色）
- 分类统计显示
- 明确的创作关系标签

## 数据模型的三层正交结构

### 轴 1: 作品谱系关系 (creation_type)
- `original`: 原始创作
- `author_continuation`: 原作者延续（正典）
- `authorized_derivative`: 授权二创
- `unauthorized_derivative`: 未授权二创（预留）

### 轴 2: 作者-作品关系 (creator_address)
- 通过地址比较判断是否为原作者

### 轴 3: 授权状态 (allow_remix + license_fee)
- 授权策略和费用设置

## 向后兼容性

1. **保留旧函数**: `getDerivativeWorks` 继续工作
2. **is_remix 字段**: 现在只作为 UI 标签，根据 `creation_type` 自动设置
3. **现有数据**: 通过迁移脚本自动更新 `creation_type`

## 用户体验改进

### 前端分类建议
- **一级入口**: Works / Authors / Universes
- **作品页内标签**: Original / Canonical Extension / Authorized Derivative / Fan Creation
- **筛选项**: By relation / By author role / By license

### 展示逻辑
- 原作者延续 → "原作 · 正典延续" by 原作者
- 他人授权二创 → "衍生创作（授权）" Based on Original Work by XXX

## 数据库函数和视图

1. **work_relationship_hierarchy**: 递归视图显示完整层次结构
2. **get_categorized_derivatives**: 函数返回分类的衍生作品
3. **自动触发器**: 确保数据一致性

## 性能优化

- 添加复合索引: `idx_works_parent_creation_type`
- 优化查询路径: 按 `creation_type` 分别查询
- 缓存谱系数据: 减少重复计算

## 测试验证

迁移后可以通过以下查询验证：
```sql
SELECT 
  creation_type,
  COUNT(*) as count,
  COUNT(CASE WHEN parent_work_id IS NOT NULL THEN 1 END) as has_parent_count
FROM works 
GROUP BY creation_type
ORDER BY creation_type;
```

## 下一步计划

1. **前端筛选器**: 添加按 `creation_type` 筛选的UI
2. **统计面板**: 显示各类型作品的数量统计
3. **推荐算法**: 基于创作关系类型的智能推荐
4. **合约集成**: 在智能合约中也支持创作类型标识

## 总结

这次改进解决了核心的数据模型问题，实现了：
- ✅ 明确的创作关系枚举
- ✅ 分层的数据查询
- ✅ 结构化的UI展示
- ✅ 向后兼容性
- ✅ 自动化的数据一致性

现在系统能够正确区分"原作者延续"和"他人二创"，为用户提供更清晰的创作谱系理解。