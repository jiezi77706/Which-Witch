"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Vote, TrendingUp, Users, Clock, CheckCircle2 } from "lucide-react"
import { useAccount } from "wagmi"

interface VotingOption {
  id: string
  title: string
  description: string
  votes: number
  percentage: number
}

interface WorkVoting {
  id: string
  title: string
  description: string
  options: VotingOption[]
  totalVotes: number
  endDate: string
  status: 'active' | 'ended' | 'upcoming'
  userVote?: string // 用户已投票的选项ID
}

interface WorkVotingProps {
  work: any
  onVote?: (votingId: string, optionId: string) => void
}

export function WorkVoting({ work, onVote }: WorkVotingProps) {
  const { address } = useAccount()
  const [votings, setVotings] = useState<WorkVoting[]>([])
  const [loading, setLoading] = useState(true)

  // 从API获取投票数据
  useEffect(() => {
    const fetchVotings = async () => {
      try {
        const response = await fetch(`/api/voting/submit?workId=${work.work_id || work.id}`)
        const data = await response.json()
        
        if (response.ok && data.votings) {
          // 转换数据格式
          const formattedVotings: WorkVoting[] = data.votings.map((voting: any) => ({
            id: voting.id.toString(),
            title: voting.title,
            description: voting.description || '',
            options: voting.voting_options?.map((option: any) => ({
              id: option.id.toString(),
              title: option.title,
              description: option.description || '',
              votes: option.vote_count || 0,
              percentage: option.percentage || 0
            })) || [],
            totalVotes: voting.total_votes || 0,
            endDate: voting.end_date,
            status: voting.status,
            userVote: undefined // TODO: 检查用户是否已投票
          }))
          
          setVotings(formattedVotings)
        } else {
          // 如果API失败，使用模拟数据
          console.log('Using mock voting data')
          const mockVotings: WorkVoting[] = [
            {
              id: "vote-1",
              title: "Character Design Direction",
              description: "Which character design style should be used for the main protagonist?",
              options: [
                { id: "opt-1", title: "Realistic Style", description: "Detailed, lifelike character design", votes: 45, percentage: 60 },
                { id: "opt-2", title: "Anime Style", description: "Japanese animation inspired design", votes: 23, percentage: 31 },
                { id: "opt-3", title: "Minimalist Style", description: "Simple, clean geometric design", votes: 7, percentage: 9 }
              ],
              totalVotes: 75,
              endDate: "2024-12-25T23:59:59Z",
              status: 'active',
              userVote: undefined
            }
          ]
          setVotings(mockVotings)
        }
      } catch (error) {
        console.error('Failed to fetch votings:', error)
        setVotings([]) // 设置为空数组
      } finally {
        setLoading(false)
      }
    }

    fetchVotings()
  }, [work.id])

  const handleVote = async (votingId: string, optionId: string) => {
    if (!address) {
      console.error('User not connected')
      return
    }

    try {
      console.log('Submitting vote:', { votingId, optionId, userAddress: address })
      
      // 调用API提交投票
      const response = await fetch('/api/voting/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          votingId: parseInt(votingId),
          optionId: parseInt(optionId),
          voterAddress: address,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit vote')
      }

      console.log('✅ Vote submitted successfully')
      
      // 如果API返回了更新的数据，使用它
      if (data.updatedVoting) {
        setVotings(prev => prev.map(voting => {
          if (voting.id === votingId) {
            return {
              ...voting,
              options: data.updatedVoting.voting_options?.map((option: any) => ({
                id: option.id.toString(),
                title: option.title,
                description: option.description || '',
                votes: option.vote_count || 0,
                percentage: option.percentage || 0
              })) || voting.options,
              totalVotes: data.updatedVoting.total_votes || voting.totalVotes,
              userVote: optionId
            }
          }
          return voting
        }))
      } else {
        // 否则更新本地状态
        setVotings(prev => prev.map(voting => {
          if (voting.id === votingId) {
            const updatedOptions = voting.options.map(option => {
              if (option.id === optionId) {
                return { ...option, votes: option.votes + 1 }
              }
              return option
            })
            
            const newTotalVotes = voting.totalVotes + 1
            const updatedOptionsWithPercentage = updatedOptions.map(option => ({
              ...option,
              percentage: Math.round((option.votes / newTotalVotes) * 100)
            }))

            return {
              ...voting,
              options: updatedOptionsWithPercentage,
              totalVotes: newTotalVotes,
              userVote: optionId
            }
          }
          return voting
        }))
      }

      if (onVote) {
        onVote(votingId, optionId)
      }
    } catch (error) {
      console.error('Failed to vote:', error)
      alert(error instanceof Error ? error.message : 'Failed to submit vote')
    }
  }

  const isVotingActive = (voting: WorkVoting) => {
    return voting.status === 'active' && new Date(voting.endDate) > new Date()
  }

  const getTimeRemaining = (endDate: string) => {
    const now = new Date()
    const end = new Date(endDate)
    const diff = end.getTime() - now.getTime()
    
    if (diff <= 0) return 'Ended'
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    
    if (days > 0) return `${days}d ${hours}h left`
    return `${hours}h left`
  }

  if (loading) {
    return (
      <div className="pt-6 border-t border-border/50">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          <Vote className="w-4 h-4" /> Community Voting
        </h3>
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-muted rounded-lg"></div>
          <div className="h-32 bg-muted rounded-lg"></div>
        </div>
      </div>
    )
  }

  if (votings.length === 0) {
    return (
      <div className="pt-6 border-t border-border/50">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          <Vote className="w-4 h-4" /> Community Voting
        </h3>
        <div className="p-6 text-center text-muted-foreground">
          <Vote className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">No active voting for this work</p>
        </div>
      </div>
    )
  }

  return (
    <div className="pt-6 border-t border-border/50">
      <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
        <Vote className="w-4 h-4" /> Community Voting
      </h3>
      
      <div className="space-y-4">
        {votings.map((voting) => (
          <Card key={voting.id} className="p-4 bg-card/50 backdrop-blur-sm border-border/50">
            {/* 投票标题和状态 */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h4 className="font-semibold text-base mb-1">{voting.title}</h4>
                <p className="text-sm text-muted-foreground">{voting.description}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge variant={isVotingActive(voting) ? "default" : "secondary"}>
                  {isVotingActive(voting) ? "Active" : "Ended"}
                </Badge>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {getTimeRemaining(voting.endDate)}
                </div>
              </div>
            </div>

            {/* 投票选项 */}
            <div className="space-y-3">
              {voting.options.map((option) => {
                const isUserVote = voting.userVote === option.id
                const canVote = isVotingActive(voting) && !voting.userVote && address
                
                return (
                  <div key={option.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{option.title}</span>
                          {isUserVote && (
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{option.description}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-sm font-medium">{option.percentage}%</div>
                          <div className="text-xs text-muted-foreground">{option.votes} votes</div>
                        </div>
                        {canVote && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleVote(voting.id, option.id)}
                            className="h-8"
                          >
                            Vote
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {/* 进度条 */}
                    <Progress 
                      value={option.percentage} 
                      className={`h-2 ${isUserVote ? 'bg-green-100' : ''}`}
                    />
                  </div>
                )
              })}
            </div>

            {/* 投票统计 */}
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/30">
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {voting.totalVotes} total votes
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  {voting.options[0]?.title} leading
                </div>
              </div>
              
              {!address && isVotingActive(voting) && (
                <p className="text-xs text-muted-foreground">Connect wallet to vote</p>
              )}
              
              {voting.userVote && (
                <p className="text-xs text-green-600 font-medium">✓ You voted</p>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}