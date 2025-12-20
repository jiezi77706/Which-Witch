# AI版权检测修复文档

## 问题诊断

之前AI版权检测显示0%相似度的原因：
- **Qwen API无法直接访问IPFS网关的图片URL**
- 错误信息：`Download the media resource timed out`

## 解决方案

使用**Base64编码**方法：
1. 服务器先下载IPFS图片
2. 转换为Base64格式
3. 发送给Qwen API进行分析

## 测试结果

✅ **Base64方法测试成功**：
- 相同图片检测：100%相似度
- AI正确识别：critical风险等级
- 自动锁定触发：auto_lock建议

## 实现细节

### 1. 图片下载函数
```typescript
async function downloadImageAsBase64(imageUrl: string): Promise<string> {
  const response = await fetch(imageUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  })
  
  const arrayBuffer = await response.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const base64 = buffer.toString('base64')
  const mimeType = response.headers.get('content-type') || 'image/jpeg'
  
  return `data:${mimeType};base64,${base64}`
}
```

### 2. AI分析改进
- 下载并转换图片为Base64
- 清理AI响应中的markdown标记
- 智能提取JSON数据
- 详细的错误日志

### 3. 自动锁定逻辑
```typescript
if (analysis.overallSimilarity >= 80 && analysis.plagiarismRisk === 'critical') {
  // 自动锁定抄袭者资金
  await lockUserFunds(accusedAddress, reason, disputeId)
}
```

## 使用方法

### 1. 确保环境变量配置
```bash
# Qwen AI API
QWEN_API_KEY=sk-...
QWEN_API_URL=https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=...
```

### 2. 运行数据库迁移
```bash
# 执行自动锁定字段迁移
psql -h your-host -U your-user -d your-db -f src/backend/supabase/migrations/add_auto_lock_fields.sql
```

### 3. 测试AI分析
```bash
# 测试Qwen API和Base64方法
node scripts/testing/test-qwen-api.js
```

### 4. 测试完整流程
```bash
# 测试举报和自动锁定
node scripts/testing/test-auto-lock-system.js
```

## API使用示例

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
    disputeReason: 'Copyright Infringement / Plagiarism',
    evidenceDescription: '描述',
    evidenceUrls: ['https://...']
  })
})

const result = await response.json()
// result.analysis.overallSimilarity - 相似度
// result.autoLock.triggered - 是否触发自动锁定
// result.autoLock.success - 锁定是否成功
```

## 预期结果

### 相同图片（100%相似）
```json
{
  "analysis": {
    "overallSimilarity": 100,
    "plagiarismRisk": "critical",
    "aiRecommendation": "auto_lock",
    "aiConclusion": "These images are identical - 100% plagiarism"
  },
  "autoLock": {
    "triggered": true,
    "success": true,
    "txHash": "0x..."
  }
}
```

### 不同图片（低相似度）
```json
{
  "analysis": {
    "overallSimilarity": 15,
    "plagiarismRisk": "low",
    "aiRecommendation": "dismiss"
  },
  "autoLock": {
    "triggered": false
  }
}
```

## 故障排除

### 1. AI分析返回0%
- **原因**: 图片下载失败或API调用失败
- **检查**: 服务器日志中的错误信息
- **解决**: 确保IPFS网关可访问，API密钥正确

### 2. 自动锁定未触发
- **原因**: 相似度低于80%阈值
- **检查**: `analysis.overallSimilarity` 值
- **解决**: 调整阈值或检查AI分析结果

### 3. 数据库错误
- **原因**: 缺少新增字段
- **检查**: 运行数据库迁移
- **解决**: 执行 `add_auto_lock_fields.sql`

## 性能优化

### 图片大小限制
- 建议：< 5MB
- 原因：Base64编码会增加约33%大小
- 优化：可以在下载后压缩图片

### API调用优化
- 批量处理：避免频繁调用
- 缓存结果：相同图片对不重复分析
- 超时设置：避免长时间等待

## 安全考虑

1. **API密钥保护**: 仅在服务器端使用
2. **图片验证**: 检查图片格式和大小
3. **速率限制**: 防止API滥用
4. **日志记录**: 记录所有分析请求

## 下一步

1. ✅ Base64图片方法已实现
2. ✅ AI分析改进完成
3. ✅ 自动锁定逻辑完成
4. ⏳ 数据库迁移待执行
5. ⏳ 前端集成待测试
6. ⏳ 生产环境部署

## 相关文件

- `app/api/ai/copyright-dispute/route.ts` - 主要API
- `scripts/testing/test-qwen-api.js` - AI测试
- `scripts/testing/test-auto-lock-system.js` - 完整测试
- `src/backend/supabase/migrations/add_auto_lock_fields.sql` - 数据库迁移
- `AUTO_LOCK_SYSTEM_IMPLEMENTATION.md` - 系统文档