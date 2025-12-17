# 🎨 WhichWitch 授权系统

## 📋 概述

完整的创意共享授权系统，支持 9 种 CC 协议和自定义授权配置。

## ✨ 核心功能

### 1. 四维授权配置
- **A. 商业使用**: 允许/禁止/需授权
- **B. 二次创作**: 允许/禁止
- **C. NFT 铸造**: 允许/禁止
- **D. 相同协议**: 要求/不要求

### 2. 9种预定义协议
- CC BY, CC BY-NC, CC BY-NC-SA
- CC BY-NoNFT, CC BY-NC-CR
- All Rights Reserved, Custom Commercial
- CC BY-SA, CC0

### 3. 可视化界面
- 授权选择弹窗
- 实时预览
- 选项标签显示

## 🚀 快速开始

### 1. 运行数据库迁移

```bash
# 在 Supabase SQL Editor 中运行
src/backend/supabase/migrations/add_license_options.sql
```

### 2. 启动开发服务器

```bash
npm run dev
```

### 3. 测试功能

访问: http://localhost:3000/app/upload

1. 开启 "Allow Remixing"
2. 点击 "License Options"
3. 选择授权选项
4. 查看生成的协议
5. 保存并上传

## 📦 文件结构

```
├── src/backend/supabase/migrations/
│   └── add_license_options.sql          # 数据库迁移
├── components/whichwitch/
│   ├── license-selector-button.tsx      # 授权按钮
│   ├── license-selector-modal.tsx       # 选择弹窗
│   └── upload-view.tsx                  # 已集成
├── app/api/license/
│   ├── save/route.ts                    # 保存/获取授权
│   └── options/route.ts                 # 获取选项
└── docs/
    ├── LICENSE_SYSTEM_GUIDE.md          # 完整指南
    ├── LICENSE_SYSTEM_SETUP.md          # 快速设置
    ├── LICENSE_SYSTEM_SUMMARY.md        # 实现总结
    └── LICENSE_SYSTEM_CHECKLIST.md      # 检查清单
```

## 🎯 使用示例

### 创作者选择授权

```typescript
// 1. 点击 License Options 按钮
<LicenseSelectorButton
  onLicenseSelect={(license) => {
    console.log('Selected:', license)
    // license = {
    //   commercial: 'A1',
    //   derivative: 'B1',
    //   nft: 'C1',
    //   shareAlike: 'D2',
    //   licenseCode: 'CC BY',
    //   licenseName: 'CC BY - Attribution'
    // }
  }}
/>

// 2. 保存到数据库
await fetch('/api/license/save', {
  method: 'POST',
  body: JSON.stringify({
    workId: 123,
    ...license
  })
})
```

### 查看作品授权

```typescript
// 获取授权信息
const response = await fetch('/api/license/save?workId=123')
const { license } = await response.json()

// 显示授权
<div>
  <Badge>{license.license_name}</Badge>
  <p>{license.description}</p>
</div>
```

## 📊 授权映射表

| 选择 | 协议 | 说明 |
|------|------|------|
| A1-B1-C1-D2 | CC BY | 最开放，仅需署名 |
| A2-B1-C2-D2 | CC BY-NC | 非商用二创 |
| A2-B1-C2-D1 | CC BY-NC-SA | 非商用+同协议 |
| A1-B1-C2-D2 | CC BY-NoNFT | 允许商用但禁止NFT |
| A3-B1-C2-D2 | CC BY-NC-CR | 商用需单独授权 |
| A2-B2-C2-D2 | All Rights Reserved | 最严格 |
| A1-B2-C2-D2 | Custom Commercial | 商用但不可改 |
| A1-B1-C1-D1 | CC BY-SA | 开放+同协议 |
| A1-B1-C1-D2 | CC0 | 公共领域 |

## 🗄️ 数据库

### 表结构

1. **license_options** - 9个预定义协议
2. **work_licenses** - 作品授权记录
3. **license_option_descriptions** - 16个选项描述

### 函数

1. **save_work_license()** - 保存授权
2. **get_license_by_options()** - 根据选项获取协议

### 视图

1. **works_with_licenses** - 作品+授权信息

## 🔌 API

### POST /api/license/save
保存作品授权

