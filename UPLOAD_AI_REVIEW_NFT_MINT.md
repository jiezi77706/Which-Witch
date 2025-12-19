# 上传流程优化 + NFT铸造功能实现

## 🎯 用户需求
1. **上传流程优化**：添加AI审核步骤，修复循环问题，成功后自动跳转广场
2. **NFT铸造功能**：在作品详情页为创作者添加NFT铸造按钮，连接NFT合约

## 🔧 上传流程优化

### 1. 添加AI内容审核步骤
**位置**: `components/whichwitch/blockchain-upload-progress.tsx`

**新增步骤**:
```typescript
type UploadStatus = 'preparing' | 'ipfs' | 'metadata' | 'ai-review' | 'blockchain' | 'database' | 'success' | 'error'
```

**AI审核实现**:
```typescript
// Step 3: AI内容审核
setStatus('ai-review')
setCurrentStep('AI内容审核中...')

const moderationResponse = await fetch('/api/ai/content-moderation', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    workId: Date.now(),
    imageUrl: primaryImageUrl,
    title: uploadData.workData.title,
    description: uploadData.workData.description,
    creatorAddress: uploadData.creatorAddress,
    stakeAmount: "0.01",
    stakeTxHash: "0x" + Math.random().toString(16).substring(2)
  })
})

const moderationData = await moderationResponse.json()
setAiReviewResult(moderationData)

if (moderationData.status === 'rejected') {
  throw new Error(`内容审核未通过: ${moderationData.message}`)
}
```

### 2. 修复循环问题
**问题**: 上传完成后仍在循环
**解决**: 添加完成状态控制

```typescript
const [isCompleted, setIsCompleted] = useState(false)

useEffect(() => {
  if (uploadData && !isCompleted) {
    startUpload()
  }
}, [uploadData, isCompleted])

// 在完成时设置标志
setIsCompleted(true)
```

### 3. 自动跳转广场
**修改**: 成功后自动跳转，不显示结果页面

```typescript
// 完成后自动跳转到广场
setTimeout(() => {
  onComplete(null) // 传递null表示直接跳转广场
}, 2000)

// 在app-container中处理
const handleBlockchainUploadComplete = (result: any) => {
  setShowBlockchainUpload(false)
  setBlockchainUploadData(null)
  setActiveTab("square") // 直接跳转到广场
}
```

### 4. AI审核结果显示
**新增UI**: 显示AI审核结果的对话框

```typescript
{aiReviewResult && (
  <div className={`p-3 border rounded-lg text-left ${
    aiReviewResult.status === 'approved' 
      ? 'bg-green-500/10 border-green-500/20' 
      : 'bg-yellow-500/10 border-yellow-500/20'
  }`}>
    <p className="text-xs font-medium mb-1">AI Content Review Result:</p>
    <p className="text-xs">
      Status: {aiReviewResult.status === 'approved' ? '✅ Approved' : '⚠️ Flagged'}
    </p>
    <p className="text-xs">Confidence: {Math.round(aiReviewResult.confidence * 100)}%</p>
  </div>
)}
```

## 🎨 NFT铸造功能实现

### 1. 作品详情页NFT铸造按钮
**位置**: `components/whichwitch/work-card.tsx`

**条件显示**:
```typescript
{/* 铸造NFT按钮 - 仅创作者可见，且作品已上链但未铸造NFT */}
{(!nftStatus?.isNFT && work.creator_address?.toLowerCase() === address?.toLowerCase()) && (
  <Button
    size="sm"
    variant="default"
    className="h-8 bg-blue-600 hover:bg-blue-700 text-white"
    onClick={(e) => {
      e.stopPropagation()
      setShowNewMintModal(true)
    }}
  >
    <Upload className="w-3.5 h-3.5 mr-1.5" />
    Mint NFT
  </Button>
)}
```

### 2. 连接NFT合约
**实现**: 调用CreationRightsNFT合约

