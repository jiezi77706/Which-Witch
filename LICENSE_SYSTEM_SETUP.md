# 授权系统快速设置

## ✅ 已完成的工作

### 1. 数据库迁移 ✅
- 文件: `src/backend/supabase/migrations/add_license_options.sql`
- 包含: 3个表、9个预定义协议、16个选项描述

### 2. 前端组件 ✅
- `components/whichwitch/license-selector-button.tsx` - 授权按钮
- `components/whichwitch/license-selector-modal.tsx` - 选择弹窗
- `components/whichwitch/upload-view.tsx` - 已集成到上传页面

### 3. 后端 API ✅
- `app/api/license/save/route.ts` - 保存/获取授权
- `app/api/license/options/route.ts` - 获取授权选项

### 4. 文档 ✅
- `docs/LICENSE_SYSTEM_GUIDE.md` - 完整指南

## 🚀 快速开始

### 步骤 1: 运行数据库迁移

在 Supabase SQL Editor 中运行:

```sql
-- 复制并运行整个文件内容
src/backend/supabase/migrations/add_license_options.sql
```

### 步骤 2: 验证数据库

```sql
-- 检查表是否创建
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('license_options', 'work_licenses', 'license_option_descriptions');

-- 检查预定义协议
SELECT license_code, license_name FROM license_options ORDER BY sort_order;

-- 应该看到 9 个协议
```

### 步骤 3: 测试前端

```bash
npm run dev
```

访问: http://localhost:3000/app/upload

测试流程:
1. 填写作品信息
2. 开启 "Allow Remixing"
3. 看到两个按钮: "AI Advisor" 和 "License Options"
4. 点击 "License Options"
5. 选择授权选项 (A, B, C, D)
6. 查看生成的协议
7. 点击 "Save License"
8. 看到授权信息显示在下方

## 📋 功能清单

### 上传页面
- [x] AI Advisor 按钮 (已有)
- [x] License Options 按钮 (新增)
- [x] 两个按钮并列显示
- [x] 授权选择弹窗
- [x] 授权信息显示
- [x] 授权费用输入

### 授权选择弹窗
- [x] A. 商业使用 (3个选项)
- [x] B. 二次创作 (2个选项)
- [x] C. NFT 铸造 (2个选项)
- [x] D. 相同协议 (2个选项)
- [x] 实时预览生成的协议
- [x] 保存功能

### 数据库
- [x] license_options 表
- [x] work_licenses 表
- [x] license_option_descriptions 表
- [x] 9 个预定义协议
- [x] 数据库函数
- [x] 视图和索引

### API
- [x] POST /api/license/save
- [x] GET /api/license/save?workId=X
- [x] GET /api/license/options

## 🎯 使用示例

### 创作者选择授权

```
1. 上传作品
2. 开启 "Allow Remixing"
3. 点击 "License Options"
4. 选择:
   - A1 (允许商用)
   - B1 (允许二创)
   - C1 (允许 NFT)
   - D2 (不强制同协议)
5. 系统显示: "CC BY - Attribution"
6. 设置授权费: 0.05 ETH
7. 上传作品
```

### 查看作品授权

作品详情页将显示:
```
📜 License: CC BY
✓ Commercial use allowed
✓ Derivatives allowed
✓ NFT minting allowed
💰 License Fee: 0.05 ETH
```

## 🔧 集成到现有功能

### 1. 作品详情页

添加授权信息显示:

```tsx
// 在作品详情页
import { Badge } from '@/components/ui/badge'

// 显示授权信息
{work.license_code && (
  <div className="space-y-2">
    <h3 className="font-semibold">License</h3>
    <Badge>{work.license_name}</Badge>
    <p className="text-sm text-muted-foreground">
      {work.license_description}
    </p>
  </div>
)}
```

### 2. 作品列表

显示授权标签:

```tsx
<Badge variant="outline" className="text-xs">
  {work.license_code || 'No License'}
</Badge>
```

### 3. 二创申请

检查授权条件:

```tsx
// 检查是否允许二创
if (work.derivative_works === 'B2') {
  // 不允许二创
  return <p>Derivatives not allowed</p>
}

// 检查是否需要支付
if (work.license_fee) {
  // 显示费用
  return <p>License Fee: {work.license_fee} ETH</p>
}
```

## 📊 授权映射速查

| 选择 | 生成协议 | 说明 |
|------|----------|------|
| A1-B1-C1-D2 | CC BY | 最开放 |
| A2-B1-C2-D2 | CC BY-NC | 非商用 |
| A2-B1-C2-D1 | CC BY-NC-SA | 非商用+同协议 |
| A1-B1-C2-D2 | CC BY-NoNFT | 禁止NFT |
| A3-B1-C2-D2 | CC BY-NC-CR | 商用需授权 |
| A2-B2-C2-D2 | All Rights Reserved | 最严格 |
| A1-B2-C2-D2 | Custom Commercial | 商用但不可改 |
| A1-B1-C1-D1 | CC BY-SA | 开放+同协议 |
| A1-B1-C1-D2 | CC0 | 公共领域 |

## 🧪 测试检查清单

- [ ] 数据库迁移成功
- [ ] 9 个协议已插入
- [ ] 上传页面显示两个按钮
- [ ] 点击 License Options 打开弹窗
- [ ] 选择选项后显示对应协议
- [ ] 保存后显示授权信息
- [ ] API 可以保存授权
- [ ] API 可以获取授权

## 🐛 故障排除

### 问题: 弹窗不显示

检查:
```tsx
// 确保导入了组件
import { LicenseSelectorButton } from './license-selector-button'
```

### 问题: 数据库错误

检查:
```sql
-- 确保 works 表存在
SELECT * FROM works LIMIT 1;

-- 确保函数存在
SELECT proname FROM pg_proc WHERE proname = 'save_work_license';
```

### 问题: 协议不匹配

检查:
```sql
-- 查看所有协议映射
SELECT 
  commercial_use || '-' || derivative_works || '-' || 
  nft_minting || '-' || share_alike as mapping,
  license_code,
  license_name
FROM license_options;
```

## 📞 获取帮助

- 📖 完整文档: `docs/LICENSE_SYSTEM_GUIDE.md`
- 🗄️ 数据库脚本: `src/backend/supabase/migrations/add_license_options.sql`
- 💬 检查控制台日志
- 🔍 查看 Supabase 日志

---

**准备就绪！** 🎉

所有组件已创建，数据库迁移已准备好。只需运行迁移脚本即可开始使用。
