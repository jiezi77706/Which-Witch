# Qwen API 配置说明

## 问题诊断

你之前使用的是**错误的API端点**：
```bash
❌ QWEN_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
```

这是**OpenAI兼容模式**，只支持文本处理，**不支持图片分析**！

## 正确配置

### 1. 环境变量配置

在 `.env.local` 中使用：
```bash
✅ QWEN_API_URL=https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation
✅ QWEN_API_KEY=sk-b25e0402c60f4fe99dbb37eaa2659693
```

### 2. API端点对比

| 端点类型 | URL | 支持功能 | 用途 |
|---------|-----|---------|------|
| **多模态API** ✅ | `/api/v1/services/aigc/multimodal-generation/generation` | 文本 + 图片 | 图片分析、版权检测 |
| **兼容模式** ❌ | `/compatible-mode/v1` | 仅文本 | OpenAI兼容接口 |

### 3. 使用的模型

```javascript
model: 'qwen-vl-max'  // Qwen Vision-Language 多模态模型
```

这个模型支持：
- ✅ 图片理解和分析
- ✅ 图片相似度比较
- ✅ 视觉内容描述
- ✅ 多图片对比

## 测试验证

### 1. 测试API连接
```bash
node scripts/testing/test-qwen-api.js
```

**预期结果**：
```
✅ Base64图片分析测试成功
🤖 AI响应文本: {
  "overallSimilarity": 100,
  "plagiarismRisk": "critical",
  ...
}
```

### 2. 测试完整流程
```bash
node scripts/testing/test-auto-lock-system.js
```

## API请求示例

### 正确的请求格式
```javascript
{
  "model": "qwen-vl-max",
  "input": {
    "messages": [
      {
        "role": "user",
        "content": [
          { "image": "data:image/jpeg;base64,/9j/4AAQ..." },  // Base64图片
          { "image": "data:image/jpeg;base64,/9j/4AAQ..." },  // Base64图片
          { "text": "Compare these two images..." }
        ]
      }
    ]
  },
  "parameters": {
    "result_format": "message"
  }
}
```

### API响应格式
```javascript
{
  "output": {
    "choices": [
      {
        "message": {
          "content": [
            {
              "text": "{\"overallSimilarity\": 100, ...}"
            }
          ]
        }
      }
    ]
  }
}
```

## 常见问题

### Q1: 为什么之前显示0%相似度？
**A**: 使用了错误的API端点（兼容模式），不支持图片分析。

### Q2: Base64方法是必需的吗？
**A**: 是的，因为Qwen API无法直接访问IPFS网关的图片URL。

### Q3: 图片大小限制？
**A**: 建议 < 5MB，Base64编码后会增加约33%大小。

### Q4: API调用费用？
**A**: 根据阿里云DashScope的定价，按token计费。图片分析比纯文本贵。

## 重启应用

修改环境变量后，需要重启开发服务器：

```bash
# 停止当前服务器 (Ctrl+C)
# 重新启动
npm run dev
```

## 验证配置

运行测试脚本验证配置是否正确：

```bash
# 1. 测试API连接
node scripts/testing/test-qwen-api.js

# 2. 检查环境变量
node -e "require('dotenv').config({path:'.env.local'}); console.log('QWEN_API_URL:', process.env.QWEN_API_URL)"
```

**正确输出**：
```
QWEN_API_URL: https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation
```

## 相关文档

- [阿里云DashScope文档](https://help.aliyun.com/zh/dashscope/)
- [Qwen-VL模型说明](https://help.aliyun.com/zh/dashscope/developer-reference/qwen-vl-plus)
- [多模态API参考](https://help.aliyun.com/zh/dashscope/developer-reference/api-details-9)

## 下一步

1. ✅ 修改环境变量配置
2. ⏳ 重启开发服务器
3. ⏳ 运行测试脚本验证
4. ⏳ 尝试举报功能
5. ⏳ 查看AI分析结果