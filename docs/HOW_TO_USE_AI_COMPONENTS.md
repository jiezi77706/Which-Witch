# 如何使用 AI 审核组件

## 📍 组件位置

所有组件都已创建在以下位置：

```
components/
├── whichwitch/
│   ├── content-moderation-button.tsx      ✅ 已创建
│   ├── report-copyright-button.tsx        ✅ 已创建
│   ├── copyright-dispute-modal.tsx        ✅ 已创建
│   ├── dispute-report-viewer.tsx          ✅ 已创建
│   └── moderation-dashboard.tsx           ✅ 已创建
└── ui/
    └── progress.tsx                        ✅ 已创建
```

## 🎯 使用场景

### 场景 1: 在上传页面显示内容审核按钮

**位置**: 已集成到 `components/whichwitch/upload-view.tsx`

上传流程会自动触发 AI 内容审核，无需额外操作。

**查看代码**:
```tsx
// 在 upload-view.tsx 的 handleSubmit 函数中
// Step 2: AI Content Moderation (with token staking)
console.log('🛡️ Step 2: AI Content Moderation...')

const moderationResponse = await fetch('/api/ai/content-moderation', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    workId: uploadResult.work.workId,
    imageUrl: uploadResult.work.imageUrl,
    creatorAddress: address,
    stakeAmount: "0.01",
    stakeTxHash: "0x..."
  })
})
```

### 场景 2: 在作品详情页添加举报按钮

**创建文件**: `app/app/work/[id]/page.tsx`

```tsx
"use client"

import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { ReportCopyrightButton } from '@/components/whichwitch/report-copyright-button'

export default function WorkDetailPage() {
  const params = useParams()
  const [work, setWork] = useState<any>(null)

  useEffect(() => {
    // 获取作品详情
    fetch(`/api/works?workId=${params.id}`)
      .then(res => res.json())
      .then(data => setWork(data.works[0]))
  }, [params.id])

  if (!work) return <div>Loading...</div>

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* 作品图片 */}
        <div className="aspect-square rounded-xl overflow-hidden">
          <img 
            src={work.image_url} 
            alt={work.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* 作品信息 */}
        <div className="space-y-4">
          <h1 className="text-3xl font-bold">{work.title}</h1>
          <p className="text-muted-foreground">{work.description}</p>
          
          {/* 创作者信息 */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Creator:</span>
            <span className="text-sm font-mono">
              {work.creator_address?.slice(0, 6)}...{work.creator_address?.slice(-4)}
            </span>
          </div>

          {/* 举报按钮 - 这里！ */}
          <div className="flex gap-3">
            <ReportCopyrightButton
              accusedWorkId={work.work_id}
              accusedWorkTitle={work.title}
              accusedWorkImage={work.image_url}
              accusedAddress={work.creator_address}
              variant="outline"
              size="default"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
```

### 场景 3: 在个人资料页显示审核面板

**已创建**: `app/app/moderation/page.tsx` ✅

访问路径: `http://localhost:3000/app/moderation`

```tsx
"use client"

import { ModerationDashboard } from "@/components/whichwitch/moderation-dashboard"

export default function ModerationPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <ModerationDashboard />
    </div>
  )
}
```

### 场景 4: 在广场页面的作品卡片上添加举报按钮

**修改**: `components/whichwitch/square-view.tsx` 或类似的作品列表组件

```tsx
import { ReportCopyrightButton } from '@/components/whichwitch/report-copyright-button'

// 在作品卡片中添加
<div className="work-card">
  <img src={work.image_url} alt={work.title} />
  <div className="work-info">
    <h3>{work.title}</h3>
    <p>{work.creator_address}</p>
    
    {/* 添加举报按钮 */}
    <ReportCopyrightButton
      accusedWorkId={work.work_id}
      accusedWorkTitle={work.title}
      accusedWorkImage={work.image_url}
      accusedAddress={work.creator_address}
      size="sm"
      variant="ghost"
    />
  </div>
</div>
```

## 🔗 添加导航链接

### 在主导航中添加审核面板链接

**修改**: `app/layout.tsx` 或导航组件

```tsx
<nav>
  <Link href="/app">Home</Link>
  <Link href="/app/upload">Upload</Link>
  <Link href="/app/moderation">Moderation</Link>  {/* 新增 */}
  <Link href="/app/profile">Profile</Link>
</nav>
```

## 📱 完整使用示例

### 示例 1: 简单的作品详情页

创建 `app/app/work/[id]/page.tsx`:

