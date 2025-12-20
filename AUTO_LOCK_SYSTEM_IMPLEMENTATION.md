# 自动锁定系统实现文档

## 概述

当用户举报作品为"Copyright Infringement / Plagiarism"时，AI代理会自动比较原作品和被举报作品的相似度。如果相似度超过80%，系统会自动锁定抄袭者的合约余额。

## 系统架构

### 1. AI分析引擎
- **服务**: `app/api/ai/copyright-dispute/route.ts`
- **功能**: 使用Qwen-VL多模态AI分析图片和文本相似度
- **分析维度**:
  - 整体相似度 (Overall Similarity)
  - 构图相似度 (Composition Similarity)
  - 色彩相似度 (Color Similarity)
  - 角色相似度 (Character Similarity)
  - 风格相似度 (Style Similarity)
  - 内容相似度 (Content Similarity)
  - 文本相似度 (Text Similarity)

### 2. 自动锁定服务
- **服务**: `lib/web3/services/copyright-protection.service.ts`
- **功能**: 管理用户资金锁定、解锁和转移
- **主要方法**:
  - `lockUserFunds()` - 锁定用户资金
  - `unlockUserFunds()` - 解锁用户资金
  - `transferLockedFunds()` - 转移资金给举报者
  - `isUserFundsLocked()` - 检查锁定状态

### 3. 管理界面
- **组件**: `components/whichwitch/admin/locked-users-dashboard.tsx`
- **API**: `app/api/admin/locked-users/route.ts`
- **功能**: 管理员查看和管理被锁定的用户

## 工作流程

### 1. 举报流程
```
用户举报 → AI分析 → 相似度判断 → 自动锁定（如果>80%）
```

### 2. 自动锁定触发条件
- **相似度阈值**: ≥ 80%
- **风险等级**: critical
- **AI建议**: auto_lock

### 3. 锁定后处理
- 记录锁定交易哈希
- 更新争议状态为 `auto_locked`
- 通知相关方

## API接口

### 创建版权争议
```http
POST /api/ai/copyright-dispute
Content-Type: application/json

{
  "reporterAddress": "0x...",
  "accusedAddress": "0x...",
  "originalWorkId": 1,
  "accusedWorkId": 2,
  "disputeReason": "Copyright Infringement / Plagiarism",
  "evidenceDescription": "描述",
  "evidenceUrls": ["https://..."]
}
```

**响应**:
```json
{
  "success": true,
  "dispute": { ... },
  "analysis": {
    "overallSimilarity": 85,
    "plagiarismRisk": "critical",
    "aiRecommendation": "auto_lock"
  },
  "autoLock": {
    "triggered": true,
    "success": true,
    "txHash": "0x..."
  }
}
```

### 管理锁定用户
```http
GET /api/admin/locked-users
```

```http
POST /api/admin/locked-users
Content-Type: application/json

{
  "action": "unlock", // 或 "transfer"
  "userAddress": "0x...",
  "disputeId": 123,
  "reporterAddress": "0x..." // 仅转移时需要
}
```

## 数据库结构

### 新增字段 (copyright_disputes表)
```sql
-- 相似度分析
content_similarity DECIMAL(5,2) DEFAULT 0,
text_similarity DECIMAL(5,2) DEFAULT 0,
textual_similarities JSONB DEFAULT '[]',
plagiarism_risk VARCHAR(20) DEFAULT 'low',

-- 自动锁定
auto_lock_tx_hash VARCHAR(66),
auto_lock_reason TEXT,
funds_locked_amount BIGINT DEFAULT 0,
lock_timestamp TIMESTAMP WITH TIME ZONE
```

### 新增状态
- `auto_locked` - 自动锁定
- `high_risk` - 高风险但锁定失败

## 配置要求

### 环境变量
```bash
# Qwen AI API
QWEN_API_KEY=sk-...
QWEN_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=...
```

### 智能合约
- 需要部署支持资金锁定的合约
- 当前使用模拟实现，生产环境需要真实合约

## 安全考虑

### 1. 防误锁
- 高置信度阈值 (80%)
- AI多维度分析
- 人工审核机制

### 2. 资金安全
- 锁定而非没收
- 争议解决后可解锁
- 交易记录可追溯

### 3. 权限控制
- 管理员权限验证
- 操作日志记录
- 多重确认机制

## 测试

### 运行测试
```bash
node scripts/testing/test-auto-lock-system.js
```

### 测试场景
1. 高相似度作品自动锁定
2. 低相似度作品不锁定
3. 锁定用户查询
4. 资金解锁
5. 资金转移

## 部署清单

- [ ] 数据库迁移执行
- [ ] AI API配置验证
- [ ] 智能合约部署
- [ ] 管理界面部署
- [ ] 测试流程验证
- [ ] 监控告警配置

## 监控指标

- 自动锁定触发次数
- 平均相似度分数
- 锁定资金总额
- 争议解决时间
- 误锁率统计

## 未来优化

1. **智能合约集成**: 真实的链上锁定机制
2. **多链支持**: 支持不同区块链网络
3. **机器学习优化**: 提高相似度检测准确性
4. **自动化流程**: 减少人工干预需求
5. **用户申诉**: 被锁定用户的申诉机制

## 相关文件

- `app/api/ai/copyright-dispute/route.ts` - 主要API
- `lib/web3/services/copyright-protection.service.ts` - 锁定服务
- `components/whichwitch/admin/locked-users-dashboard.tsx` - 管理界面
- `src/backend/supabase/migrations/add_auto_lock_fields.sql` - 数据库迁移
- `scripts/testing/test-auto-lock-system.js` - 测试脚本