# 90%相似度自动禁用提款系统

## 功能概述

当AI检测到作品相似度≥90%时，系统将自动禁用抄袭者的提款功能，提供更严格的版权保护。

## 相似度阈值分级

### 🟢 低风险 (0-79%)
- **行为**: 无自动操作
- **状态**: `analyzing`
- **说明**: 正常处理，可能需要人工审核

### 🟡 高风险 (80-89%)
- **行为**: 🔒 **仅锁定争议资金**
- **状态**: `auto_locked`
- **功能**: 
  - 锁定相关争议的资金
  - 保留用户其他提款权限
  - 记录锁定交易哈希

### 🔴 极高风险 (90-100%)
- **行为**: 🚫 **锁定资金 + 禁用提款**
- **状态**: `withdrawal_disabled`
- **功能**:
  - 锁定所有争议相关资金
  - **完全禁用用户提款功能**
  - 记录锁定和禁用交易哈希
  - 需要管理员手动恢复

## 技术实现

### 1. API增强 (`/api/ai/copyright-dispute`)

```typescript
// 90%+ 相似度自动禁用提款
if (analysis.overallSimilarity >= 90 && analysis.plagiarismRisk === 'critical') {
  // 1. 锁定资金
  const lockResult = await lockUserFunds(accusedAddress, reason, disputeId)
  
  // 2. 禁用提款功能
  const disableResult = await disableUserWithdrawals(accusedAddress, reason, disputeId)
  
  disputeStatus = 'withdrawal_disabled'
}
```

### 2. 版权保护服务增强

新增函数：
- `disableUserWithdrawals()` - 禁用用户提款
- `enableUserWithdrawals()` - 恢复用户提款
- `isUserWithdrawalDisabled()` - 检查提款状态

### 3. 数据库字段扩展

```sql
-- 新增字段
ALTER TABLE copyright_disputes ADD COLUMN withdrawal_disabled BOOLEAN DEFAULT FALSE;
ALTER TABLE copyright_disputes ADD COLUMN withdrawal_disable_tx_hash VARCHAR(66);
ALTER TABLE copyright_disputes ADD COLUMN withdrawal_disable_reason TEXT;
ALTER TABLE copyright_disputes ADD COLUMN withdrawal_disable_timestamp TIMESTAMP WITH TIME ZONE;

-- 新增状态
ALTER TYPE dispute_status ADD VALUE 'withdrawal_disabled';
ALTER TYPE dispute_status ADD VALUE 'critical_risk';
```

## 使用示例

### 创建版权争议

```javascript
const response = await fetch('/api/ai/copyright-dispute', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    reporterAddress: '0x...',
    accusedAddress: '0x...',
    originalWorkId: 1,
    accusedWorkId: 2,
    disputeReason: 'Copyright Infringement / Plagiarism'
  })
})

const result = await response.json()
```

### 90%+ 相似度响应示例

```json
{
  "success": true,
  "analysis": {
    "overallSimilarity": 95,
    "plagiarismRisk": "critical",
    "aiRecommendation": "auto_lock"
  },
  "autoLock": {
    "triggered": true,
    "success": true,
    "txHash": "0x...",
    "withdrawalDisabled": true,
    "withdrawalDisableTxHash": "0x..."
  },
  "message": "CRITICAL: 95% similarity detected. User funds locked and withdrawal disabled."
}
```

### 80-89% 相似度响应示例

```json
{
  "success": true,
  "analysis": {
    "overallSimilarity": 85,
    "plagiarismRisk": "critical"
  },
  "autoLock": {
    "triggered": true,
    "success": true,
    "txHash": "0x...",
    "withdrawalDisabled": false
  },
  "message": "Copyright dispute created and user funds automatically locked due to 85% similarity"
}
```

## 管理功能

### 查看被禁用提款的用户

```javascript
// 检查用户提款状态
const { isDisabled, disableInfo } = await isUserWithdrawalDisabled(userAddress)

if (isDisabled) {
  console.log(`用户提款已禁用: ${disableInfo.reason}`)
  console.log(`禁用时间: ${new Date(disableInfo.disabledAt)}`)
  console.log(`严重程度: ${disableInfo.severity}`)
}
```

### 恢复用户提款权限

```javascript
// 管理员恢复提款功能
const result = await enableUserWithdrawals(userAddress, disputeId)
if (result.success) {
  console.log(`用户提款功能已恢复: ${result.txHash}`)
}
```

## 数据库视图和统计

### 高风险争议视图

```sql
SELECT * FROM high_risk_disputes 
WHERE risk_level LIKE 'CRITICAL%'
ORDER BY similarity_score DESC;
```

### 增强统计函数

```sql
SELECT * FROM get_enhanced_auto_lock_stats();
-- 返回: total_locked_users, withdrawal_disabled_users, critical_cases 等
```

## 安全考虑

### 1. 防误判机制
- 只有 `plagiarismRisk = 'critical'` 且相似度≥90%才触发
- AI置信度验证
- 详细日志记录

### 2. 恢复机制
- 管理员可手动恢复提款权限
- 争议解决后自动恢复
- 完整的操作审计日志

### 3. 渐进式惩罚
- 80-89%: 仅锁定争议资金
- 90-100%: 完全禁用提款
- 避免过度惩罚

## 测试

### 运行测试脚本

```bash
# 测试90%相似度自动禁用
node scripts/testing/test-90-percent-auto-lock.js

# 测试基础Qwen API
node scripts/testing/test-qwen-api.js
```

### 预期测试结果

- ✅ 相同图片: 100%相似度 → 提款禁用
- ✅ 高度相似: 80-89% → 仅资金锁定  
- ✅ 低相似度: <80% → 无自动操作

## 部署清单

- [ ] 运行数据库迁移 `add_auto_lock_fields.sql`
- [ ] 更新智能合约（如果需要）
- [ ] 配置管理员权限
- [ ] 测试完整流程
- [ ] 监控系统日志

## 相关文件

- `app/api/ai/copyright-dispute/route.ts` - 主要API实现
- `lib/web3/services/copyright-protection.service.ts` - 版权保护服务
- `src/backend/supabase/migrations/add_auto_lock_fields.sql` - 数据库迁移
- `scripts/testing/test-90-percent-auto-lock.js` - 测试脚本
- `AI_COPYRIGHT_DETECTION_FIX.md` - 基础版权检测文档

## 总结

90%相似度自动禁用提款系统提供了更严格的版权保护：

- **渐进式惩罚**: 根据相似度严重程度采取不同措施
- **自动化处理**: 减少人工干预，提高响应速度  
- **安全机制**: 防误判和恢复机制确保公平性
- **完整审计**: 所有操作都有详细记录和交易哈希

这个系统能有效威慑抄袭行为，保护原创作者的权益。