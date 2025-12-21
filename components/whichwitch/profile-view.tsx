"use client"

import { useState, useEffect } from "react"
import type { UserProfile } from "./app-container"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { WorkCard } from "./work-card"
import { Settings, Share2, Wallet, ArrowUpRight, RefreshCw, Users, Star, Trophy, Activity, TrendingUp, Vote } from "lucide-react"
import { WorkDetailDialog } from "./work-card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useAccount } from "wagmi"
import { formatEther } from "viem"
import { useUser } from "@/lib/hooks/useUser"
import { useWorks } from "@/lib/hooks/useWorks"
import { getCreatorRevenue } from "@/lib/web3/services/contract.service"
import { FanRewardNFT } from "./fan-reward-nft"
import { CreateVotingModal } from "./create-voting-modal"

export function ProfileView({ user, onContinueCreating }: { 
  user: UserProfile
  onContinueCreating?: (workId: number) => void 
}) {
  const { address } = useAccount()
  const { user: dbUser } = useUser()
  const { works, loading: worksLoading } = useWorks(address)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [balance, setBalance] = useState("0")
  const [loadingBalance, setLoadingBalance] = useState(true)
  const [withdrawing, setWithdrawing] = useState(false)
  
  // 新增状态：粉丝数据和信用等级
  const [fanData, setFanData] = useState({
    followers: 1250,
    following: 89,
    totalVotes: 45,
    successfulVotes: 38,
    creditScore: 850,
    creditLevel: "Diamond",
    totalEarned: "2.45",
    monthlyActivity: 78
  })

  useEffect(() => {
    if (address) {
      loadBalance()
    }
  }, [address])

  const loadBalance = async () => {
    if (!address) return
    
    setLoadingBalance(true)
    try {
      console.log('🔍 Loading balance for address:', address)
      console.log('📍 Using contract address:', process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_PAYMENT)
      
      const revenue = await getCreatorRevenue(address)
      console.log('💰 Raw revenue from contract:', revenue.toString(), 'wei')
      
      const formattedBalance = formatEther(revenue)
      console.log('💵 Formatted balance:', formattedBalance, 'ETH')
      
      setBalance(formattedBalance)
    } catch (error) {
      console.error("Error loading balance:", error)
      setBalance("0")
    } finally {
      setLoadingBalance(false)
    }
  }

  const handleWithdraw = async () => {
    if (!address || parseFloat(balance) === 0) return
    
    setWithdrawing(true)
    try {
      const { withdrawRevenue } = await import("@/lib/web3/services/contract.service")
      await withdrawRevenue()
      
      // 刷新余额
      await loadBalance()
      
      alert("Withdrawal successful!")
    } catch (error) {
      console.error("Withdrawal failed:", error)
      alert(`Withdrawal failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setWithdrawing(false)
    }
  }

  // 转换数据库作品格式为组件需要的格式
  const transformedWorks = works.map((work: any) => ({
    id: work.work_id,
    title: work.title,
    author: work.creator_address?.slice(0, 6) + '...' + work.creator_address?.slice(-4),
    creator_address: work.creator_address, // 添加这个字段，WorkCard需要它来判断是否是创作者
    image: work.image_url,
    images: work.images,
    tags: work.tags || [],
    material: Array.isArray(work.material) ? work.material.join(', ') : (work.material || ''),
    likes: work.like_count || 0,
    remixCount: work.remix_count || 0,
    allowRemix: work.allow_remix,
    isRemix: work.is_remix,
    story: work.story || work.description || '',
    createdAt: work.created_at,
    created_at: work.created_at, // 添加这个字段，WorkCard需要它来计算天数
  }))

  const myWorks = transformedWorks.filter((w) => !w.isRemix)
  const myRemixes = transformedWorks.filter((w) => w.isRemix)

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      {/* Profile Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-muted/50 to-muted/10 border border-border/50 p-6 md:p-8 md:px-6 md:py-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-3xl rounded-full -mr-10 -mt-10" />

        <div className="relative z-10 flex flex-col gap-6">
          <div className="flex flex-col md:flex-row gap-6 items-start justify-between">
            {/* Left: User Info */}
            <div className="flex gap-6 items-center">
              <div className="w-24 h-24 bg-gradient-to-br from-primary to-purple-600 rounded-2xl flex items-center justify-center text-4xl font-bold text-white shadow-2xl shadow-primary/20 border-4 border-background shrink-0">
                {user.name.charAt(0)}
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h1 className="text-3xl font-bold tracking-tight">{user.name}</h1>
                  <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-[10px] font-mono border border-primary/20">
                    {dbUser ? `Platform ID: ${dbUser.platform_id}` : `DID: ${user.did.slice(0, 12)}...`}
                  </span>
                </div>

                <p className="text-muted-foreground max-w-md text-sm">{user.bio}</p>

                <div className="flex flex-wrap gap-2 pt-1">
                  {user.skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-2 py-0.5 bg-muted text-foreground rounded-full text-[10px] font-medium border border-border"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 items-end">
              <div className="flex items-center gap-4 bg-primary/5 rounded-xl p-4 min-w-[240px]">
                <div className="flex items-center gap-3 flex-1">
                  <div className="p-2 bg-primary/10 rounded-full text-primary">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Balance</p>
                      <button
                        onClick={loadBalance}
                        disabled={loadingBalance}
                        className="text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3 h-3 ${loadingBalance ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                    <p className="text-xl font-mono font-bold">
                      {loadingBalance ? "Loading..." : (() => {
                        const bal = parseFloat(balance)
                        if (bal === 0) return '0 ETH'
                        if (bal < 0.0001) return `${bal.toExponential(4)} ETH`
                        if (bal < 0.01) return `${bal.toFixed(6)} ETH`
                        return `${bal.toFixed(4)} ETH`
                      })()}
                    </p>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  className="gap-2 h-8 shrink-0"
                  onClick={handleWithdraw}
                  disabled={loadingBalance || parseFloat(balance) === 0 || withdrawing}
                >
                  <ArrowUpRight className="w-4 h-4" /> {withdrawing ? "Processing..." : "Withdraw"}
                </Button>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 bg-transparent h-8"
                  onClick={() => setSettingsOpen(true)}
                >
                  <Settings className="w-4 h-4" /> Settings
                </Button>
                <Button variant="outline" size="sm" className="gap-2 bg-transparent h-8">
                  <Share2 className="w-4 h-4" /> Share
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Works Tabs */}
      <Tabs defaultValue="originals" className="w-full">
        <TabsList className="w-full md:w-auto grid grid-cols-4 md:inline-flex">
          <TabsTrigger value="originals">Originals</TabsTrigger>
          <TabsTrigger value="remixes">Remixes</TabsTrigger>
          <TabsTrigger value="fans">Fan Activity</TabsTrigger>
          <TabsTrigger value="credit">Credit Score</TabsTrigger>
        </TabsList>

        <TabsContent value="originals" className="space-y-4 mt-6">
          {worksLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading works...</div>
          ) : myWorks.length > 0 ? (
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {myWorks.map((work) => (
                <WorkDetailTrigger 
                  key={work.id} 
                  work={work} 
                  onContinueCreating={onContinueCreating}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">No original works yet</div>
          )}
        </TabsContent>

        <TabsContent value="remixes" className="space-y-4 mt-6">
          {worksLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading remixes...</div>
          ) : myRemixes.length > 0 ? (
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {myRemixes.map((work) => (
                <WorkDetailTrigger 
                  key={work.id} 
                  work={work} 
                  onContinueCreating={onContinueCreating}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">No remixes yet</div>
          )}
        </TabsContent>

        <TabsContent value="fans" className="space-y-6 mt-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Follower Stats */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Followers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{fanData.followers.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  +12% from last month
                </p>
              </CardContent>
            </Card>

            {/* Following Stats */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Following</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{fanData.following}</div>
                <p className="text-xs text-muted-foreground">
                  Active connections
                </p>
              </CardContent>
            </Card>

            {/* Voting Success Rate */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Vote Success</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round((fanData.successfulVotes / fanData.totalVotes) * 100)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {fanData.successfulVotes}/{fanData.totalVotes} votes
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Activity Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Activity Score</span>
                  <span className="text-sm text-muted-foreground">{fanData.monthlyActivity}/100</span>
                </div>
                <Progress value={fanData.monthlyActivity} className="h-2" />
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Votes Cast:</span>
                    <span className="ml-2 font-medium">12</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Works Liked:</span>
                    <span className="ml-2 font-medium">34</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Comments:</span>
                    <span className="ml-2 font-medium">8</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Shares:</span>
                    <span className="ml-2 font-medium">15</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Fan Reward NFTs Section */}
          <FanRewardNFT 
            fanAddress={address || ""} 
            onClaimReward={(nftData) => {
              console.log("Fan reward NFT claimed:", nftData)
              // 可以在这里添加更多的处理逻辑，比如更新用户统计等
            }}
          />
        </TabsContent>

        <TabsContent value="credit" className="space-y-6 mt-6">
          {/* Credit Score Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                Credit Score & Level
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">{fanData.creditScore}</div>
                  <Badge variant="secondary" className="text-lg px-4 py-1">
                    {fanData.creditLevel} Level
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress to next level</span>
                    <span>850/1000</span>
                  </div>
                  <Progress value={85} className="h-2" />
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{fanData.totalEarned}</div>
                    <div className="text-sm text-muted-foreground">ETH Earned</div>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{fanData.successfulVotes}</div>
                    <div className="text-sm text-muted-foreground">Successful Votes</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Credit Score Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Score Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Voting Accuracy</span>
                  <div className="flex items-center gap-2">
                    <Progress value={84} className="w-20 h-2" />
                    <span className="text-sm font-medium">+340</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Platform Activity</span>
                  <div className="flex items-center gap-2">
                    <Progress value={78} className="w-20 h-2" />
                    <span className="text-sm font-medium">+280</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Community Engagement</span>
                  <div className="flex items-center gap-2">
                    <Progress value={92} className="w-20 h-2" />
                    <span className="text-sm font-medium">+230</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Credit Benefits */}
          <Card>
            <CardHeader>
              <CardTitle>Diamond Level Benefits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Free reporting (5 reports/month)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Priority voting rewards</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Exclusive community events</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Reduced platform fees (1.5%)</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} user={user} />
    </div>
  )
}

function WorkDetailTrigger({ work, onContinueCreating }: { 
  work: any
  onContinueCreating?: (workId: number) => void 
}) {
  const [open, setOpen] = useState(false)
  const [votingModalOpen, setVotingModalOpen] = useState(false)
  const [workVotingStatus, setWorkVotingStatus] = useState<{
    hasVoting: boolean
    votingStatus?: 'active' | 'ended' | 'upcoming'
    votingTitle?: string
  }>({ hasVoting: false })
  const { address } = useAccount()

  // 检查是否是作品的创作者
  const isCreator = address && work.creator_address && 
    address.toLowerCase() === work.creator_address.toLowerCase()

  const handleCreateVoting = (votingData: any) => {
    console.log('Creating voting for work:', work.id, votingData)
    
    // 模拟创建投票成功
    setWorkVotingStatus({
      hasVoting: true,
      votingStatus: 'active',
      votingTitle: votingData.title
    })
    
    // 显示成功消息
    alert(`投票 "${votingData.title}" 创建成功！现在会显示在社区投票页面。`)
    
    // 可以在这里添加到全局状态或本地存储
    const existingVotings = JSON.parse(localStorage.getItem('communityVotings') || '[]')
    const newVoting = {
      id: Date.now(),
      workId: work.id,
      title: votingData.title,
      description: votingData.description,
      options: votingData.options.map((opt: any, index: number) => ({
        id: index + 1,
        title: opt.title,
        description: opt.description,
        vote_count: 0,
        percentage: 0
      })),
      work: {
        work_id: work.id,
        title: work.title,
        image_url: work.image || work.images?.[0],
        creator_address: work.creator_address
      },
      status: 'active',
      end_date: votingData.endDate,
      total_votes: 0,
      total_participants: 0,
      stake: votingData.stake,
      deliveryDays: votingData.deliveryDays,
      created_at: new Date().toISOString()
    }
    
    existingVotings.push(newVoting)
    localStorage.setItem('communityVotings', JSON.stringify(existingVotings))
  }

  return (
    <>
      <div className="relative">
        <WorkCard 
          work={work} 
          onClick={() => setOpen(true)}
          nftStatus={undefined}
          votingStatus={workVotingStatus}
          onLaunchVote={() => setVotingModalOpen(true)}
        />
        
        {/* 在卡片左上角显示投票相关按钮 */}
        {isCreator && (
          <div className="absolute top-2 left-2 z-10">
            {!workVotingStatus.hasVoting ? (
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  setVotingModalOpen(true)
                }}
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
              >
                <Vote className="w-4 h-4 mr-1" />
                Launch Vote
              </Button>
            ) : workVotingStatus.votingStatus === 'active' ? (
              <Button
                size="sm"
                variant="outline"
                disabled
                className="bg-green-500/10 border-green-500 text-green-600 shadow-lg cursor-default"
              >
                <Vote className="w-4 h-4 mr-1" />
                Voting Active
              </Button>
            ) : workVotingStatus.votingStatus === 'ended' ? (
              <Button
                size="sm"
                variant="outline"
                disabled
                className="bg-gray-500/10 border-gray-500 text-gray-600 shadow-lg cursor-default"
              >
                <Vote className="w-4 h-4 mr-1" />
                Vote Ended
              </Button>
            ) : null}
          </div>
        )}
      </div>
      
      <WorkDetailDialog 
        work={work} 
        open={open} 
        onOpenChange={setOpen}
        nftStatus={undefined}
        onMintNFT={undefined}
        onBuyNFT={undefined}
        onListNFT={undefined}
        onRemix={undefined}
        canBeRemixed={work?.allowRemix !== false}
        votingStatus={workVotingStatus}
        onLaunchVote={() => setVotingModalOpen(true)}
        onContinueCreating={onContinueCreating}
      />

      <CreateVotingModal
        isOpen={votingModalOpen}
        onClose={() => setVotingModalOpen(false)}
        work={work}
        onCreateVoting={handleCreateVoting}
      />
    </>
  )
}

function SettingsModal({
  open,
  onOpenChange,
  user,
}: { open: boolean; onOpenChange: (open: boolean) => void; user: UserProfile }) {
  const [formData, setFormData] = useState({
    name: user.name,
    bio: user.bio,
    skills: user.skills,
  })

  const [skillInput, setSkillInput] = useState("")
  const commonSkills = ["Ceramics", "Woodworking", "Digital Art", "Sculpture", "Weaving", "Metalwork"]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-background/95 backdrop-blur-xl border-primary/20">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Display Name</Label>
            <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
          </div>

          <div className="space-y-2">
            <Label>Bio</Label>
            <Textarea value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} />
          </div>

          <div className="space-y-2">
            <Label>Skills</Label>
            <div className="flex flex-wrap gap-2 p-3 border border-border rounded-lg bg-background min-h-[60px]">
              {formData.skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-md text-sm"
                >
                  {skill}
                  <button
                    onClick={() => setFormData({ ...formData, skills: formData.skills.filter((s) => s !== skill) })}
                  >
                    ×
                  </button>
                </span>
              ))}
              <input
                type="text"
                placeholder="Press Enter to add"
                className="flex-1 min-w-[120px] bg-transparent outline-none text-sm"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && skillInput.trim()) {
                    setFormData({ ...formData, skills: [...formData.skills, skillInput.trim()] })
                    setSkillInput("")
                  }
                }}
              />
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {commonSkills.map((skill) => (
                <button
                  key={skill}
                  onClick={() => {
                    if (!formData.skills.includes(skill)) {
                      setFormData({ ...formData, skills: [...formData.skills, skill] })
                    }
                  }}
                  className="px-2 py-1 text-xs bg-muted hover:bg-muted/80 rounded-md transition-colors"
                >
                  + {skill}
                </button>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