```json
{
  "workId": 123,
  "commercial": "A1",
  "derivative": "B1",
  "nft": "C1",
  "shareAlike": "D2"
}
```

### GET /api/license/save?workId=123
获取作品授权

### GET /api/license/options
获取所有授权选项

## 📖 文档

- 📘 [完整指南](docs/LICENSE_SYSTEM_GUIDE.md) - 详细的功能说明
- 🚀 [快速设置](LICENSE_SYSTEM_SETUP.md) - 5分钟快速开始
- 📊 [实现总结](LICENSE_SYSTEM_SUMMARY.md) - 技术实现细节
- ✅ [检查清单](LICENSE_SYSTEM_CHECKLIST.md) - 部署检查

## 🧪 测试

### 单元测试

```bash
# 测试 API
curl http://localhost:3000/api/license/options
curl http://localhost:3000/api/license/save?workId=1
```

### 集成测试

1. 访问上传页面
2. 开启 Allow Remixing
3. 点击 License Options
4. 选择各项选项
5. 保存并验证

### 数据库测试

```sql
-- 验证协议
SELECT COUNT(*) FROM license_options; -- 应该是 9

-- 验证选项
SELECT COUNT(*) FROM license_option_descriptions; -- 应该是 16

-- 测试函数
SELECT * FROM get_license_by_options('A1', 'B1', 'C1', 'D2');
```

## 🎨 UI 预览

### 上传页面
```
┌─────────────────────────────────┐
│ License Configuration           │
│ ┌─────────┐ ┌─────────┐        │
│ │AI Advisor│ │License  │        │
│ │         │ │Options  │        │
│ └─────────┘ └─────────┘        │
│                                 │
│ ✓ CC BY - Attribution          │
│ [A1] [B1] [C1] [D2]           │
└─────────────────────────────────┘
```

### 授权弹窗
```
┌─────────────────────────────────┐
│ License Options              [X]│
├─────────────────────────────────┤
│ A. Commercial Use               │
│ ● A1 - Allowed                 │
│ ○ A2 - Non-Commercial          │
│ ○ A3 - Authorization Required  │
│                                 │
│ B. Derivative Works             │
│ ● B1 - Allowed                 │
│ ○ B2 - No Derivatives          │
│                                 │
│ ... (C, D 选项)                │
│                                 │
│ ✓ Selected: CC BY              │
│                                 │
│ [Cancel]      [Save License]   │
└─────────────────────────────────┘
```

## 🔧 故障排除

### 问题: 弹窗不显示
```bash
# 检查组件导入
grep "LicenseSelectorButton" components/whichwitch/upload-view.tsx
```

### 问题: 数据库错误
```sql
-- 检查表
\dt license_*

-- 检查函数
\df save_work_license
```

### 问题: API 错误
```bash
# 检查日志
tail -f .next/server.log
```

## 📊 统计查询

### 最受欢迎的协议
```sql
SELECT 
  license_code,
  COUNT(*) as count
FROM work_licenses
GROUP BY license_code
ORDER BY count DESC;
```

### 商用作品统计
```sql
SELECT 
  commercial_use,
  COUNT(*) as count
FROM work_licenses
GROUP BY commercial_use;
```

## 🎯 最佳实践

### 创作者建议

1. **开放作品**: 使用 CC BY 或 CC0
2. **商业作品**: 使用 CC BY-NC 或 All Rights Reserved
3. **社区作品**: 使用 CC BY-SA
4. **实验作品**: 使用 CC BY-NoNFT

### 授权费用建议

- 新手: 0.01 - 0.05 ETH
- 中级: 0.05 - 0.2 ETH
- 高级: 0.2 - 1 ETH
- 使用 AI Advisor 获取建议

## 🔮 未来功能

- [ ] 授权模板
- [ ] 批量设置
- [ ] 授权转让
- [ ] 授权市场
- [ ] 智能合约验证
- [ ] 授权分析仪表板

## 📞 支持

- 📖 文档: `docs/LICENSE_SYSTEM_GUIDE.md`
- 🐛 问题: 检查控制台和数据库日志
- 💬 讨论: 查看实现总结

---

**版本**: 1.0.0  
**状态**: ✅ 生产就绪  
**更新**: 2024-12-18

**开始使用**: 运行数据库迁移，启动开发服务器，访问上传页面！
