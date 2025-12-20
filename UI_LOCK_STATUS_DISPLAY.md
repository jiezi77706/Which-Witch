# 用户锁定状态UI显示系统

## 功能概述

为被锁定的用户提供清晰的UI提示和状态显示，确保用户了解自己的账户状态和限制。

## UI组件架构

### 1. 用户锁定状态组件 (`UserLockStatus`)

**位置**: `components/whichwitch/user-lock-status.tsx`

**功能**:
- 🔍 自动检测用户锁定状态
- 🚨 显示不同级别的警告提示
- 📊 展示详细的锁定信息
- 🔗 提供争议详情链接

**显示内容**:
- **提款禁用警告** (90%+ 相似度)
  - 🚫 红色警告框
  - 禁用原因和时间
  - 争议ID和交易哈希
  - 严重程度标识
- **资金锁定提示** (80-89% 相似度)
  - 🔒 橙色提示框
  - 锁定金额和时间
  - 相似度百分比
  - 争议处理状态

### 2. 提款页面组件 (`WithdrawalPage`)

**位置**: `components/whichwitch/withdrawal-page.tsx`

**功能**:
- 💰 显示账户余额
- 🚫 阻止被禁用用户提款
- ⚠️ 显示锁定资金提示
- 🔒 集成锁定状态检查

**交互逻辑**:
```typescript
// 提款被完全禁用
if (isWithdrawalBlocked) {
  // 显示红色警告，禁用提款按钮
  return <BanWarning />
}

// 部分资金被锁定
if (hasLockedFunds) {
  // 显示橙色提示，允许提取剩余资金
  return <PartialLockWarning />
}
```

### 3. 管理员界面增强 (`LockedUsersDashboard`)

**位置**: `components/whichwitch/admin/locked-users-dashboard.tsx`

**新增功能**:
- 📊 提款禁用用户统计
- 🏷️ 风险等级标识
- 🔧 恢复提款功能按钮
- 📈 相似度百分比显示

## API端点

### 用户锁定状态检查

**端点**: `GET /api/user/lock-status?address={userAddress}`

**响应格式**:
```json
{
  "success": true,
  "status": {
    "isLocked": true,
    "isWithdrawalDisabled": true,
    "lockInfo": {
      "lockedAt": 1640995200000,
      "reason": "Automatic lock due to high plagiarism similarity (85%)",
      "disputeId": 123,
      "lockedAmount": "1000000000000000000",
      "similarityScore": 85,
      "txHash": "0x..."
    },
    "withdrawalInfo": {
      "disabledAt": 1640995200000,
      "reason": "Withdrawal disabled due to extreme plagiarism (95%)",
      "disputeId": 123,
      "severity": "critical",
      "txHash": "0x..."
    }
  }
}
```

## 用户体验流程

### 1. 正常用户
```
登录 → 查看余额 → 输入提款金额 → 确认提款 → 成功
```

### 2. 部分锁定用户 (80-89% 相似度)
```
登录 → 看到橙色提示 → 查看可用余额 → 提取剩余资金 → 成功
     ↓
   显示锁定信息和争议链接
```

### 3. 提款禁用用户 (90%+ 相似度)
```
登录 → 看到红色警告 → 提款按钮被禁用 → 联系管理员
     ↓
   显示禁用原因和争议详情
```

## 视觉设计

### 颜色系统
- 🟢 **绿色**: 正常状态，可用余额
- 🟡 **橙色**: 部分锁定，需要注意
- 🔴 **红色**: 严重问题，功能禁用

### 图标系统
- 🔒 `Lock`: 资金锁定
- 🚫 `Ban`: 提款禁用
- ⚠️ `AlertTriangle`: 警告提示
- 🛡️ `Shield`: 安全保护
- 📊 `DollarSign`: 金额显示

### 状态标识
```tsx
// 严重程度标识
<Badge variant="destructive">极高风险</Badge>
<Badge variant="secondary">高风险</Badge>

// 相似度标识
<Badge variant={score >= 90 ? "destructive" : "secondary"}>
  {score}% 相似度
</Badge>

// 状态标识
<Badge variant="destructive">提款禁用</Badge>
<Badge variant="secondary">资金锁定</Badge>
```

## 响应式设计

### 桌面端
- 完整信息显示
- 详细的警告说明
- 多列布局

### 移动端
- 简化信息显示
- 重要信息优先
- 单列布局

## 实时更新

### 状态检查
```typescript
// 自动检查锁定状态
useEffect(() => {
  if (address) {
    checkLockStatus()
  }
}, [address])

// 手动刷新按钮
<Button onClick={checkLockStatus}>
  刷新状态
</Button>
```

### 状态变化通知
- 锁定状态改变时显示通知
- 争议解决后自动更新
- 管理员操作后实时反馈

## 错误处理

### API错误
```typescript
try {
  const response = await fetch('/api/user/lock-status')
  // 处理响应
} catch (error) {
  // 显示友好的错误信息
  showErrorMessage('无法获取账户状态，请稍后重试')
}
```

### 网络错误
- 显示离线状态
- 提供重试按钮
- 缓存上次状态

## 安全考虑

### 信息保护
- 只显示必要的锁定信息
- 隐藏敏感的争议详情
- 防止信息泄露

### 操作验证
- 管理员操作需要确认
- 重要操作记录日志
- 防止误操作

## 测试用例

### 用户状态测试
```typescript
// 测试正常用户
expect(screen.queryByText('提款已禁用')).not.toBeInTheDocument()

// 测试锁定用户
expect(screen.getByText('部分资金已被锁定')).toBeInTheDocument()

// 测试禁用用户
expect(screen.getByText('提款功能已被禁用')).toBeInTheDocument()
```

### 交互测试
```typescript
// 测试提款按钮状态
const withdrawButton = screen.getByRole('button', { name: /提取/ })
expect(withdrawButton).toBeDisabled() // 禁用用户

// 测试刷新功能
fireEvent.click(screen.getByText('刷新状态'))
expect(mockCheckStatus).toHaveBeenCalled()
```

## 部署清单

- [ ] 部署用户锁定状态组件
- [ ] 更新提款页面
- [ ] 增强管理员界面
- [ ] 配置API端点
- [ ] 测试所有状态显示
- [ ] 验证响应式设计
- [ ] 检查错误处理

## 相关文件

- `components/whichwitch/user-lock-status.tsx` - 用户状态组件
- `components/whichwitch/withdrawal-page.tsx` - 提款页面
- `components/whichwitch/admin/locked-users-dashboard.tsx` - 管理员界面
- `app/api/user/lock-status/route.ts` - 状态检查API
- `app/withdrawal/page.tsx` - 提款页面路由

## 总结

UI锁定状态显示系统为用户提供了：

- **清晰的状态提示**: 用户能立即了解账户限制
- **详细的信息展示**: 包含锁定原因、时间、金额等
- **友好的用户体验**: 渐进式警告，避免突然的功能限制
- **完整的管理功能**: 管理员可以查看和管理所有锁定用户

这个系统确保了版权保护措施的透明度和用户体验的平衡。