"use client"

import { useState, useEffect } from "react"
import { useAccount } from "wagmi"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Heart, MessageCircle, Share2, Vote, TrendingUp, Users, Clock, Trophy } from "lucide-react"
import Image from "next/image"

// Mock data for community features
const mockVotings = [
  {
    id: 1,
    title: "Should this artwork be featured in our gallery?",
    artwork: {
      title: "Digital Dreams",
      image: "/placeholder.svg",
      creator: "0x1234...5678"
    },
    totalVotes: 1250,
    yesVotes: 890,
    noVotes: 360,
    endTime: "2024-12-25T00:00:00Z",
    status: "active",
    reward: "0.001 ETH + Special NFT"
  },
  {
    id: 2,
    title: "Community choice: Best remix of the month",
    artwork: {
      title: "Neon Cityscape Remix",
      image: "/placeholder.svg",
      creator: "0x9876...4321"
    },
    totalVotes: 2100,
    yesVotes: 1680,
    noVotes: 420,
    endTime: "2024-12-22T00:00:00Z",
    status: "active",
    reward: "0.002 ETH + Collector Badge"
  }
]

const mockTrendingWorks = [
  {
    id: 1,
    title: "Pink Hair Anime Girl",
    image: "/img_9046.jpg",
    creator: "0xabcd...efgh",
    likes: 2340,
    remixes: 45,
    price: "0.5 ETH",
    trending: true
  },
  {
    id: 2,
    title: "Cat Ear Character",
    image: "/img_9045.jpg",
    creator: "0x1111...2222",
    likes: 1890,
    remixes: 32,
    price: "0.3 ETH",
    trending: true
  },
  {
    id: 3,
    title: "Magical Portrait",
    image: "/IMG_88DDEB20DB06-1.jpeg",
    creator: "0x5555...6666",
    likes: 1650,
    remixes: 28,
    price: "0.4 ETH",
    trending: true
  },
  {
    id: 4,
    title: "Magical Girl Portrait",
    image: "/IMG_F4DF4C7DEC0F-1.jpeg",
    creator: "0x9999...1111",
    likes: 2100,
    remixes: 38,
    price: "0.6 ETH",
    trending: true
  }
]

const mockFollowing = [
  {
    address: "0xabcd...efgh",
    name: "ArtistAlice",
    avatar: "/placeholder.svg",
    recentWork: "Cosmic Harmony",
    activity: "Created new artwork",
    time: "2 hours ago"
  },
  {
    address: "0x1111...2222",
    name: "CreatorBob",
    avatar: "/placeholder.svg",
    recentWork: "Urban Pulse",
    activity: "Started a community vote",
    time: "5 hours ago"
  }
]

