# 投票系统前端实现指南

## 功能概述

实现了一个完整的前端投票系统，包含以下功能：

1. **Profile页面**：作者可以为自己的作品发起投票
2. **Community页面**：显示所有活跃的投票，用户可以参与投票
3. **投票状态管理**：Launch Vote按钮会根据投票状态变化
4. **本地数据存储**：使用localStorage模拟数据库功能

## 核心功能

### 1. 发起投票 (Profile页面)

- 作者在自己的作品上看到"Launch Vote"按钮
- 点击后打开投票创建模态框
- 可以设置投票标题、描述、选项、持续时间和奖励
- 每个作品只能发起一次投票

### 2. 投票状态显示

按钮状态变化：
- **Launch Vote** - 未创建投票时显示
- **Voting Active** - 投票进行中时显示（绿色，禁用）
- **Vote Ended** - 投票结束后显示（灰色，禁用）

### 3. 社区投票 (Community页面)

- 显示所有活跃的投票
- 用户可以为每个选项投票
- 实时显示投票结果和百分比
- 防止重复投票

## 文件结构

```
components/whichwitch/
├── profile-view.tsx          # Profile页面，包含作品展示和投票创建
├── community-view.tsx        # Community页面，显示活跃投票
├── create-voting-modal.tsx   # 创建投票的模态框
├── work-card.tsx            # 作品卡片，包含投票按钮
└── ...

app/
├── voting-demo/             # 演示页面
│   └── page.tsx
└── ...
```

## 数据存储

使用localStorage模拟数据库：

### communityVotings
存储所有投票数据：
```json
[
  {
    "id": 1640995200000,
    "workId": 1,
    "title": "角色设计方向",
    "description": "选择主角的设计风格",
    "options": [
      {
        "id": 1,
        "title": "写实风格",
        "description": "详细逼真的角色设计",
        "vote_count": 5,
        "percentage": 50
      }
    ],
    "work": {
      "work_id": 1,
      "title": "Digital Dreams",
      "image_url": "/placeholder.svg",
      "creator_address": "0x..."
    },
    "status": "active",
    "end_date": "2024-12-27T...",
    "total_votes": 10,
    "total_participants": 8,
    "reward": "0.001 ETH"
  }
]
```

### userVotes
记录用户投票历史：
```json
{
  "0x1234...": [1640995200000, 1640995300000],
  "0x5678...": [1640995200000]
}
```

## 使用方法

### 1. 访问演示页面
```
http://localhost:3000/voting-demo
```

### 2. 创建投票流程
1. 点击"Launch Vote"按钮
2. 填写投票信息：
   - 投票标题
   - 描述（可选）
   - 持续时间（天数）
   - 奖励池（ETH）
   - 2-5个投票选项
3. 点击"Create Vote"创建

### 3. 参与投票流程
1. 在Community页面查看活跃投票
2. 选择想要的选项点击"投票"
3. 查看实时更新的投票结果

## 集成到现有系统

### 1. Profile页面集成
在`profile-view.tsx`中的`WorkDetailTrigger`组件已经集成了投票功能：

```tsx
// 检查投票状态
const [workVotingStatus, setWorkVotingStatus] = useState({
  hasVoting: false,
  votingStatus: undefined,
  votingTitle: undefined
})

// 创建投票处理
const handleCreateVoting = (votingData) => {
  // 保存到localStorage
  // 更新按钮状态
}
```

### 2. Community页面集成
在`community-view.tsx`中的投票标签页已经实现：

```tsx
// 加载活跃投票
const loadActiveVotings = () => {
  const storedVotings = JSON.parse(localStorage.getItem('communityVotings') || '[]')
  // 过滤活跃投票
}

// 处理投票
const handleVote = (votingId, optionId) => {
  // 检查重复投票
  // 更新投票数据
  // 保存用户投票记录
}
```

### 3. WorkCard组件集成
在`work-card.tsx`中添加了投票状态支持：

```tsx
// 新增props
votingStatus?: {
  hasVoting: boolean
  votingStatus?: 'active' | 'ended' | 'upcoming'
  votingTitle?: string
}

// 按钮状态逻辑
{!votingStatus?.hasVoting ? (
  <Button>Launch Vote</Button>
) : votingStatus.votingStatus === 'active' ? (
  <Button disabled>Voting Active</Button>
) : (
  <Button disabled>Vote Ended</Button>
)}
```

## 后续数据库集成

当准备连接真实数据库时，只需要：

1. 替换localStorage操作为API调用
2. 使用之前创建的API端点：
   - `/api/votings/create` - 创建投票
   - `/api/votings/active` - 获取活跃投票
   - `/api/votings/vote` - 提交投票
   - `/api/votings/check-work-voting` - 检查作品投票状态

3. 执行数据库迁移脚本：
   ```sql
   -- 使用 scripts/setup-voting-tables.sql
   ```

## 特性

✅ 作者只能为每个作品发起一次投票  
✅ 投票创建后更新到community active voting  
✅ 作品详情页显示投票状态  
✅ Launch Vote按钮状态变化  
✅ 防止重复投票  
✅ 实时投票结果显示  
✅ 投票过期自动处理  
✅ 响应式设计  
✅ 完整的UI/UX体验  

## 演示数据

系统包含清空演示数据的功能，方便测试不同场景。