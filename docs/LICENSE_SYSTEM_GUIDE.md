# License System Guide - 授权系统指南

## 📋 概述

WhichWitch 平台的创意共享授权系统，支持 9 种预定义授权协议和自定义授权选项。

## 🎯 功能特点

### 1. 授权选项选择器
- **位置**: 上传页面 → 允许二创 → License Configuration
- **两个按钮并列**:
  - 🤖 AI Advisor - AI 授权建议
  - ⚖️ License Options - 手动选择授权

### 2. 四维授权配置

#### A. 商业使用 (Commercial Use)
- **A1** - 允许商用 (Commercial Use Allowed)
- **A2** - 不允许商用 (Non-Commercial Only)
- **A3** - 需要授权 (Authorization Required)

#### B. 二次创作 (Derivative Works)
- **B1** - 允许二创 (Derivatives Allowed)
- **B2** - 禁止二创 (No Derivatives)

#### C. NFT 铸造 (NFT Minting)
- **C1** - 允许二次 NFT (NFT Minting Allowed)
- **C2** - 禁止二次 NFT (No Secondary NFT)

#### D. 相同协议 (ShareAlike)
- **D1** - 衍生需同协议 (ShareAlike Required)
- **D2** - 不强制同协议 (No ShareAlike)

## 📊 授权映射表

| 编号 | A 商用 | B 二创 | C NFT | D 同协议 | 生成协议 | 说明 |
|------|--------|--------|-------|----------|----------|------|
| ① | A1 | B1 | C1 | D2 | **CC BY** | 可商用、可二创、可 NFT |
| ② | A2 | B1 | C2 | D2 | **CC BY-NC** | 非商用二创，禁止二次 NFT |
| ③ | A2 | B1 | C2 | D1 | **CC BY-NC-SA** | 非商用二创，衍生需同协议 |
| ④ | A1 | B1 | C2 | D2 | **CC BY-NoNFT** | 商用与二创允许，但不上链 |
| ⑤ | A3 | B1 | C2 | D2 | **CC BY-NC-CR** | 二创自由，商业需联系作者 |
| ⑥ | A2 | B2 | C2 | D2 | **All Rights Reserved** | 仅展示，不可改编或商用 |
| ⑦ | A1 | B2 | C2 | D2 | **Custom Commercial** | 可商用但不可改编 |
| ⑧ | A1 | B1 | C1 | D1 | **CC BY-SA** | 可商用二创，衍生必须开放 |
| ⑨ | A1 | B1 | C1 | D2 | **CC0** | 放弃版权，任何人可自由使用 |

## 🗄️ 数据库结构

### 表 1: license_options
存储预定义的授权协议

```sql
- license_code: 协议代码 (CC BY, CC BY-NC, etc.)
- license_name: 协议名称
- description: 协议描述
- commercial_use: A1/A2/A3
- derivative_works: B1/B2
- nft_minting: C1/C2
- share_alike: D1/D2
- license_url: 官方协议链接
```

### 表 2: work_licenses
存储每个作品的授权选择

```sql
- work_id: 作品 ID
- commercial_use: 选择的商用选项
- derivative_works: 选择的二创选项
- nft_minting: 选择的 NFT 选项
- share_alike: 选择的同协议选项
- license_code: 生成的协议代码
- license_name: 生成的协议名称
- custom_terms: 自定义条款
- ai_recommended: 是否 AI 推荐
```

### 表 3: license_option_descriptions
存储选项说明

```sql
- option_code: 选项代码 (A1, A2, B1, etc.)
- option_category: 类别 (commercial, derivative, nft, sharealike)
- option_label: 选项标签
- option_description: 选项描述
```

## 🔌 API 接口

### 1. 保存授权
**POST /api/license/save**

```json
{
  "workId": 123,
  "commercial": "A1",
  "derivative": "B1",
  "nft": "C1",
  "shareAlike": "D2",
  "customTerms": "Optional custom terms",
  "aiRecommended": false
}
```

**响应**:
```json
{
  "success": true,
  "license": {
    "id": 1,
    "work_id": 123,
    "license_code": "CC BY",
    "license_name": "CC BY - Attribution",
    "commercial_use": "A1",
    "derivative_works": "B1",
    "nft_minting": "C1",
    "share_alike": "D2"
  }
}
```

### 2. 获取授权
**GET /api/license/save?workId=123**

### 3. 获取所有授权选项
**GET /api/license/options**

**响应**:
```json
{
  "descriptions": [...],
  "grouped": {
    "commercial": [...],
    "derivative": [...],
    "nft": [...],
    "sharealike": [...]
  },
  "licenses": [...]
}
```

## 🎨 前端组件

### 1. LicenseSelectorButton
授权选项按钮

