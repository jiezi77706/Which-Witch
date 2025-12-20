'use client'

import { useState, useEffect } from 'react'
import { WorkCard } from '@/components/whichwitch/work-card'

// 模拟作品4的数据
const mockWork4 = {
  id: 4,
  work_id: 4,
  title: "Figi",
  description: "A creative work",
  story: "This is the story of Figi...",
  images: ["https://example.com/figi.jpg"],
  image: "https://example.com/figi.jpg",
  creator_address: "0x169f03c4d0c3c4d0e64b194acf024f13c9c7f514",
  author: "0x169f...f514",
  createdAt: "2024-01-01",
  created_at: "2024-01-01T00:00:00Z",
  material: ["Digital Art"],
  tags: ["art", "creative"],
  allowRemix: true,
  allow_remix: true,
  licenseFee: "0.01",
  license_fee: "0.01",
  isRemix: false,
  is_remix: false,
  parentWorkId: null,
  parent_work_id: null,
  likes: 0,
  like_count: 0,
  remixCount: 1,
  remix_count: 1,
  total_derivatives: 1,
  metadata_uri: "ipfs://QmFigi",
  creation_type: "original",
  licenseSelection: {
    commercial: "A1",
    derivative: "B1", 
    nft: "C2",
    shareAlike: "D2",
    licenseName: "CC BY",
    description: "Commercial use, derivatives, and NFT minting allowed"
  }
}

export default function DebugWork4Page() {
  const [isOpen, setIsOpen] = useState(false)
  const [debugInfo, setDebugInfo] = useState<any>(null)

  // 测试直接调用work service
  const testWorkService = async () => {
    try {
      const { getWorkGenealogy } = await import('@/lib/supabase/services/work.service')
      const result = await getWorkGenealogy(4)
      setDebugInfo(result)
      console.log('🧪 Work Service 测试结果:', result)
    } catch (error) {
      console.error('❌ Work Service 测试失败:', error)
      setDebugInfo({ error: error.message })
    }
  }

  useEffect(() => {
    testWorkService()
  }, [])

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">调试作品4的Genealogy显示</h1>
        
        <div className="mb-6 p-4 bg-muted/50 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">问题描述</h2>
          <p className="text-sm text-muted-foreground mb-2">
            作品4 (Figi) 和作品7 (Happy Figi) 有remix关系，但作品7没有在作品4的Creation Genealogy中显示。
          </p>
          <p className="text-sm text-muted-foreground">
            预期：作品4应该显示作品7作为Community Derivative
          </p>
        </div>

        {/* Debug Info */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="text-md font-semibold mb-2">Work Service 测试结果</h3>
          {debugInfo ? (
            <pre className="text-xs bg-white p-2 rounded border overflow-auto">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          ) : (
            <p className="text-sm text-muted-foreground">加载中...</p>
          )}
        </div>

        <div className="space-y-4">
          <button
            onClick={() => setIsOpen(true)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            打开作品4详情 (Figi)
          </button>

          <div className="text-sm text-muted-foreground">
            <p><strong>检查清单：</strong></p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>✅ 数据库中作品7的parent_work_id = 4</li>
              <li>✅ 作品7的creation_type = 'authorized_derivative'</li>
              <li>✅ 作品4的allow_remix = true</li>
              <li>✅ Work Service能正确获取数据</li>
              <li>❓ 前端组件是否正确显示</li>
            </ul>
          </div>
        </div>

        {/* WorkCard Modal */}
        <WorkCard
          work={mockWork4}
          open={isOpen}
          onOpenChange={setIsOpen}
        />
      </div>
    </div>
  )
}