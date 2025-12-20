'use client'

import { useState, useEffect } from 'react'
import { WorkCard } from '@/components/whichwitch/work-card'

// 模拟作品数据，使用我们刚刚添加的测试数据
const mockWork = {
  id: 100,
  work_id: 100,
  title: "The Magical Forest",
  description: "An original fantasy story about a magical forest and its inhabitants",
  story: "In a realm where magic flows like rivers through ancient trees, there exists a forest that holds the secrets of creation itself...",
  images: ["https://example.com/magical-forest.jpg"],
  image: "https://example.com/magical-forest.jpg",
  creator_address: "0x1111111111111111111111111111111111111111",
  author: "Alice Creator",
  createdAt: "2024-01-01",
  created_at: "2024-01-01T00:00:00Z",
  material: ["Digital Story"],
  tags: ["fantasy", "original", "story"],
  allowRemix: true,
  allow_remix: true,
  licenseFee: "0.02",
  license_fee: "0.02",
  isRemix: false,
  is_remix: false,
  parentWorkId: null,
  parent_work_id: null,
  likes: 0,
  like_count: 0,
  remixCount: 4,
  remix_count: 4,
  total_derivatives: 4,
  metadata_uri: "ipfs://QmMagicalForest",
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

export default function TestGenealogyPage() {
  const [isOpen, setIsOpen] = useState(true)

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Creation Genealogy 测试页面</h1>
        
        <div className="mb-6 p-4 bg-muted/50 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">测试说明</h2>
          <p className="text-sm text-muted-foreground mb-2">
            这个页面用于测试Creation Genealogy功能。点击下面的按钮打开作品详情，查看Genealogy部分。
          </p>
          <p className="text-sm text-muted-foreground">
            应该显示：2个Official Continuations + 2个Community Derivatives = 总共4个衍生作品
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => setIsOpen(true)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            打开作品详情 (ID: 100 - The Magical Forest)
          </button>

          <div className="text-sm text-muted-foreground">
            <p><strong>预期结果：</strong></p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>🟢 Original Work: The Magical Forest</li>
              <li>🟣 Official Continuations (2): Chapter 2, Prequel</li>
              <li>🔵 Community Derivatives (2): Forest Creatures, Dark Side</li>
              <li>📊 Statistics: 正确的数量统计</li>
            </ul>
          </div>
        </div>

        {/* WorkCard Modal */}
        <WorkCard
          work={mockWork}
          open={isOpen}
          onOpenChange={setIsOpen}
        />
      </div>
    </div>
  )
}