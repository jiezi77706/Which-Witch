# 快速修复指南

## 问题
`moderation-dashboard.tsx` 文件无法通过工具写入（文件系统权限问题）

## 解决方案

### 选项1：手动创建（最简单）

1. 在终端运行：
```bash
touch components/whichwitch/moderation-dashboard.tsx
code components/whichwitch/moderation-dashboard.tsx
```

2. 从你的 IDE 编辑器中复制内容（文件已打开）

3. 粘贴并保存

### 选项2：使用命令行

在终端运行以下完整命令（复制整个代码块）：

```bash
cat > components/whichwitch/moderation-dashboard.tsx << 'EOF'
"use client"
import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Shield, Eye } from "lucide-react"
import { useAccount } from "wagmi"
import { DisputeReportViewer } from "./dispute-report-viewer"

export function ModerationDashboard() {
  const { address } = useAccount()
  const [moderations, setModerations] = useState([])
  const [disputes, setDisputes] = useState([])
  const [selectedDispute, setSelectedDispute] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (address) fetchData()
  }, [address])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const modResponse = await fetch(\`/api/ai/content-moderation?address=\${address}\`)
      const modData = await modResponse.json()
      setModerations(modData.moderations || [])
      const dispResponse = await fetch(\`/api/ai/copyright-dispute?address=\${address}\`)
      const dispData = await dispResponse.json()
      setDisputes(dispData.disputes || [])
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!address) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Please connect your wallet</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="w-8 h-8 text-primary" />
        <div>
          <h2 className="text-2xl font-bold">AI Moderation Dashboard</h2>
          <p className="text-sm text-muted-foreground">View content moderation and disputes</p>
        </div>
      </div>
      <Tabs defaultValue="moderations" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="moderations">Moderation ({moderations.length})</TabsTrigger>
          <TabsTrigger value="disputes">Disputes ({disputes.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="moderations" className="space-y-4">
          {isLoading ? <div className="text-center py-12">Loading...</div> : 
           moderations.length === 0 ? <div className="text-center py-12">No records</div> :
           <ScrollArea className="h-[600px]">
             <div className="space-y-3">
               {moderations.map((mod) => (
                 <Card key={mod.id} className="p-4">
                   <p className="font-semibold">{mod.work?.title || \`Work #\${mod.work_id}\`}</p>
                   <Badge>{mod.status}</Badge>
                 </Card>
               ))}
             </div>
           </ScrollArea>}
        </TabsContent>
        <TabsContent value="disputes" className="space-y-4">
          {isLoading ? <div className="text-center py-12">Loading...</div> :
           disputes.length === 0 ? <div className="text-center py-12">No disputes</div> :
           <ScrollArea className="h-[600px]">
             <div className="space-y-3">
               {disputes.map((dispute) => (
                 <Card key={dispute.id} className="p-4">
                   <p className="font-semibold">Dispute #{dispute.id}</p>
                   <Button onClick={() => setSelectedDispute(dispute)} size="sm" className="mt-2">
                     <Eye className="w-4 h-4 mr-2" />View Report
                   </Button>
                 </Card>
               ))}
             </div>
           </ScrollArea>}
        </TabsContent>
      </Tabs>
      <DisputeReportViewer isOpen={!!selectedDispute} onClose={() => setSelectedDispute(null)} dispute={selectedDispute} />
    </div>
  )
}
EOF
```

### 验证

```bash
ls -lh components/whichwitch/moderation-dashboard.tsx
npm run dev
```

访问: http://localhost:3000/app/moderation

## 完成！

文件创建后，错误应该消失。所有其他组件都已正常工作。
