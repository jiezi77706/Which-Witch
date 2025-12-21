# WhichWitch

> *让创作成为一棵能看见自己成长的树*

---
## 愿景
一个OC共创经济平台,在这里把“灵感启发”变成“共同收益”.
🔒 原创保护: 作品上链存证,授权范围清晰可控
💰 自动分润: 智能合约追溯创作链,收益自动分配
🌐 跨链支付: ZetaChain支持多链资产(ETH/BNB/BTC)
🤖 AI审核: Qwen-VL多模态模型检测内容合规性
🤖 Chatbot: Qwen-Plus模型提供授权类型建议
👥 社区治理: 粉丝投票参与创作方向,举报违规

## 🎯 目标用户
**插画师 | 小说家 | 角色设计师**
**同人创作者 | Mod制作者**
**收藏者 | 支持者**

---

##  开发路线图

### V1.0 (✅) - 基础功能
- ✅ "创作→授权→衍生→收益分配→提现"完整流程
- ✅ 打赏、收藏、点赞作品

### V2.0 (✅) - 生态扩展  
- ✅ ZetaChain跨链支付
- ✅ AI Agents 审核
- ✅ 社区投票
- ✅ 举报违规行为
- ✅ 授权自动声明(法律权威与账本权威双集合)


### V3.0 (规划中) - 社区与激励
**即将完善**:
- NFT市场 (作品所有权NFT,与数字谷子发行)
- DAO治理 (抄袭鉴定投票)
- 交易收益权

---

## ⚡ 核心功能解释

### 1️⃣ 多链授权费自动分润系统

```
用户支付 → 智能合约追溯创作链 → 自动分配收益 → 用户提现
```

**🔧 分润规则**
- **原创作品**: 原创者 100%
- **一级衍生**: 原创者 60% (40%+20%) | 直接创作者 40%  
- **多级衍生**: 原创者 40% | 中间层均摊 20% | 直接母作品 40%
- **提现手续费** 平台 3.5% | 提现时扣除 |

**🌐 ZetaChain 跨链支付**
- 支持 ETH/BNB/BTC 等多链资产


### 2️⃣ AI驱动的内容审核与版权争议报告

**🤖 使用模型**: Qwen-VL (多模态模型)

#### 📤 内容审核 (上传时)
```
上传作品 → AI预检 → 通过/拒绝 → 质押上链/重试
```

**🔍 Agent核心能力**
- **敏感内容检测**: 识别NSFW/暴力/血腥/裸体等不良内容
- **视觉相似度分析**: 多维度对比画面构图/色彩风格/关键元素  
- **多模态理解**: 同时分析图片视觉元素和文本描述
- **结构化报告**: 生成JSON格式安全评分+风格标签

**⏰ 审核流程**
- ✅ **通过审核**: 作品上链
- 🔒 **保证金锁定**: 7天挑战期
- 🎁 **无举报**: 自动退回质押Token

#### ⚖️ 初步判定报告 (举报抄袭时)
``` 
用户举报 → 锁定质押 → AI分析对比 → 生成辅助判断报告 → 社区投票
```

**📊 AI仲裁报告内容**
- 整体相似度评分 (0-100%)
- 争议区域标注 (角色特征/配色方案/构图)
- 时间线对比分析
- AI建议结论
** agent 行动流程 (暂未实现)**
- 相似度超过90%,锁定抄袭者合约内的资金,禁用提现功能
- 否则,等待人工仲裁

#### 🤖 智能助手
**🤖 使用模型**: Qwen Plus
- 内置Chatbot辅助用户选择合适的授权类型

### 3️⃣ 社区驱动的创作方向投票

```
创作者对作品节点发起故事走向/新皮肤投票，需质押Token保证产出 → 粉丝质押投票 → 投票结束 → 信用奖励分发 → 限定NFT
```

**🏆 胜出奖励**
- 创作者获得大额奖励Token
- 作品获得"Community Choice"标签  
- 支持胜出选项的粉丝获得限定NFT徽章 (暂未实现)
- NFT设计: 作品缩略图 + 用户ID hash生成随机背景色


---
## 🪜 技术架构

### 技术栈
- **前端**: Next.js 14, React, TailwindCSS
- **区块链**: Ethereum (Sepolia测试网), Zetachain Testnet
- **Web3**: Wagmi, Viem  
- **数据库**: Supabase (PostgreSQL)
- **存储**: IPFS (Pinata)
- **部署**: Vercel (未部署)

### 智能合约架构 v2.0

- **CreationManager** - 作品注册与创作关系追踪
- **AuthorizationManager** - 授权请求处理与权限验证
- **PaymentManager** - 打赏和授权费管理 (合约存储)
- **NFTManager** - ERC721作品所有权NFT
- **NFTMarketplace** - NFT交易与即时版税分配
- **RoyaltyManager** - 统一版税分配逻辑
- **ZetaPaymentManager** - 跨链支付处理器

## 🚀 快速开始

### 环境要求
- Node.js 18+
- MetaMask钱包
- Alchemy API密钥
- Supabase账户
- Pinata账户

### 安装步骤

```bash
# 克隆仓库
git clone https://github.com/iqnuxul/whichWitch.git
cd whichWitch

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 填入你的凭证

# 初始化数据库
# 在Supabase SQL编辑器中运行 src/backend/supabase/schema.sql

# 启动开发服务器
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)

---

## 📁 项目结构

```
whichWitch/
├── 📱 app/                   # Next.js应用路由
│   ├── api/                  # API路由 (IPFS, 用户, 作品)
│   ├── app/                  # 主应用页面
│   └── page.tsx              # 首页
├── 🧩 components/            # React组件
│   ├── ui/                   # 可复用UI组件
│   └── whichwitch/           # 主应用组件
├── 📦 lib/                   # 工具库与集成
│   ├── hooks/                # React钩子
│   ├── services/             # 业务逻辑
│   ├── supabase/             # 数据库操作
│   └── web3/                 # 区块链集成
├── 🔧 scripts/               # 工具脚本
│   └── database/             # 数据库管理
└── 🏗️ src/                   # 源代码
    ├── backend/supabase/     # 数据库迁移
    └── contracts/            # 智能合约 (v2.0)
```

---

## 👥 团队

| 角色 | 成|
|------|------|
| **项目管理&产品开发** | 小圆 |
| **UI设计&前端** | 壳壳 |
| **全栈&合约开发** | 小怪 |
| **数据库&后端** | 佳佳 |
| **项目协调& 美工设计** | Relax |

---

## 📬 联系方式

如有疑问，请通过 [GitHub Issues](https://github.com/iqnuxul/whichWitch/issues) 联系我们。
邮箱: mluxunqi@gmail.com

---

## 📄 开源协议

MIT License - 详见 [LICENSE](LICENSE) 文件

---

**Built by WhichWitch Team ❤️ **
