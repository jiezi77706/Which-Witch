# WhichWitch AI授权顾问功能文档

## 📋 功能概述

AI授权顾问是WhichWitch平台的智能助手，为创作者提供专业的作品授权策略建议。通过集成阿里云通义千问(Qwen)大模型，为用户提供实时、个性化的授权咨询服务。

## 🎯 核心功能

### 1. 授权定价建议
- 基于作品类型、市场需求分析合理的授权费用
- 提供价格区间和定价策略
- 考虑Web3和NFT生态的特殊性

### 2. 授权范围设置
- 商用/非商用授权建议
- 衍生作品限制建议
- 地域和时间限制建议

### 3. 风险评估
- 识别潜在的版权风险
- 法律合规性检查
- 市场风险分析

### 4. 市场分析
- 同类作品授权趋势
- 价格行情分析
- 竞争态势评估

### 5. 收益优化
- 长期价值最大化建议
- 授权组合策略
- 收益分配优化

## 🏗️ 技术架构

### 组件结构
```
components/whichwitch/ai-advisor/
├── ai-advisor-button.tsx      # 触发按钮组件
├── ai-advisor-modal.tsx       # 对话弹窗组件
└── index.ts                   # 导出文件
```

### API端点
```
app/api/ai/advisor/
└── route.ts                   # AI顾问API端点
```

### 数据流
```
用户输入 → AI Advisor Button → Modal Dialog → API Endpoint → Qwen API → AI Response → Display
```

## 🔧 技术实现

### 1. 前端组件

#### AIAdvisorButton
触发AI顾问对话的按钮组件
```typescript
<AIAdvisorButton
  workData={{
    title: "作品标题",
    description: "作品描述",
    tags: ["tag1", "tag2"],
    material: ["Digital"],
    allowRemix: true,
    licenseFee: "0.05"
  }}
  size="sm"
  variant="outline"
/>
```

#### AIAdvisorModal
对话界面组件，包含：
- 消息历史显示
- 实时对话功能
- 加载状态处理
- 错误提示
- 快速问题按钮

### 2. API集成

#### Qwen API配置
```typescript
const response = await fetch(`${QWEN_BASE_URL}/chat/completions`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${QWEN_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'qwen-plus',
    messages: conversationHistory,
    temperature: 0.7,
    max_tokens: 2000
  })
})
```

#### 系统提示词
专业的AI顾问角色定义，包含：
- 专业领域说明
- 回答原则
- 输出格式要求
- 语调风格

### 3. 环境配置

在`.env.local`中配置：
```bash
QWEN_API_KEY=sk-your-api-key
QWEN_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
```

## 📱 用户界面

### 对话界面特性
- **清晰的角色区分**: 用户和AI消息使用不同样式
- **实时响应**: 显示加载状态和打字效果
- **快速开始**: 预设常见问题按钮
- **上下文感知**: 自动传递作品信息
- **错误处理**: 友好的错误提示和重试机制

### 快速问题示例
- "帮我分析这个作品的合理授权价格"
- "我应该允许二创吗？有什么风险？"
- "如何设置授权范围保护我的权益？"
- "这类作品的市场行情如何？"

## 🎨 UI设计特点

### 视觉风格
- **渐变背景**: 蓝紫色渐变体现AI科技感
- **图标设计**: Sparkles图标代表AI智能
- **动画效果**: 平滑的消息滑入动画
- **响应式布局**: 适配不同屏幕尺寸

### 交互设计
- **键盘快捷键**: Enter发送，Shift+Enter换行
- **清空对话**: 一键重置对话历史
- **自动滚动**: 新消息自动滚动到底部
- **禁用状态**: 加载时禁用输入

## 🧪 测试

### 运行测试脚本
```bash
node scripts/testing/test-ai-advisor.js
```

### 测试覆盖
- ✅ 环境变量配置检查
- ✅ Qwen API连接测试
- ✅ 授权建议生成测试
- ✅ 响应格式验证
- ✅ API使用统计

## 📊 AI提示词设计

### 系统角色定义
```
你是WhichWitch平台的专业AI授权顾问，专门为创作者提供智能的作品授权策略建议。

专业领域：
1. 授权定价策略
2. 授权范围设置
3. 风险评估
4. 市场分析
5. 收益优化

回答原则：
- 提供具体、可操作的建议
- 考虑Web3和NFT生态特殊性
- 平衡创作者权益和市场接受度
- 使用简洁明了的语言
- 提供多个选项供选择
- 关注长期价值
```

### 输出格式
```
📊 分析要点
💡 具体建议
⚠️ 风险提示
🎯 行动建议
```

## 🚀 集成位置

### 上传页面
在"Licensing Fee"输入框旁边显示AI顾问按钮
```typescript
<AIAdvisorButton
  workData={currentWorkData}
  size="sm"
/>
```

### 未来扩展位置
- 作品详情页
- 授权管理页面
- 收益分析页面
- 市场分析页面

## 💡 使用场景

### 场景1: 新作品定价
创作者上传新作品，不确定如何定价
→ 点击AI建议按钮
→ 询问"这个作品应该如何定价？"
→ AI分析作品特征、市场行情，给出定价建议

### 场景2: 授权范围咨询
创作者想了解是否应该允许二创
→ 打开AI顾问
→ 询问"我应该允许二创吗？有什么风险？"
→ AI分析利弊，提供决策建议

### 场景3: 风险评估
创作者担心授权可能带来的风险
→ 咨询AI顾问
→ 询问"这样设置授权有什么风险？"
→ AI识别潜在风险，提供规避建议

## 🔒 安全考虑

### API密钥保护
- API密钥仅在服务端使用
- 不暴露给前端代码
- 使用环境变量管理

### 数据隐私
- 对话历史仅保留最近10条
- 不永久存储用户对话
- 作品信息仅用于当前会话

### 错误处理
- 友好的错误提示
- 自动重试机制
- 降级方案

## 📈 性能优化

### 响应速度
- 使用流式响应（可选）
- 合理的token限制
- 对话历史截断

### 成本控制
- 限制单次请求token数
- 保留有限对话历史
- 合理的temperature设置

## 🎯 未来增强

### 功能扩展
- [ ] 多语言支持
- [ ] 语音输入/输出
- [ ] 图片分析能力
- [ ] 历史对话保存
- [ ] 个性化建议

### 技术优化
- [ ] 流式响应实现
- [ ] 缓存常见问题
- [ ] A/B测试不同提示词
- [ ] 用户反馈收集
- [ ] 建议质量评估

## 📚 相关文档

- [Qwen API文档](https://help.aliyun.com/zh/dashscope/)
- [WhichWitch上传流程](./UPLOAD_FLOW_OPTIMIZATION_COMPLETE.md)
- [项目结构文档](./PROJECT_STRUCTURE.md)

---

**状态**: ✅ 已完成并集成
**版本**: v1.0
**最后更新**: 2025-12-17