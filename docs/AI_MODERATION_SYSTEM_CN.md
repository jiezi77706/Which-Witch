# AI 内容审核与版权仲裁系统

## 系统概述

WhichWitch 平台的 AI 驱动内容审核和版权仲裁系统，由通义千问 Qwen-VL 多模态 AI 提供支持。

## 核心功能

### 功能1：内容审核（上传时）

**目的**：在发布前自动扫描上传内容，检测违规内容。

**流程**：
1. 创作者上传作品并质押代币
2. Qwen-VL AI 自动扫描内容
3. AI 检测敏感内容：
   - NSFW 内容（裸露、色情内容）
   - 暴力血腥内容
   - 仇恨符号和攻击性图像
4. AI 为每个类别生成安全评分（0-100）
5. 内容被批准、拒绝或标记为需要审查
6. 根据审核结果锁定/解锁质押

**技术指标**：
- NSFW 评分：0-100（越高越危险）
- 暴力评分：0-100
- 仇恨评分：0-100
- 整体安全评分：0-100（越高越安全）

**组件**：
- `ContentModerationButton` - 触发 AI 内容检查
- `app/api/ai/content-moderation/route.ts` - 后端 API
- 数据库表：`content_moderation`

**使用示例**：
```tsx
import { ContentModerationButton } from '@/components/whichwitch/content-moderation-button'

<ContentModerationButton
  workId={123}
  imageUrl="https://..."
  creatorAddress="0x..."
  onModerationComplete={(result) => console.log(result)}
/>
```

### 功能2：版权仲裁（举报时）

**目的**：用户举报抄袭时，AI 驱动的版权争议解决。

**流程**：
1. 用户举报疑似版权侵权
2. 用户填写争议表单并选择原创作品
3. 双方作品立即被锁定
4. Qwen-VL AI 分析两件作品
5. AI 生成综合仲裁报告：
   - 整体相似度评分（0-100%）
   - 构图相似度
   - 配色方案相似度
   - 角色特征相似度
   - 艺术风格相似度
   - 争议区域标注
   - 时间线分析（上传日期）
   - AI 结论和建议

**AI 建议类型**：
- **驳回（Dismiss）**：未检测到明显侵权
- **警告（Warning）**：存在轻微相似，发出警告
- **下架（Takedown）**：存在明显侵权，移除内容
- **赔偿（Compensation）**：确认侵权，给予原创者赔偿

**相似度分析维度**：
1. **整体相似度**：综合评分
2. **构图相似度**：布局、结构对比
3. **配色相似度**：色彩方案、调色板对比
4. **角色相似度**：角色设计、特征对比
5. **风格相似度**：艺术风格、技法对比

**组件**：
- `ReportCopyrightButton` - 举报版权侵权
- `CopyrightDisputeModal` - 提交争议和证据
- `DisputeReportViewer` - 查看 AI 仲裁报告
- `app/api/ai/copyright-dispute/route.ts` - 后端 API
- 数据库表：`copyright_disputes`

**使用示例**：
```tsx
import { ReportCopyrightButton } from '@/components/whichwitch/report-copyright-button'

<ReportCopyrightButton
  accusedWorkId={456}
  accusedWorkTitle="疑似抄袭作品"
  accusedWorkImage="https://..."
  accusedAddress="0x..."
/>
```

### 功能3：审核管理面板

**目的**：集中查看所有审核和争议活动。

**功能**：
- 查看所有内容审核结果
- 跟踪版权争议
- 查看详细 AI 报告
- 监控争议状态

**组件**：
- `ModerationDashboard` - 完整的仪表板 UI

**使用示例**：
```tsx
import { ModerationDashboard } from '@/components/whichwitch/moderation-dashboard'

<ModerationDashboard />
```

## 数据库架构

### content_moderation 表（内容审核）
```sql
- id: 主键
- work_id: 作品 ID（外键）
- creator_address: 创作者钱包地址
- status: 状态（pending | approved | rejected | under_review）
- ai_analysis: 完整 AI 报告（JSONB）
- nsfw_score: NSFW 评分（0-100）
- violence_score: 暴力评分（0-100）
- hate_score: 仇恨评分（0-100）
- overall_safety_score: 整体安全评分（0-100）
- detected_issues: 检测到的问题类型数组
- flagged_content: 具体问题元素
- stake_amount: 质押代币数量
- stake_tx_hash: 区块链交易哈希
- stake_locked: 质押是否锁定
- challenge_period_end: 挑战期结束时间
- created_at, reviewed_at: 时间戳
```