```tsx
import { LicenseSelectorButton } from '@/components/whichwitch/license-selector-button'

<LicenseSelectorButton
  onLicenseSelect={(license) => {
    console.log('Selected:', license)
  }}
  initialSelection={existingLicense}
  size="default"
/>
```

### 2. LicenseSelectorModal
授权选择弹窗

```tsx
import { LicenseSelectorModal } from '@/components/whichwitch/license-selector-modal'

<LicenseSelectorModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  onSave={(license) => {
    // Save license
  }}
  initialSelection={currentLicense}
/>
```

## 📝 使用流程

### 创作者上传作品

1. **填写作品信息** (标题、描述、标签等)

2. **开启"允许二创"** (Allow Remixing)

3. **配置授权** (License Configuration)
   - 点击 "AI Advisor" 获取 AI 建议
   - 或点击 "License Options" 手动选择

4. **选择授权选项**
   - A. 商业使用: A1/A2/A3
   - B. 二次创作: B1/B2
   - C. NFT 铸造: C1/C2
   - D. 相同协议: D1/D2

5. **查看生成的协议**
   - 系统自动匹配对应的 CC 协议
   - 显示协议名称和描述
   - 显示选项标签

6. **设置授权费用** (Licensing Fee)
   - 输入 ETH 金额
   - 他人二创时需支付

7. **上传作品**

### 用户查看作品授权

作品详情页显示:
- 📜 License: CC BY-NC-SA
- ✓ Non-commercial derivatives allowed
- ✗ No secondary NFT minting
- ⚖ ShareAlike required
- 💰 License Fee: 0.05 ETH

## 🔧 数据库迁移

运行迁移脚本:

```bash
# 在 Supabase SQL Editor 中运行
src/backend/supabase/migrations/add_license_options.sql
```

这将创建:
- ✅ 3 个表 (license_options, work_licenses, license_option_descriptions)
- ✅ 9 个预定义协议
- ✅ 16 个选项描述
- ✅ 2 个数据库函数
- ✅ 1 个视图 (works_with_licenses)
- ✅ 索引和触发器

## 🧪 测试

### 测试授权选择

```bash
# 启动开发服务器
npm run dev

# 访问上传页面
http://localhost:3000/app/upload

# 测试流程:
1. 开启 "Allow Remixing"
2. 点击 "License Options"
3. 选择各项选项
4. 查看生成的协议
5. 保存并上传
```

### 测试 API

```bash
# 获取所有授权选项
curl http://localhost:3000/api/license/options

# 保存授权
curl -X POST http://localhost:3000/api/license/save \
  -H "Content-Type: application/json" \
  -d '{
    "workId": 1,
    "commercial": "A1",
    "derivative": "B1",
    "nft": "C1",
    "shareAlike": "D2"
  }'

# 获取作品授权
curl http://localhost:3000/api/license/save?workId=1
```

## 📊 授权统计

查询授权使用情况:

```sql
-- 最受欢迎的授权
SELECT 
  license_code,
  license_name,
  COUNT(*) as usage_count
FROM work_licenses
GROUP BY license_code, license_name
ORDER BY usage_count DESC;

-- 商用作品数量
SELECT 
  commercial_use,
  COUNT(*) as count
FROM work_licenses
GROUP BY commercial_use;

-- 允许 NFT 的作品
SELECT COUNT(*) 
FROM work_licenses 
WHERE nft_minting = 'C1';
```

## 🎯 最佳实践

### 创作者建议

1. **开放协议** (CC BY, CC0)
   - 适合希望作品广泛传播
   - 鼓励社区创作
   - 可能获得更多曝光

2. **保护性协议** (CC BY-NC-SA, ARR)
   - 适合商业作品
   - 保留商业权利
   - 控制衍生作品

3. **平衡协议** (CC BY-NC, CC BY-NoNFT)
   - 允许非商业使用
   - 防止过度商业化
   - 保持创作自由

### 授权费用建议

- **新手创作者**: 0.01 - 0.05 ETH
- **知名创作者**: 0.1 - 0.5 ETH
- **顶级作品**: 0.5+ ETH
- **使用 AI Advisor** 获取个性化建议

## 🔮 未来功能

1. **授权模板** - 保存常用授权配置
2. **批量授权** - 为多个作品设置相同授权
3. **授权历史** - 查看授权变更记录
4. **授权分析** - 统计授权使用数据
5. **智能推荐** - 基于作品类型推荐授权
6. **授权市场** - 授权交易和转让

## 📞 支持

- 📖 完整文档: `docs/LICENSE_SYSTEM_GUIDE.md`
- 🗄️ 数据库迁移: `src/backend/supabase/migrations/add_license_options.sql`
- 🎨 组件示例: `components/whichwitch/license-selector-*.tsx`
- 🔌 API 文档: `app/api/license/*/route.ts`

---

**版本**: 1.0.0  
**更新日期**: 2024-12-18  
**状态**: ✅ 生产就绪
