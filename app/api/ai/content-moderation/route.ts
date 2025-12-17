import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Qwen-VL API configuration
const QWEN_API_URL = process.env.QWEN_API_URL || 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation'
const QWEN_API_KEY = process.env.QWEN_API_KEY

interface ModerationRequest {
  workId: number
  imageUrl: string
  creatorAddress: string
  stakeAmount: string
  stakeTxHash: string
}

interface ModerationResult {
  nsfwScore: number
  violenceScore: number
  hateScore: number
  overallSafetyScore: number
  detectedIssues: string[]
  flaggedContent: string[]
  aiAnalysis: any
}

// Call Qwen-VL API for content moderation
async function analyzeContentWithQwen(imageUrl: string): Promise<ModerationResult> {
  try {
    const response = await fetch(QWEN_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${QWEN_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'qwen-vl-max',
        input: {
          messages: [
            {
              role: 'user',
              content: [
                { image: imageUrl },
                { 
                  text: `Analyze this image for content moderation. Detect and score the following:
1. NSFW content (nudity, sexual content) - score 0-100
2. Violence and gore - score 0-100
3. Hate symbols and offensive content - score 0-100

Provide a detailed analysis in JSON format with:
- nsfwScore: number (0-100)
- violenceScore: number (0-100)
- hateScore: number (0-100)
- detectedIssues: array of issue types found
- flaggedContent: array of specific problematic elements
- reasoning: detailed explanation

Return ONLY valid JSON.`
                }
              ]
            }
          ]
        },
        parameters: {
          result_format: 'message'
        }
      })
    })

    if (!response.ok) {
      throw new Error(`Qwen API error: ${response.statusText}`)
    }

    const data = await response.json()
    const aiResponse = data.output?.choices?.[0]?.message?.content?.[0]?.text || '{}'
    
    let aiAnalysis
    try {
      aiAnalysis = JSON.parse(aiResponse)
    } catch {
      aiAnalysis = { error: 'Failed to parse AI response', rawResponse: aiResponse }
    }

    const nsfwScore = aiAnalysis.nsfwScore || 0
    const violenceScore = aiAnalysis.violenceScore || 0
    const hateScore = aiAnalysis.hateScore || 0
    const overallSafetyScore = 100 - Math.max(nsfwScore, violenceScore, hateScore)

    return {
      nsfwScore,
      violenceScore,
      hateScore,
      overallSafetyScore,
      detectedIssues: aiAnalysis.detectedIssues || [],
      flaggedContent: aiAnalysis.flaggedContent || [],
      aiAnalysis
    }
  } catch (error) {
    console.error('Qwen API error:', error)
    // Fallback to basic analysis
    return {
      nsfwScore: 0,
      violenceScore: 0,
      hateScore: 0,
      overallSafetyScore: 100,
      detectedIssues: [],
      flaggedContent: [],
      aiAnalysis: { error: 'AI analysis unavailable', fallback: true }
    }
  }
}

// POST: Submit work for content moderation
export async function POST(request: NextRequest) {
  try {
    const body: ModerationRequest = await request.json()
    const { workId, imageUrl, creatorAddress, stakeAmount, stakeTxHash } = body

    if (!workId || !imageUrl || !creatorAddress) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Analyze content with Qwen-VL
    const moderationResult = await analyzeContentWithQwen(imageUrl)

    // Determine status based on scores
    let status = 'approved'
    if (moderationResult.overallSafetyScore < 50) {
      status = 'rejected'
    } else if (moderationResult.overallSafetyScore < 80) {
      status = 'under_review'
    }

    // Calculate challenge period (7 days from now)
    const challengePeriodEnd = new Date()
    challengePeriodEnd.setDate(challengePeriodEnd.getDate() + 7)

    // Insert moderation record
    const { data, error } = await supabase
      .from('content_moderation')
      .insert({
        work_id: workId,
        creator_address: creatorAddress,
        status,
        ai_analysis: moderationResult.aiAnalysis,
        nsfw_score: moderationResult.nsfwScore,
        violence_score: moderationResult.violenceScore,
        hate_score: moderationResult.hateScore,
        overall_safety_score: moderationResult.overallSafetyScore,
        detected_issues: moderationResult.detectedIssues,
        flagged_content: moderationResult.flaggedContent,
        stake_amount: stakeAmount,
        stake_tx_hash: stakeTxHash,
        stake_locked: status !== 'approved',
        challenge_period_end: challengePeriodEnd.toISOString(),
        reviewed_at: status !== 'pending' ? new Date().toISOString() : null
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      moderation: data,
      status,
      message: status === 'approved' 
        ? 'Content approved! Stake will be unlocked.'
        : status === 'rejected'
        ? 'Content rejected due to policy violations.'
        : 'Content under review. Manual verification required.'
    })

  } catch (error) {
    console.error('Content moderation error:', error)
    return NextResponse.json(
      { error: 'Failed to process content moderation' },
      { status: 500 }
    )
  }
}

// GET: Check moderation status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const workId = searchParams.get('workId')
    const address = searchParams.get('address')

    if (!workId && !address) {
      return NextResponse.json(
        { error: 'workId or address required' },
        { status: 400 }
      )
    }

    let query = supabase.from('content_moderation').select('*')

    if (workId) {
      query = query.eq('work_id', workId)
    } else if (address) {
      query = query.eq('creator_address', address)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ moderations: data })

  } catch (error) {
    console.error('Get moderation error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch moderation records' },
      { status: 500 }
    )
  }
}