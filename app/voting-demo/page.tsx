"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { CreateVotingModal } from '@/components/whichwitch/create-voting-modal'
import { Vote, User, Clock, Trophy } from 'lucide-react'

// 模拟作品数据
const mockWork = {
  id: 1,
  title: "Digital Dreams",
  author: "Artist Alice",
  creator_address: "0x1234567890123456789012345678901234567890",
  image: "/placeholder.svg",
  images: ["/placeholder.svg"],
  tags: ["digital", "art", "dreams"],
  story: "A beautiful digital artwork exploring the realm of dreams",
  created_at: new Date().toISOString()
}

export default function VotingDemoPage() {
  const [votingModalOpen, setVotingModalOpen] = useState(false)
  const [votings, setVotings] = useState<any[]>([])
  const [workVotingStatus, setWorkVotingStatus] = useState({
    hasVoting: false,
    votingStatus: undefined as 'active' | 'ended' | 'upcoming' | undefined,
    votingTitle: undefined as string | undefined
  })

  // 模拟当前用户地址
  const currentUserAddress = "0x1234567890123456789012345678901234567890"

  useEffect(() => {
    loadVotings()
    checkWorkVotingStatus()
  }, [])

  const loadVotings = () => {
    const storedVotings = JSON.parse(localStorage.getItem('communityVotings') || '[]')
    setVotings(storedVotings)
  }

  const checkWorkVotingStatus = () => {
    const storedVotings = JSON.parse(localStorage.getItem('communityVotings') || '[]')
    const workVoting = storedVotings.find((v: any) => v.workId === mockWork.id)
    
    if (workVoting) {
      const now = new Date()
      const endDate = new Date(workVoting.end_date)
      const status = endDate > now ? 'active' : 'ended'
      
      setWorkVotingStatus({
        hasVoting: true,
        votingStatus: status,
        votingTitle: workVoting.title
      })
    }
  }

  const handleCreateVoting = (votingData: any) => {
    const existingVotings = JSON.parse(localStorage.getItem('communityVotings') || '[]')
    const newVoting = {
      id: Date.now(),
      workId: mockWork.id,
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
        work_id: mockWork.id,
        title: mockWork.title,
        image_url: mockWork.image,
        creator_address: mockWork.creator_address
      },
      status: 'active',
      end_date: votingData.endDate,
      total_votes: 0,
      total_participants: 0,
      reward: votingData.reward + ' ETH',
      created_at: new Date().toISOString()
    }
    
    existingVotings.push(newVoting)
    localStorage.setItem('communityVotings', JSON.stringify(existingVotings))
    
    setWorkVotingStatus({
      hasVoting: true,
      votingStatus: 'active',
      votingTitle: votingData.title
    })
    
    loadVotings()
    alert(`投票 "${votingData.title}" 创建成功！`)
  }

  const handleVote = (votingId: number, optionId: number) => {
    const userVotes = JSON.parse(localStorage.getItem('userVotes') || '{}')
    const userKey = currentUserAddress
    
    if (userVotes[userKey] && userVotes[userKey].includes(votingId)) {
      alert('您已经为这个投票投过票了！')
      return
    }
    
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
        
        const optionsWithPercentage = updatedOptions.map((option: any) => ({
          ...option,
          percentage: totalVotes > 0 ? Math.round((option.vote_count / totalVotes) * 100) : 0
        }))
        
        return {
          ...voting,
          options: optionsWithPercentage,
          total_votes: totalVotes,
          total_participants: totalVotes
        }
      }
      return voting
    })
    
    localStorage.setItem('communityVotings', JSON.stringify(updatedVotings))
    
    if (!userVotes[userKey]) {
      userVotes[userKey] = []
    }
    userVotes[userKey].push(votingId)
    localStorage.setItem('userVotes', JSON.stringify(userVotes))
    
    loadVotings()
    alert('投票成功！')
  }

  const clearData = () => {
    localStorage.removeItem('communityVotings')
    localStorage.removeItem('userVotes')
    setVotings([])
    setWorkVotingStatus({
      hasVoting: false,
      votingStatus: undefined,
      votingTitle: undefined
    })
    alert('数据已清空')
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">投票系统演示</h1>
        <Button variant="outline" onClick={clearData}>
          清空演示数据
        </Button>
      </div>

      {/* 作品卡片 - 模拟Profile页面 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Profile页面 - 作品展示
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
              Art
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{mockWork.title}</h3>
              <p className="text-sm text-muted-foreground">by {mockWork.author}</p>
              <p className="text-sm mt-2">{mockWork.story}</p>
            </div>
            <div className="flex flex-col gap-2">
              {!workVotingStatus.hasVoting ? (
                <Button
                  onClick={() => setVotingModalOpen(true)}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Vote className="w-4 h-4 mr-2" />
                  Launch Vote
                </Button>
              ) : workVotingStatus.votingStatus === 'active' ? (
                <Button
                  variant="outline"
                  disabled
                  className="bg-green-500/10 border-green-500 text-green-600"
                >
                  <Vote className="w-4 h-4 mr-2" />
                  Voting Active
                </Button>
              ) : (
                <Button
                  variant="outline"
                  disabled
                  className="bg-gray-500/10 border-gray-500 text-gray-600"
                >
                  <Vote className="w-4 h-4 mr-2" />
                  Vote Ended
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 社区投票页面 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Vote className="w-5 h-5" />
            Community页面 - 活跃投票
          </CardTitle>
        </CardHeader>
        <CardContent>
          {votings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              暂无活跃投票。请先创建一个投票！
            </div>
          ) : (
            <div className="space-y-4">
              {votings.map((voting) => (
                <Card key={voting.id} className="border-l-4 border-l-primary">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <h4 className="font-semibold text-lg">{voting.title}</h4>
                        {voting.description && (
                          <p className="text-sm text-muted-foreground">{voting.description}</p>
                        )}
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          结束时间: {new Date(voting.end_date).toLocaleDateString()}
                        </div>
                      </div>
                      <Badge variant="default">活跃</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* 作品预览 */}
                    <div className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">
                        Art
                      </div>
                      <div>
                        <h5 className="font-medium">{voting.work.title}</h5>
                        <p className="text-sm text-muted-foreground">
                          by {voting.work.creator_address.slice(0, 6)}...{voting.work.creator_address.slice(-4)}
                        </p>
                      </div>
                    </div>

                    {/* 投票选项 */}
                    <div className="space-y-3">
                      {voting.options.map((option: any) => (
                        <div key={option.id} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <div>
                              <h6 className="font-medium">{option.title}</h6>
                              {option.description && (
                                <p className="text-sm text-muted-foreground">{option.description}</p>
                              )}
                            </div>
                            <div className="text-sm font-medium">
                              {option.vote_count} 票 ({option.percentage}%)
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Progress value={option.percentage} className="h-2 flex-1" />
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleVote(voting.id, option.id)}
                            >
                              投票
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* 统计信息 */}
                    <div className="flex items-center justify-between pt-3 border-t">
                      <div className="text-sm text-muted-foreground">
                        总参与者: {voting.total_participants}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        总票数: {voting.total_votes}
                      </div>
                    </div>

                    {/* 奖励信息 */}
                    {voting.reward && (
                      <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg">
                        <Trophy className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium">奖励池: {voting.reward}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 创建投票模态框 */}
      <CreateVotingModal
        isOpen={votingModalOpen}
        onClose={() => setVotingModalOpen(false)}
        work={mockWork}
        onCreateVoting={handleCreateVoting}
      />
    </div>
  )
}