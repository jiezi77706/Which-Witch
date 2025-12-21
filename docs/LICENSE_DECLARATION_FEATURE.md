# 授权声明书功能文档

## 功能概述

授权声明书功能允许创作者为其作品生成正式的授权声明文档，基于用户在上传作品时选择的ABCD许可证配置自动生成详细的权限说明。

## 核心特性

### 1. 基于现有许可证选择
- 直接使用作品上传时的ABCD许可证选择器数据
- 无需额外UI，自动从`licenseSelection`对象读取配置
- 支持所有CC许可证类型和自定义配置

### 2. 自动生成声明书内容
声明书包含以下部分：
- **作品基本信息**：标题、类型、作者、钱包地址
- **授权范围**：基于ABCD选择的详细权限说明
  - A: 商业使用权限（A1允许/A2禁止/A3需授权）
  - B: 衍生作品权限（B1允许/B2禁止）
  - C: NFT铸造权限（C1允许/C2禁止）
  - D: 相同授权要求（D1要求/D2不要求）
- **统一禁止条款**：
  - 禁止AI训练
  - 禁止性别歧视与仇恨行为
  - 禁止二次NFT
  - 禁止恶意使用
- **署名要求**：标准署名格式
- **区块链证明**：链上记录和法律效力说明
- **法律责任**：侵权责任和追责权利

### 3. 链上存储
- 声明书内容存储在数据库
- 支持IPFS内容哈希（CID）
- 区块链时间戳证明

## 技术架构

### 数据结构

#### LicenseSelection 对象
```typescript
interface LicenseSelection {
  commercial: string;    // A1, A2, A3
  derivative: string;    // B1, B2
  nft: string;          // C1, C2
  shareAlike: string;   // D1, D2
  licenseCode: string;  // 如 "CC BY-NC-SA"
  licenseName: string;  // 如 "CC BY-NC-SA - ShareAlike"
  description: string;  // 许可证描述
}
```

#### 数据库表结构

**works表新增字段：**
```sql
license_selection JSONB  -- 存储完整的许可证选择对象
license_type TEXT        -- 许可证代码（向后兼容）
has_license_declaration BOOLEAN  -- 是否已生成声明书
```