```tsx
"use client"

import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { Button } from '@/components/ui/button'
import { ReportCopyrightButton } from '@/components/whichwitch/report-copyright-button'
import { ContentModerationButton } from '@/components/whichwitch/content-moderation-button'

export default function WorkDetailPage() {
  const params = useParams()
  const { address } = useAccount()
  const [work, setWork] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchWork()
  }, [params.id])

  const fetchWork = async () => {
    try {
      const res = await fetch(`/api/works?workId=${params.id}`)
      const data = await res.json()
      setWork(data.works[0])
    } catch (error) {
      console.error('Failed to fetch work:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    )
  }

  if (!work) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Work not found</p>
      </div>
    )
  }

  const isOwner = address?.toLowerCase() === work.creator_address?.toLowerCase()

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* 作品展示 */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* 左侧：图片 */}
          <div className="space-y-4">
            <div className="aspect-square rounded-xl overflow-hidden border">
              <img 
                src={work.image_url} 
                alt={work.title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* 右侧：信息和操作 */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">{work.title}</h1>
              <p className="text-muted-foreground">{work.description}</p>
            </div>

            {/* 创作者 */}
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Creator</p>
              <p className="font-mono text-sm">
                {work.creator_address?.slice(0, 6)}...{work.creator_address?.slice(-4)}
              </p>
            </div>

            {/* 标签 */}
            {work.tags && work.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {work.tags.map((tag: string) => (
                  <span key={tag} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* 操作按钮 */}
            <div className="space-y-3">
              {/* 如果是作品所有者，显示内容审核按钮 */}
              {isOwner && (
                <ContentModerationButton
                  workId={work.work_id}
                  imageUrl={work.image_url}
                  creatorAddress={work.creator_address}
                  onModerationComplete={(result) => {
                    console.log('Moderation result:', result)
                  }}
                />
              )}

              {/* 如果不是所有者，显示举报按钮 */}
              {!isOwner && address && (
                <ReportCopyrightButton
                  accusedWorkId={work.work_id}
                  accusedWorkTitle={work.title}
                  accusedWorkImage={work.image_url}
                  accusedAddress={work.creator_address}
                />
              )}

              {/* 其他操作按钮 */}
              <Button variant="outline" className="w-full">
                Collect
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
```

### 示例 2: 在现有的 app-container 中集成

如果你有一个 `app-container.tsx`，可以这样添加：

```tsx
import { ModerationDashboard } from '@/components/whichwitch/moderation-dashboard'

// 在你的视图切换中添加
const views = {
  square: <SquareView />,
  upload: <UploadView />,
  saved: <SavedView />,
  moderation: <ModerationDashboard />,  // 新增
}

// 在导航中添加
<button onClick={() => setView('moderation')}>
  Moderation
</button>
```

## 🎨 自定义样式

### 修改按钮样式

```tsx
<ReportCopyrightButton
  accusedWorkId={work.id}
  accusedWorkTitle={work.title}
  accusedWorkImage={work.image_url}
  accusedAddress={work.creator_address}
  size="lg"              // sm | default | lg
  variant="destructive"  // default | outline | ghost | destructive
/>
```

### 修改颜色主题

在组件文件中修改颜色类：

```tsx
// 原创作品边框 - 绿色
<div className="border-2 border-green-500/30">

// 被指控作品边框 - 红色
<div className="border-2 border-red-500/30">

// 可以改成你喜欢的颜色
<div className="border-2 border-blue-500/30">
```

## 🧪 测试组件

### 1. 测试审核面板

```bash
# 启动开发服务器
npm run dev

# 访问
http://localhost:3000/app/moderation
```

### 2. 测试 API

```bash
# 运行测试脚本
node scripts/testing/test-ai-moderation.js
```

### 3. 手动测试流程

1. **上传作品** → 自动触发内容审核
2. **查看审核结果** → 访问 `/app/moderation`
3. **举报作品** → 在作品详情页点击举报按钮
4. **查看争议报告** → 在审核面板查看

## 📋 检查清单

- [ ] 所有组件文件都存在
- [ ] 环境变量已配置（QWEN_API_KEY）
- [ ] 数据库迁移已运行
- [ ] 创建了作品详情页
- [ ] 创建了审核面板页
- [ ] 添加了导航链接
- [ ] 测试了上传流程
- [ ] 测试了举报功能
- [ ] 测试了审核面板

## 🔍 验证组件存在

运行以下命令验证所有文件：

```bash
# 检查组件文件
ls -la components/whichwitch/ | grep -E "(moderation|copyright|dispute|report)"

# 检查 API 文件
ls -la app/api/ai/

# 检查页面文件
ls -la app/app/moderation/
```

## 🚀 快速部署步骤

1. **确认文件存在**
```bash
ls components/whichwitch/content-moderation-button.tsx
ls components/whichwitch/report-copyright-button.tsx
ls components/whichwitch/moderation-dashboard.tsx
```

2. **创建审核页面**（已完成）
```bash
ls app/app/moderation/page.tsx
```

3. **添加到导航**
在你的主导航组件中添加链接到 `/app/moderation`

4. **测试**
```bash
npm run dev
# 访问 http://localhost:3000/app/moderation
```

## 💡 常见问题

### Q: 为什么看不到组件？

A: 确保：
1. 文件路径正确
2. 导入语句正确
3. 开发服务器已重启
4. 没有 TypeScript 错误

### Q: 如何在现有页面中使用？

A: 只需导入并使用：
```tsx
import { ReportCopyrightButton } from '@/components/whichwitch/report-copyright-button'

<ReportCopyrightButton {...props} />
```

### Q: 组件需要什么依赖？

A: 所有依赖都已安装：
- @radix-ui/react-progress ✅
- @radix-ui/react-dialog ✅
- @radix-ui/react-tabs ✅
- wagmi ✅
- lucide-react ✅

## 📞 获取帮助

如果遇到问题：
1. 检查控制台错误
2. 查看 `docs/AI_MODERATION_SYSTEM.md`
3. 运行测试脚本
4. 检查数据库连接

---

**所有组件都已创建并可以使用！** 🎉

只需要：
1. 访问 `/app/moderation` 查看审核面板
2. 在作品详情页添加举报按钮
3. 上传作品会自动触发审核