### copyright_disputes 表（版权争议）
```sql
- id: 主键
- reporter_address: 举报者地址
- accused_address: 被指控者地址
- original_work_id: 原创作品 ID
- accused_work_id: 被指控作品 ID
- dispute_reason: 争议原因
- evidence_description: 证据描述
- evidence_urls: 证据链接数组
- status: 状态（pending | analyzing | resolved | dismissed）
- ai_report: 完整 AI 分析（JSONB）
- similarity_score: 整体相似度（0-100）
- composition_similarity: 构图相似度（0-100）
- color_similarity: 配色相似度（0-100）
- character_similarity: 角色相似度（0-100）
- style_similarity: 风格相似度（0-100）
- disputed_regions: 争议区域 JSONB 数组
- timeline_analysis: 时间线分析
- ai_conclusion: AI 结论
- ai_recommendation: AI 建议（dismiss | warning | takedown | compensation）
- confidence_level: AI 置信度（0-100）
- resolution: 最终裁决
- works_locked: 作品是否锁定
- created_at, analyzed_at, resolved_at: 时间戳
```

## API 接口

### 内容审核 API

**POST /api/ai/content-moderation**
提交作品进行 AI 审核

请求体：
```json
{
  "workId": 123,
  "imageUrl": "https://...",
  "creatorAddress": "0x...",
  "stakeAmount": "0.01",
  "stakeTxHash": "0x..."
}
```

响应：
```json
{
  "success": true,
  "moderation": {
    "id": 1,
    "status": "approved",
    "overall_safety_score": 95.5,
    "nsfw_score": 2.1,
    "violence_score": 1.5,
    "hate_score": 0.8,
    "detected_issues": [],
    "stake_locked": false
  },
  "status": "approved",
  "message": "内容已批准！质押将被解锁。"
}
```

**GET /api/ai/content-moderation?address=0x...**
查询地址的所有审核记录

### 版权争议 API

**POST /api/ai/copyright-dispute**
创建版权争议

请求体：
```json
{
  "reporterAddress": "0x...",
  "accusedAddress": "0x...",
  "originalWorkId": 123,
  "accusedWorkId": 456,
  "disputeReason": "该作品抄袭了我的原创构图...",
  "evidenceDescription": "两件作品共享相同的角色姿势、配色和构图元素。",
  "evidenceUrls": ["https://..."]
}
```

响应：
```json
{
  "success": true,
  "dispute": {
    "id": 1,
    "status": "analyzing",
    "similarity_score": 85.5
  },
  "analysis": {
    "overallSimilarity": 85.5,
    "compositionSimilarity": 90.2,
    "colorSimilarity": 78.3,
    "characterSimilarity": 88.1,
    "styleSimilarity": 82.7,
    "disputedRegions": [
      {
        "name": "角色姿势",
        "description": "两件作品中的主角姿势几乎完全相同",
        "similarity": 95
      }
    ],
    "aiConclusion": "经过分析，两件作品在构图、角色设计和配色方案上存在高度相似性...",
    "aiRecommendation": "takedown",
    "confidenceLevel": 87.5
  }
}
```

**GET /api/ai/copyright-dispute?address=0x...**
查询涉及该地址的所有争议

**PATCH /api/ai/copyright-dispute**
解决争议

```json
{
  "disputeId": 1,
  "resolution": "reporter_wins",
  "resolutionDetails": "AI 分析确认存在明显抄袭",
  "resolvedBy": "ai"
}
```

## Qwen-VL 集成

### API 配置

设置环境变量：
```env
QWEN_API_URL=https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation
QWEN_API_KEY=your_api_key_here
```

### 内容审核提示词
```
分析这张图片进行内容审核。检测并评分：
1. NSFW 内容（裸露、色情内容）- 评分 0-100
2. 暴力血腥 - 评分 0-100
3. 仇恨符号和攻击性内容 - 评分 0-100

提供 JSON 格式结果：
- nsfwScore, violenceScore, hateScore
- detectedIssues: 问题类型数组
- flaggedContent: 具体问题元素
- reasoning: 详细解释
```

### 版权分析提示词
```
比较这两件艺术作品进行版权侵权分析。

分析并提供评分（0-100）：
1. 整体相似度
2. 构图相似度
3. 配色相似度
4. 角色相似度
5. 风格相似度

还需提供：
- disputedRegions: 具体相似区域
- timelineAnalysis: 上传日期分析
- aiConclusion: 详细结论
- aiRecommendation: dismiss | warning | takedown | compensation
- confidenceLevel: 0-100
```

## 集成指南

### 步骤1：添加到上传流程

在 `upload-view.tsx` 中，上传后自动触发内容审核：