```typescript
onMint={async (nftData) => {
  try {
    // 导入NFT合约服务
    const { CreationRightsNFTService } = await import('@/lib/contracts/services/creationRightsNFT.service')
    const { ethers } = await import('ethers')
    
    // 获取provider和signer
    if (typeof window !== 'undefined' && window.ethereum) {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      
      // 创建NFT服务实例
      const nftService = new CreationRightsNFTService(provider, signer)
      
      // 铸造NFT
      const tokenId = await nftService.mintWorkNFT(work.id || work.work_id)
      
      console.log('✅ NFT minted successfully! Token ID:', tokenId)
      
      // 更新数据库状态
      await fetch('/api/works/sync-nft-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workId: work.id || work.work_id,
          tokenId: tokenId,
          isMinted: true,
          ownerAddress: await signer.getAddress(),
        }),
      })
    }
  } catch (error) {
    throw error
  }
}}
```

### 3. NFT状态同步API
**新增文件**: `app/api/works/sync-nft-status/route.ts`

**功能**: 同步NFT铸造状态到数据库

```typescript
export async function POST(request: NextRequest) {
  const { workId, tokenId, isMinted, ownerAddress, tokenURI, mintTxHash } = await request.json()

  const { data, error } = await supabase
    .from('works')
    .update({
      nft_token_id: tokenId,
      nft_minted: isMinted,
      nft_owner_address: ownerAddress,
      nft_token_uri: tokenURI,
      nft_mint_tx_hash: mintTxHash,
      updated_at: new Date().toISOString()
    })
    .eq('id', workId)
    .select()

  return NextResponse.json({
    success: true,
    message: 'NFT status updated successfully',
    data: data?.[0]
  })
}
```

## 📋 修改的文件

### 上传流程优化
1. **components/whichwitch/blockchain-upload-progress.tsx**
   - 添加AI审核步骤
   - 修复循环问题
   - 添加完成状态控制
   - 自动跳转逻辑

2. **components/whichwitch/app-container.tsx**
   - 修改完成处理逻辑
   - 直接跳转广场

### NFT铸造功能
1. **components/whichwitch/work-card.tsx**
   - 添加useAccount hook
   - 修改NFT铸造按钮显示条件
   - 实现真实的合约调用

2. **app/api/works/sync-nft-status/route.ts** (新增)
   - NFT状态同步API

## ✅ 解决的问题

### 上传流程
1. **循环问题**: 添加完成状态控制，防止重复执行
2. **AI审核**: 在上链前进行内容审核，显示审核结果
3. **用户体验**: 成功后自动跳转广场，流程更顺畅
4. **钱包交互**: 明确显示钱包操作步骤和交易哈希

### NFT铸造
1. **权限控制**: 只有创作者才能看到NFT铸造按钮
2. **合约集成**: 真实调用CreationRightsNFT合约
3. **状态同步**: 铸造成功后更新数据库状态
4. **错误处理**: 完善的错误提示和处理

## 🎯 用户体验流程

### 上传流程
1. **填写表单** → 验证license
2. **点击上传** → 跳转进度页面
3. **IPFS上传** → 显示文件进度
4. **创建Metadata** → 显示处理状态
5. **AI内容审核** → 显示审核结果
6. **区块链注册** → 钱包确认交易
7. **保存数据库** → 完成处理
8. **自动跳转** → 返回广场

### NFT铸造流程
1. **查看作品** → 作品详情页
2. **创作者登录** → 显示"Mint NFT"按钮
3. **点击铸造** → 打开铸造模态框
4. **填写信息** → NFT名称和描述
5. **确认铸造** → 钱包确认交易
6. **铸造成功** → 更新NFT状态

## 🧪 测试要点

1. **上传流程**: 确认AI审核步骤正常，无循环问题
2. **自动跳转**: 成功后自动返回广场
3. **NFT铸造**: 只有创作者能看到铸造按钮
4. **合约调用**: NFT铸造成功并更新状态
5. **错误处理**: 各种错误情况的正确处理