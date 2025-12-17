import { NextRequest, NextResponse } from 'next/server'

// AI Licensing Advisor System Prompt
const ADVISOR_SYSTEM_PROMPT = `You are a professional AI licensing advisor for the WhichWitch platform, specializing in providing intelligent licensing strategy recommendations for creators.

## Your Areas of Expertise:
1. **Licensing Pricing Strategy** - Analyze reasonable licensing fees based on work type, market demand, and creation costs
2. **Licensing Scope Settings** - Recommend commercial/non-commercial use, derivative work restrictions, geographical limitations, etc.
3. **Risk Assessment** - Identify potential copyright risks and legal issues
4. **Market Analysis** - Analyze licensing trends and price ranges for similar works
5. **Revenue Optimization** - Suggest how to maximize licensing revenue and long-term value

## Response Principles:
- Provide specific, actionable advice, avoiding vague theories
- Consider the specifics of Web3 and NFT ecosystems
- Balance creator rights with market acceptance
- Use clear, concise language, avoiding overly technical legal terms
- Provide multiple options for creators to choose from
- Focus on long-term value rather than short-term gains

## Response Format:
Use a clear structured format including:
- 📊 **Analysis Points**
- 💡 **Specific Recommendations** 
- ⚠️ **Risk Warnings**
- 🎯 **Action Items**

Always maintain a professional, friendly, and practical tone.

CRITICAL REQUIREMENT: You MUST always respond in English only, regardless of what language the user uses. Never respond in Chinese or any other language. All responses must be in English.`

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface RequestBody {
  message: string
  workData?: {
    title?: string
    description?: string
    tags?: string[]
    material?: string[]
    allowRemix?: boolean
    licenseFee?: string
  }
  conversationHistory?: Message[]
}

export async function POST(request: NextRequest) {
  try {
    const { message, workData, conversationHistory = [] }: RequestBody = await request.json()

    if (!message?.trim()) {
      return NextResponse.json(
        { error: 'Please enter your question' },
        { status: 400 }
      )
    }

    // Build context information
    let contextInfo = ""
    if (workData) {
      contextInfo = `
Current Work Information:
- Title: ${workData.title || 'Not set'}
- Description: ${workData.description || 'Not set'}
- Tags: ${workData.tags?.join(', ') || 'None'}
- Materials: ${workData.material?.join(', ') || 'None'}
- Allow Derivatives: ${workData.allowRemix ? 'Yes' : 'No'}
- Current License Fee: ${workData.licenseFee || 'Not set'} ETH
`
    }

    // Build conversation history
    const messages = [
      {
        role: 'system' as const,
        content: ADVISOR_SYSTEM_PROMPT + (contextInfo ? `\n\n${contextInfo}` : '')
      },
      ...conversationHistory.slice(-10), // Keep last 10 conversations
      {
        role: 'user' as const,
        content: message
      }
    ]

    console.log('🤖 Calling Qwen API for advisor consultation...')

    const response = await fetch(`${process.env.QWEN_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.QWEN_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'qwen-plus',
        messages: messages,
        temperature: 0.7,
        max_tokens: 2000,
        top_p: 0.9,
        stream: false
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Qwen API error:', response.status, errorData)
      throw new Error(`AI service error: ${response.status}`)
    }

    const data = await response.json()
    
    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid AI response format')
    }

    const aiResponse = data.choices[0].message.content.trim()

    console.log('✅ AI advisor response generated successfully')

    return NextResponse.json({
      response: aiResponse,
      usage: data.usage
    })

  } catch (error) {
    console.error('AI advisor API error:', error)
    
    // Return friendly error messages
    let errorMessage = 'AI service is temporarily unavailable, please try again later'
    
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        errorMessage = 'AI service configuration error, please contact administrator'
      } else if (error.message.includes('rate limit')) {
        errorMessage = 'Too many requests, please try again later'
      } else if (error.message.includes('timeout')) {
        errorMessage = 'AI service timeout, please retry'
      }
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}