**license_declarations表：**
```sql
CREATE TABLE license_declarations (
    id UUID PRIMARY KEY,
    work_id BIGINT NOT NULL,  -- 链上作品ID
    work_title TEXT NOT NULL,
    work_type TEXT NOT NULL,
    author_name TEXT NOT NULL,
    wallet_address TEXT NOT NULL,
    license_selection JSONB NOT NULL,
    declaration_content TEXT NOT NULL,
    content_hash TEXT,  -- IPFS CID
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### API端点

#### POST /api/license-declaration
创建授权声明书

**请求体：**
```json
{
  "workId": "123",
  "workTitle": "作品标题",
  "workType": "数字插画",
  "authorName": "作者名",
  "walletAddress": "0x...",
  "licenseSelection": {
    "commercial": "A2",
    "derivative": "B1",
    "nft": "C2",
    "shareAlike": "D1",
    "licenseCode": "CC BY-NC-SA",
    "licenseName": "CC BY-NC-SA - ShareAlike",
    "description": "Non-commercial derivatives allowed, must use same license"
  }
}
```

**响应：**
```json
{
  "success": true,
  "declaration": {
    "id": "uuid",
    "workId": "123",
    "content": "声明书内容...",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

#### GET /api/license-declaration?workId=123
获取作品的授权声明书

**响应：**
```json
{
  "success": true,
  "declaration": {
    "id": "uuid",
    "workId": "123",
    "workTitle": "作品标题",
    "licenseSelection": {...},
    "content": "声明书内容...",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### 核心组件

#### 1. LicenseDeclarationLink
显示在作品详情页的授权声明链接组件

**使用方式：**
```tsx
<LicenseDeclarationLink
  workId={work.work_id}
  workTitle={work.title}
  workType={work.type}
  authorName={work.author}
  walletAddress={work.creator_address}
  currentUserWallet={address}
  licenseSelection={work.license_selection}
/>
```

**功能：**
- 显示当前许可证类型和摘要
- 检查是否已生成声明书
- 作者可以生成新声明书
- 点击查看完整声明书

#### 2. 声明书详情页
路径：`/license-declaration/[id]`

**功能：**
- 显示完整的声明书内容（Markdown格式）
- 显示元信息（许可证类型、生成时间、作者地址）
- 支持复制和下载声明书
- 链接回作品页面

### 服务函数

#### generateLicenseDeclaration()
根据作品数据和许可证选择生成声明书内容

#### generateLicenseSummary()
生成许可证的简短摘要（用于卡片显示）

#### isValidLicenseSelection()
验证许可证选择对象是否有效

## 使用流程

### 1. 作品上传时
```
用户上传作品 
  → 选择ABCD许可证配置
  → licenseSelection对象保存到works表
  → 作品创建成功
```

### 2. 生成声明书
```
作者访问作品详情页
  → 看到"生成授权声明书"按钮
  → 点击生成
  → API调用 POST /api/license-declaration
  → 声明书保存到数据库
  → 显示"查看授权声明"链接
```

### 3. 查看声明书
```
任何用户访问作品详情页
  → 看到"作品授权声明"链接
  → 点击链接
  → 跳转到 /license-declaration/[workId]
  → 显示完整声明书内容
```

## 数据库设置

### 运行迁移脚本

在Supabase SQL编辑器中执行：

```bash
# 1. 运行主设置脚本
src/backend/supabase/SETUP_LICENSE_DECLARATIONS.sql

# 或者分别运行：
# 2. 添加license_selection字段到works表
src/backend/supabase/migrations/add_license_selection_to_works.sql

# 3. 创建license_declarations表
src/backend/supabase/migrations/add_license_declarations.sql
```

### 验证设置

执行以下SQL验证表结构：

```sql
-- 检查works表字段
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'works' 
AND column_name IN ('license_selection', 'license_type', 'has_license_declaration');

-- 检查license_declarations表
SELECT * FROM information_schema.tables 
WHERE table_name = 'license_declarations';

-- 检查RLS策略
SELECT * FROM pg_policies 
WHERE tablename = 'license_declarations';
```

## 测试

### 测试页面
访问 `/test-license-declaration` 查看功能演示

**测试内容：**
1. 许可证选择数据展示
2. 声明书预览生成
3. LicenseDeclarationLink组件测试
4. API端点测试

### 手动测试流程

1. **上传作品**
   - 访问上传页面
   - 选择ABCD许可证配置
   - 上传作品

2. **生成声明书**
   - 访问作品详情页
   - 点击"生成授权声明书"
   - 验证生成成功

3. **查看声明书**
   - 点击"作品授权声明"链接
   - 验证内容正确显示
   - 测试复制和下载功能

## 常见问题

### Q: 为什么不能生成声明书？
A: 确保：
- 你是作品的创作者
- 作品已设置许可证类型
- 数据库表已正确创建
- API路由正常工作

### Q: 如何更新已生成的声明书？
A: 目前不支持更新。如需修改，需要：
1. 删除现有声明书记录
2. 重新生成新的声明书

### Q: 声明书的法律效力如何？
A: 声明书包含：
- 区块链时间戳证明
- IPFS内容哈希
- 可作为电子证据提交司法机构

### Q: 如何添加IPFS存储？
A: 在生成声明书后：
1. 将内容上传到IPFS
2. 获取CID
3. 更新`content_hash`字段

## 未来改进

- [ ] 支持多语言声明书
- [ ] 添加PDF导出功能
- [ ] 集成IPFS自动上传
- [ ] 支持声明书版本管理
- [ ] 添加电子签名功能
- [ ] 支持自定义声明书模板

## 相关文件

### 核心文件
- `lib/services/license-declaration.service.ts` - 声明书生成服务
- `app/api/license-declaration/route.ts` - API路由
- `components/whichwitch/license-declaration-link.tsx` - 链接组件
- `app/license-declaration/[id]/page.tsx` - 详情页面

### 数据库文件
- `src/backend/supabase/SETUP_LICENSE_DECLARATIONS.sql` - 完整设置脚本
- `src/backend/supabase/migrations/add_license_selection_to_works.sql` - works表迁移
- `src/backend/supabase/migrations/add_license_declarations.sql` - 声明书表迁移

### 测试文件
- `app/test-license-declaration/page.tsx` - 测试页面

## 支持

如有问题，请查看：
1. 数据库日志
2. API响应错误信息
3. 浏览器控制台错误
4. Supabase RLS策略配置