export function CommunityView() {
  const [activeVoting, setActiveVoting] = useState<number | null>(null)
  const [votings, setVotings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { address } = useAccount()

  // 加载活跃投票
  useEffect(() => {
    loadActiveVotings()
  }, [])

  const loadActiveVotings = () => {
    try {
      // 从本地存储加载投票数据
      const storedVotings = JSON.parse(localStorage.getItem('communityVotings') || '[]')
      
      // 过滤活跃的投票
      const now = new Date()
      const activeVotings = storedVotings.filter((voting: any) => {
        const endDate = new Date(voting.end_date)
        return voting.status === 'active' && endDate > now
      })
      
      // 按创建时间排序，最新的在前面
      const sortedVotings = activeVotings.sort((a: any, b: any) => {
        const dateA = new Date(a.created_at || 0)
        const dateB = new Date(b.created_at || 0)
        return dateB.getTime() - dateA.getTime()
      })
      
      setVotings(sortedVotings)
    } catch (error) {
      console.error('Failed to load active votings:', error)
      setVotings([])
    } finally {
      setLoading(false)
    }
  }

  const handleVote = (votingId: number, optionId: number) => {
    try {
      // 检查用户是否已经投票
      const userVotes = JSON.parse(localStorage.getItem('userVotes') || '{}')
      const userKey = address || 'anonymous'
      
      if (userVotes[userKey] && userVotes[userKey].includes(votingId)) {
        alert('您已经为这个投票投过票了！')
        return
      }
      
      // 更新投票数据
      const storedVotings = JSON.parse(localStorage.getItem('communityVotings') || '[]')
      const updatedVotings = storedVotings.map((voting: any) => {
        if (voting.id === votingId) {
          const updatedOptions = voting.options.map((option: any) => {
            if (option.id === optionId) {
              return { ...option, vote_count: option.vote_count + 1 }
            }
            return option
          })
          
          const totalVotes = updatedOptions.reduce((sum: number, opt: any) => sum + opt.vote_count, 0)
          
          // 重新计算百分比
          const optionsWithPercentage = updatedOptions.map((option: any) => ({
            ...option,
            percentage: totalVotes > 0 ? Math.round((option.vote_count / totalVotes) * 100) : 0
          }))
          
          return {
            ...voting,
            options: optionsWithPercentage,
            total_votes: totalVotes,
            total_participants: totalVotes // 简化处理
          }
        }
        return voting
      })
      
      // 保存更新的投票数据
      localStorage.setItem('communityVotings', JSON.stringify(updatedVotings))
      
      // 记录用户投票
      if (!userVotes[userKey]) {
        userVotes[userKey] = []
      }
      userVotes[userKey].push(votingId)
      localStorage.setItem('userVotes', JSON.stringify(userVotes))
      
      // 重新加载数据
      loadActiveVotings()
      alert('投票成功！')
      
    } catch (error) {
      console.error('Vote failed:', error)
      alert('投票失败，请稍后重试')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Community</h1>
        <Badge variant="secondary" className="flex items-center gap-2">
          <Users className="w-4 h-4" />
          12,450 Active Members
        </Badge>
      </div>

      <Tabs defaultValue="voting" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="voting" className="flex items-center gap-2">
            <Vote className="w-4 h-4" />
            Active Voting
          </TabsTrigger>
          <TabsTrigger value="trending" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Trending Works
          </TabsTrigger>
          <TabsTrigger value="following" className="flex items-center gap-2">
            <Heart className="w-4 h-4" />
            Following
          </TabsTrigger>
        </TabsList>

        <TabsContent value="voting" className="space-y-4">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading active votings...
            </div>
          ) : votings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No active votings at the moment
            </div>
          ) : (
            <div className="grid gap-4">
              {votings.map((voting) => {
                // 调试日志
                console.log('Voting data:', voting)
                return (
                <Card key={voting.id} className="overflow-hidden">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <CardTitle className="text-lg">{voting.title}</CardTitle>
                        {voting.description && (
                          <p className="text-sm text-muted-foreground">{voting.description}</p>
                        )}
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          Ends {new Date(voting.end_date).toLocaleDateString()}
                        </div>
                      </div>
                      <Badge variant={voting.status === 'active' ? 'default' : 'secondary'}>
                        {voting.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Artwork Preview */}
                    {voting.work && (
                      <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                        <div className="relative w-16 h-16 rounded-lg overflow-hidden">
                          <Image
                            src={voting.work.image_url || "/placeholder.svg"}
                            alt={voting.work.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <h4 className="font-semibold">{voting.work.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            by {voting.work.creator_address?.slice(0, 6)}...{voting.work.creator_address?.slice(-4)}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Voting Options */}
                    <div className="space-y-3">
                      {voting.options?.map((option: any) => (
                        <div key={option.id} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <div>
                              <h5 className="font-medium">{option.title}</h5>
                              {option.description && (
                                <p className="text-sm text-muted-foreground">{option.description}</p>
                              )}
                            </div>
                            <div className="text-sm font-medium">
                              {option.vote_count} votes ({option.percentage}%)
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Progress 
                              value={option.percentage} 
                              className="h-2 flex-1"
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleVote(voting.id, option.id)}
                              className="shrink-0"
                            >
                              Vote
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Voting Stats */}
                    <div className="flex items-center justify-between pt-3 border-t border-border/40">
                      <div className="text-sm text-muted-foreground">
                        Total participants: {voting.total_participants}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Total votes: {voting.total_votes}
                      </div>
                    </div>

                    {/* Delivery Commitment */}
                    {(voting.deliveryDays || voting.stake) && (
                      <div className="flex items-center gap-2 p-3 bg-orange-500/10 rounded-lg">
                        <Clock className="w-4 h-4 text-orange-600" />
                        <span className="text-sm font-medium">
                          {voting.deliveryDays 
                            ? `Creator commits to deliver within ${voting.deliveryDays} days after voting ends`
                            : 'Creator has staked funds to guarantee delivery'
                          }
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="trending" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockTrendingWorks.map((work) => (
              <Card key={work.id} className="overflow-hidden group hover:shadow-lg transition-shadow">
                <div className="relative aspect-square">
                  <Image
                    src={work.image}
                    alt={work.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform"
                  />
                  {work.trending && (
                    <Badge className="absolute top-2 right-2 bg-orange-500">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      Trending
                    </Badge>
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2">{work.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">by {work.creator}</p>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Heart className="w-4 h-4" />
                        {work.likes}
                      </span>
                      <span className="flex items-center gap-1">
                        <Share2 className="w-4 h-4" />
                        {work.remixes}
                      </span>
                    </div>
                    <span className="font-semibold text-primary">{work.price}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="following" className="space-y-4">
          <div className="space-y-4">
            {mockFollowing.map((user) => (
              <Card key={user.address}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback>{user.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{user.name}</h4>
                        <span className="text-sm text-muted-foreground">{user.address}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {user.activity} "{user.recentWork}"
                      </p>
                      <p className="text-xs text-muted-foreground">{user.time}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <MessageCircle className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Heart className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}