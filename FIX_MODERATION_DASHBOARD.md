# 修复 moderation-dashboard.tsx

由于文件系统问题，请手动创建此文件。

## 方法1：从编辑器复制（推荐）

文件内容已经在你的 IDE 编辑器中打开（`components/whichwitch/moderation-dashboard.tsx`），请：

1. 从编辑器中全选并复制内容
2. 在终端运行：
```bash
nano components/whichwitch/moderation-dashboard.tsx
# 粘贴内容
# 按 Ctrl+X, 然后 Y, 然后 Enter 保存
```

## 方法2：使用简化版本（快速修复）

运行以下命令创建一个简化但可用的版本：

```bash
cat > components/whichwitch/moderation-dashboard.tsx << 'ENDOFFILE'
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
  const [moderations, setModerations] = useState<any[]>([])
  const [disputes, setDisputes] = useState<any[]>([])
  const [selectedDispute, setSelectedDispute] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (address) {
      fetchData()
    }
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
        <p className="text-muted-foreground">Please connect your wallet to view moderation dashboard</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="w-8 h-8 text-primary" />
        <div>
          <h2 className="text-2xl font-bold">AI Moderation Dashboard</h2>
          <p className="text-sm text-muted-foreground">
            View content moderation results and copyright disputes
          </p>
        </div>
      </div>

      <Tabs defaultValue="moderations" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="moderations">
            Content Moderation ({moderations.length})
          </TabsTrigger>
          <TabsTrigger value="disputes">
            Copyright Disputes ({disputes.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="moderations" className="space-y-4">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading...</div>
          ) : moderations.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No moderation records found
            </div>
          ) : (
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-3">
                {moderations.map((mod) => (
                  <Card key={mod.id} className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <p className="font-semibold">{mod.work?.title || \`Work #\${mod.work_id}\`}</p>
                        <Badge>{mod.status}</Badge>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-xs">
                        <div className="p-2 bg-muted rounded">
                          <p className="text-muted-foreground">Safety</p>
                          <p className="font-semibold">{mod.overall_safety_score?.toFixed(0)}%</p>
                        </div>
                        <div className="p-2 bg-muted rounded">
                          <p className="text-muted-foreground">NSFW</p>
                          <p className="font-semibold">{mod.nsfw_score?.toFixed(0)}%</p>
                        </div>
                        <div className="p-2 bg-muted rounded">
                          <p className="text-muted-foreground">Violence</p>
                          <p className="font-semibold">{mod.violence_score?.toFixed(0)}%</p>
                        </div>
                        <div className="p-2 bg-muted rounded">
                          <p className="text-muted-foreground">Hate</p>
                          <p className="font-semibold">{mod.hate_score?.toFixed(0)}%</p>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>

        <TabsContent value="disputes" className="space-y-4">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading...</div>
          ) : disputes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No copyright disputes found
            </div>
          ) : (
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-3">
                {disputes.map((dispute) => (
                  <Card key={dispute.id} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <p className="font-semibold">Dispute #{dispute.id}</p>
                        <Badge>{dispute.status}</Badge>
                      </div>
                      {dispute.similarity_score !== null && (
                        <div className="p-3 bg-muted rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium">Overall Similarity</span>
                            <Badge variant="outline">{dispute.similarity_score?.toFixed(1)}%</Badge>
                          </div>
                        </div>
                      )}
                      <Button
                        onClick={() => setSelectedDispute(dispute)}
                        size="sm"
                        variant="outline"
                        className="w-full"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Full Report
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>
      </Tabs>

      <DisputeReportViewer
        isOpen={!!selectedDispute}
        onClose={() => setSelectedDispute(null)}
        dispute={selectedDispute}
      />
    </div>
  )
}
ENDOFFILE
```

## 验证

运行以下命令验证文件已创建：

```bash
ls -lh components/whichwitch/moderation-dashboard.tsx
cat components/whichwitch/moderation-dashboard.tsx | head -20
```

## 测试

```bash
npm run dev
# 访问 http://localhost:3000/app/moderation
```

如果还有问题，请直接在 IDE 中创建文件并从编辑器复制内容。
