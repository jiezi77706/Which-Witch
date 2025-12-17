"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import { Sparkles, Send, Loader2, AlertCircle, Bot, User } from "lucide-react"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface AIAdvisorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workData?: {
    title?: string
    description?: string
    tags?: string[]
    material?: string[]
    allowRemix?: boolean
    licenseFee?: string
  }
}

export function AIAdvisorModal({ 
  open, 
  onOpenChange, 
  workData 
}: AIAdvisorModalProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: '👋 Hello! I\'m the WhichWitch AI Licensing Advisor. I can help you analyze your work\'s licensing strategy, including pricing recommendations, licensing scope settings, risk assessment, and more. What would you like to know?',
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput("")
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/advisor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          workData,
          conversationHistory: messages
        }),
      })

      if (!response.ok) {
        throw new Error('AI service is temporarily unavailable, please try again later')
      }

      const data = await response.json()
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('AI advisor error:', error)
      setError(error instanceof Error ? error.message : 'An unknown error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const clearConversation = () => {
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: '👋 Hello! I\'m the WhichWitch AI Licensing Advisor. I can help you analyze your work\'s licensing strategy, including pricing recommendations, licensing scope settings, risk assessment, and more. What would you like to know?',
        timestamp: new Date()
      }
    ])
    setError(null)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[80vh] flex flex-col p-0 bg-background/95 backdrop-blur-xl border-primary/20">
        <DialogHeader className="p-6 pb-4 border-b border-border/50">
          <DialogTitle className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold">AI Licensing Advisor</span>
              <p className="text-sm text-muted-foreground font-normal mt-1">
                Smart analysis for your work licensing strategy
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* 作品信息预览 */}
        {workData && (
          <div className="px-6 py-3 bg-muted/30 border-b border-border/30">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Current Work:</span>
              <span className="font-medium">{workData.title || 'Untitled Work'}</span>
              {workData.tags && workData.tags.length > 0 && (
                <div className="flex gap-1 ml-2">
                  {workData.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="px-1.5 py-0.5 bg-primary/10 text-primary rounded text-xs">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 对话区域 */}
        <div className="flex-1 px-6 overflow-y-auto">
          <div className="space-y-4 py-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3 max-w-[85%]",
                  message.role === 'user' ? "ml-auto flex-row-reverse" : ""
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                  message.role === 'user' 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-gradient-to-tr from-blue-500 to-purple-600 text-white"
                )}>
                  {message.role === 'user' ? (
                    <User className="w-4 h-4" />
                  ) : (
                    <Bot className="w-4 h-4" />
                  )}
                </div>
                <div className={cn(
                  "rounded-2xl px-4 py-3 text-sm",
                  message.role === 'user'
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/50 border border-border/50"
                )}>
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  <div className={cn(
                    "text-xs mt-2 opacity-70",
                    message.role === 'user' ? "text-primary-foreground/70" : "text-muted-foreground"
                  )}>
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-3 max-w-[85%]">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 text-white flex items-center justify-center">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-muted/50 border border-border/50 rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    AI is thinking...
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="px-6 py-2">
            <div className="flex items-center gap-2 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          </div>
        )}

        {/* 快速问题按钮 */}
        {messages.length <= 1 && (
          <div className="px-6 py-3 border-b border-border/30">
            <p className="text-sm text-muted-foreground mb-3">💡 Quick Start:</p>
            <div className="flex flex-wrap gap-2">
              {[
                "Help me analyze reasonable licensing prices for this work",
                "Should I allow derivatives? What are the risks?",
                "How to set licensing scope to protect my rights?",
                "What's the market situation for this type of work?"
              ].map((question) => (
                <Button
                  key={question}
                  variant="outline"
                  size="sm"
                  onClick={() => setInput(question)}
                  className="text-xs h-8 bg-muted/30 hover:bg-muted/50 border-border/50"
                >
                  {question}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* 输入区域 */}
        <div className="p-6 pt-4 border-t border-border/50">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about licensing strategy, pricing advice, risk assessment..."
                className="pr-12 bg-muted/30 border-border/50 focus:border-primary/50"
                disabled={isLoading}
              />
              <Button
                size="sm"
                onClick={handleSendMessage}
                disabled={!input.trim() || isLoading}
                className="absolute right-1 top-1 h-8 w-8 p-0"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <div className="flex justify-between items-center mt-3">
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={clearConversation}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Clear Chat
              </Button>
            </div>
            <div className="text-xs text-muted-foreground">
              Press Enter to send, Shift + Enter for new line
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}