```tsx
// 上传成功后
const moderationResponse = await fetch('/api/ai/content-moderation', {
  method: 'POST',
  body: JSON.stringify({
    workId: uploadResult.work.workId,
    imageUrl: uploadResult.work.imageUrl,
    creatorAddress: address,
    stakeAmount: "0.01",
    stakeTxHash: txHash
  })
})
```

### 步骤2：在作品详情页添加举报按钮

```tsx
import { ReportCopyrightButton } from '@/components/whichwitch/report-copyright-button'

// 在作品详情页
<ReportCopyrightButton
  accusedWorkId={work.work_id}
  accusedWorkTitle={work.title}
  accusedWorkImage={work.image_url}
  accusedAddress={work.creator_address}
/>
```

### 步骤3：在个人资料添加管理面板

```tsx
import { ModerationDashboard } from '@/components/whichwitch/moderation-dashboard'

// 在用户个人资料或管理面板
<ModerationDashboard />
```

## 测试

### 运行测试脚本
```bash
# 启动开发服务器
npm run dev

# 在另一个终端运行测试
node scripts/testing/test-ai-moderation.js
```

### 手动测试内容审核
```bash
curl -X POST http://localhost:3000/api/ai/content-moderation \
  -H "Content-Type: application/json" \
  -d '{
    "workId": 1,
    "imageUrl": "https://example.com/image.jpg",
    "creatorAddress": "0x123...",
    "stakeAmount": "0.01",
    "stakeTxHash": "0xabc..."
  }'
```

### 手动测试版权争议
```bash
curl -X POST http://localhost:3000/api/ai/copyright-dispute \
  -H "Content-Type: application/json" \
  -d '{
    "reporterAddress": "0x123...",
    "accusedAddress": "0x456...",
    "originalWorkId": 1,
    "accusedWorkId": 2,
    "disputeReason": "该作品抄袭了我的设计"
  }'
```

## 未来增强功能

1. **社区投票**：允许社区对争议进行投票
2. **申诉系统**：让创作者对审核决定提出申诉
3. **信誉系统**：根据审核历史跟踪创作者信誉
4. **自动执行**：自动执行 AI 建议
5. **多语言支持**：支持多语言争议表单
6. **证据上传**：允许上传图片作为证据
7. **实时通知**：通知用户争议更新
8. **分析仪表板**：跟踪审核和争议统计

## 安全考虑

1. **速率限制**：防止滥用审核和争议 API
2. **身份验证**：验证所有操作的钱包签名
3. **质押要求**：要求代币质押以防止垃圾信息
4. **申诉期**：在最终决定前留出申诉时间
5. **证据验证**：验证证据 URL 和内容
6. **AI 置信度阈值**：仅自动执行高置信度决定

## Qwen-VL 核心能力

### 1. 敏感内容检测
- 识别色情、暴力、血腥、裸体等不良内容
- 多维度评分系统
- 详细的问题标注

### 2. 视觉相似度分析
- 多维度对比：构图/色彩/角色/风格
- 区域级别的相似度检测
- 时间线分析能力

### 3. 多模态理解
- 同时分析图片视觉元素和文本描述
- 上下文理解能力
- 综合判断能力

### 4. 结构化报告输出
- 生成 JSON 格式仲裁报告
- 便于链上存储
- 易于前端展示

## 支持

遇到问题或有疑问：
- 检查 API 日志获取错误详情
- 验证 Qwen API 密钥是否有效
- 确保数据库迁移已应用
- 先使用示例图片测试

## 文件清单

### 前端组件
- `components/whichwitch/content-moderation-button.tsx` - 内容审核按钮
- `components/whichwitch/report-copyright-button.tsx` - 举报按钮
- `components/whichwitch/copyright-dispute-modal.tsx` - 争议提交模态框
- `components/whichwitch/dispute-report-viewer.tsx` - 报告查看器
- `components/whichwitch/moderation-dashboard.tsx` - 管理面板
- `components/ui/progress.tsx` - 进度条组件

### 后端 API
- `app/api/ai/content-moderation/route.ts` - 内容审核 API
- `app/api/ai/copyright-dispute/route.ts` - 版权争议 API
- `app/api/works/route.ts` - 作品查询 API

### 数据库
- `src/backend/supabase/migrations/add_ai_moderation_system.sql` - 数据库迁移

### 文档
- `docs/AI_MODERATION_SYSTEM.md` - 英文文档
- `docs/AI_MODERATION_SYSTEM_CN.md` - 中文文档

### 测试
- `scripts/testing/test-ai-moderation.js` - 测试脚本
