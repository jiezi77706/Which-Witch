"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Trophy, Star, Sparkles, Gift } from "lucide-react"
import { useAccount } from "wagmi"

interface FanRewardNFT {
  id: string
  votingId: string
  workTitle: string
  workImage: string
  creatorAddress: string
  fanAddress: string
  gradient: string
  borderColor: string
  rewardType: 'winner'
  mintedAt: string
  isTransferable: false
}

interface FanRewardNFTProps {
  fanAddress: string
  onClaimReward?: (nftData: FanRewardNFT) => void
}

// 生成简单明亮的渐变色
function generateGradientColors(address: string): { 
  gradient: string; 
  borderColor: string;
} {
  // 预定义的漂亮渐变色组合
  const gradients = [
    { gradient: 'linear-gradient(135deg, #ff6b9d 0%, #c44569 100%)', border: '#ff6b9d' }, // 粉红
    { gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', border: '#4facfe' }, // 蓝色
    { gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', border: '#43e97b' }, // 绿色
    { gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', border: '#fa709a' }, // 粉黄
    { gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', border: '#a8edea' }, // 薄荷粉
    { gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)', border: '#fcb69f' }, // 橙色
    { gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: '#667eea' }, // 紫色
    { gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', border: '#f093fb' }, // 紫红
  ]
  
  if (!address) {
    return {
      gradient: gradients[0].gradient,
      borderColor: gradients[0].border
    }
  }

  // 简单的字符串哈希函数，适用于任何字符串
  let hash = 0
  for (let i = 0; i < address.length; i++) {
    const char = address.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // 转换为32位整数
  }
  
  // 确保是正数并取模
  const index = Math.abs(hash) % gradients.length
  
  return {
    gradient: gradients[index].gradient,
    borderColor: gradients[index].border
  }
}

export function FanRewardNFT({ fanAddress, onClaimReward }: FanRewardNFTProps) {
  const { address } = useAccount()
  const [rewardNFTs, setRewardNFTs] = useState<FanRewardNFT[]>([])
  const [pendingRewards, setPendingRewards] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (fanAddress) {
      loadFanRewards()
    }
  }, [fanAddress])

  const loadFanRewards = async () => {
    setLoading(true)
    try {
      // 为每个 NFT 分配固定的背景色（基于 votingId）
      const mockRewards: FanRewardNFT[] = [
        {
          id: "reward-1",
          votingId: "vote-1",
          workTitle: "Pink Hair Anime Girl",
          workImage: "/img_9046.jpg", // 保持第一张原图
          creatorAddress: "0x1234...5678",
          fanAddress: fanAddress,
          gradient: generateGradientColors("vote-1").gradient, // 基于 votingId
          borderColor: generateGradientColors("vote-1").borderColor,
          rewardType: 'winner',
          mintedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
          isTransferable: false
        },
        {
          id: "reward-2",
          votingId: "vote-2",
          workTitle: "Cat Ear Character",
          workImage: "/img_9045.jpg", // 保持第二张原图
          creatorAddress: "0xabcd...efgh",
          fanAddress: fanAddress,
          gradient: generateGradientColors("vote-2").gradient, // 基于 votingId
          borderColor: generateGradientColors("vote-2").borderColor,
          rewardType: 'winner',
          mintedAt: new Date(Date.now() - 86400000 * 7).toISOString(),
          isTransferable: false
        },
        {
          id: "reward-3",
          votingId: "vote-3",
          workTitle: "Magical Portrait",
          workImage: "/IMG_88DDEB20DB06-1.jpeg", // 使用新图片1
          creatorAddress: "0x5555...6666",
          fanAddress: fanAddress,
          gradient: generateGradientColors("vote-3").gradient, // 基于 votingId
          borderColor: generateGradientColors("vote-3").borderColor,
          rewardType: 'winner',
          mintedAt: new Date(Date.now() - 86400000 * 10).toISOString(),
          isTransferable: false
        }
      ]

      const mockPending = [
        {
          votingId: "vote-4",
          workTitle: "Magical Girl Portrait",
          workImage: "/IMG_F4DF4C7DEC0F-1.jpeg", // 使用新图片2
          creatorAddress: "0x9999...1111",
          rewardType: 'winner',
          canClaim: true
        }
      ]

      setRewardNFTs(mockRewards)
      setPendingRewards(mockPending)
    } catch (error) {
      console.error('Failed to load fan rewards:', error)
    } finally {
      setLoading(false)
    }
  }

  const claimReward = async (pendingReward: any) => {
    try {
      // 使用 votingId 生成颜色，确保 claim 前后颜色一致
      const colors = generateGradientColors(pendingReward.votingId)
      
      const newNFT: FanRewardNFT = {
        id: `reward-${Date.now()}`,
        votingId: pendingReward.votingId,
        workTitle: pendingReward.workTitle,
        workImage: pendingReward.workImage,
        creatorAddress: pendingReward.creatorAddress,
        fanAddress: fanAddress,
        gradient: colors.gradient,
        borderColor: colors.borderColor,
        rewardType: 'winner',
        mintedAt: new Date().toISOString(),
        isTransferable: false
      }

      setRewardNFTs(prev => [...prev, newNFT])
      setPendingRewards(prev => prev.filter(r => r.votingId !== pendingReward.votingId))

      if (onClaimReward) {
        onClaimReward(newNFT)
      }

      console.log('✅ Fan reward NFT claimed:', newNFT)
    } catch (error) {
      console.error('Failed to claim reward:', error)
      alert('Failed to claim reward. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          Fan Reward NFTs
        </h3>
        <div className="animate-pulse space-y-3">
          <div className="h-32 bg-muted rounded-lg"></div>
          <div className="h-32 bg-muted rounded-lg"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          Fan Reward NFTs
        </h3>
        <Badge variant="secondary" className="flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          {rewardNFTs.length} Collected
        </Badge>
      </div>

      {/* Pending Rewards */}
      {pendingRewards.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-semibold text-sm text-green-600 flex items-center gap-2">
            <Gift className="w-4 h-4" />
            Claimable Rewards
          </h4>
          {pendingRewards.map((reward) => {
            // 使用 votingId 生成颜色，确保与 claim 后的颜色一致
            const colors = generateGradientColors(reward.votingId)
            return (
              <Card key={reward.votingId} className="border-green-500/30 bg-green-500/5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="relative flex-shrink-0">
                      <div 
                        className="w-20 h-20 rounded-full border-2 flex items-center justify-center shadow-lg"
                        style={{ 
                          backgroundImage: colors.gradient,
                          borderColor: colors.borderColor
                        }}
                      >
                        <div className="w-16 h-16 rounded-full overflow-hidden">
                          <img 
                            src={reward.workImage} 
                            alt={reward.workTitle}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <h5 className="font-semibold">{reward.workTitle}</h5>
                      <p className="text-sm text-muted-foreground">
                        Voting Winner Reward
                      </p>
                      <Badge variant="outline" className="mt-1 text-xs">
                        Non-Transferable
                      </Badge>
                    </div>
                    
                    <Button
                      onClick={() => claimReward(reward)}
                      className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg"
                    >
                      <Gift className="w-4 h-4 mr-2" />
                      Claim
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Owned NFTs */}
      {rewardNFTs.length > 0 ? (
        <div className="space-y-3">
          <h4 className="font-semibold text-sm text-blue-600 flex items-center gap-2">
            <Star className="w-4 h-4" />
            Your Collection
          </h4>
          <div className="flex flex-wrap gap-4">
            {rewardNFTs.map((nft) => (
              <div key={nft.id} className="relative group">
                {/* 更大的渐变圆圈 */}
                <div 
                  className="w-28 h-28 rounded-full border-2 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer"
                  style={{ 
                    backgroundImage: nft.gradient,
                    borderColor: nft.borderColor
                  }}
                  title={`${nft.workTitle} - Winner NFT (${new Date(nft.mintedAt).toLocaleDateString()})`}
                >
                  {/* 更大的图片 */}
                  <div className="w-20 h-20 rounded-full overflow-hidden">
                    <img 
                      src={nft.workImage} 
                      alt={nft.workTitle}
                      className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : pendingRewards.length === 0 ? (
        <div className="text-center py-12 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-pink-500/5 to-blue-500/5 rounded-2xl" />
          <div className="relative z-10">
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center">
              <Trophy className="w-10 h-10 text-purple-500/60" />
            </div>
            <p className="text-sm font-medium mb-2">No fan reward NFTs yet</p>
            <p className="text-xs text-muted-foreground">
              Participate in community voting to earn beautiful anime NFT rewards! 🎨✨
            </p>
          </div>
        </div>
      ) : null}

      {/* Info Card */}
      <Card className="bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-blue-500/10 border-purple-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-pink-500/20 to-transparent rounded-full blur-2xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-500/20 to-transparent rounded-full blur-2xl" />
        
        <CardContent className="p-4 relative z-10">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <div className="p-1.5 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              About Fan Reward NFTs
            </span>
          </h4>
          <div className="text-sm text-muted-foreground space-y-2">
            <p className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></span>
              Earned by participating in community voting
            </p>
            <p className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-gradient-to-r from-pink-500 to-blue-500 rounded-full"></span>
              Each NFT features work hash + your address hash
            </p>
            <p className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></span>
              These NFTs are non-transferable and represent your contribution
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}