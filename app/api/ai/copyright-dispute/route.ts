import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const QWEN_API_URL = process.env.QWEN_API_URL || 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation'
const QWEN_API_KEY = process.env.QWEN_API_KEY

interface DisputeRequest {
  reporterAddress: string
  accusedAddress: string
  originalWorkId: number
  accusedWorkId: number
  disputeReason: string
  evidenceDescription?: string
  evidenceUrls?: string[]
}

interface SimilarityAnalysis {
  overallSimilarity: number
  compositionSimilarity: number
  colorSimilarity: number
  characterSimilarity: number
  styleSimilarity: number
  disputedRegions: any[]
  aiConclusion: string
  aiRecommendation: string
  confidenceLevel: number
  timelineAnalysis: string
}

// Analyze copyright similarity with Qwen-VL
async function analyzeCopyrightWithQwen(
  originalImageUrl: string,
  accusedImageUrl: string,
  originalDate: Date,
  accusedDate: Date
): Promise<SimilarityAnalysis> {
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
                { image: originalImageUrl },
                { image: accusedImageUrl },
                { 
                  text: `Compare these two artworks for copyright infringement analysis.

Original work uploaded: ${originalDate.toISOString()}
Accused work uploaded: ${accusedDate.toISOString()}

Analyze and provide scores (0-100) for:
1. Overall Similarity
2. Composition Similarity (layout, structure)
3. Color Similarity (palette, color scheme)
4. Character Similarity (if applicable, character features)
5. Style Similarity (artistic style, technique)

Also provide:
- disputedRegions: array of specific areas that show similarity (with descriptions)
- timelineAnalysis: analysis of upload dates and potential copying
- aiConclusion: detailed conclusion about copyright infringement
- aiRecommendation: one of [dismiss, warning, takedown, compensation]
- confidenceLevel: confidence in the analysis (0-100)

Return ONLY valid JSON format.`
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

    return {
      overallSimilarity: aiAnalysis.overallSimilarity || 0,
      compositionSimilarity: aiAnalysis.compositionSimilarity || 0,
      colorSimilarity: aiAnalysis.colorSimilarity || 0,
      characterSimilarity: aiAnalysis.characterSimilarity || 0,
      styleSimilarity: aiAnalysis.styleSimilarity || 0,
      disputedRegions: aiAnalysis.disputedRegions || [],
      aiConclusion: aiAnalysis.aiConclusion || 'Unable to determine',
      aiRecommendation: aiAnalysis.aiRecommendation || 'dismiss',
      confidenceLevel: aiAnalysis.confidenceLevel || 50,
      timelineAnalysis: aiAnalysis.timelineAnalysis || 'Timeline analysis unavailable'
    }
  } catch (error) {
    console.error('Qwen copyright analysis error:', error)
    return {
      overallSimilarity: 0,
      compositionSimilarity: 0,
      colorSimilarity: 0,
      characterSimilarity: 0,
      styleSimilarity: 0,
      disputedRegions: [],
      aiConclusion: 'AI analysis unavailable',
      aiRecommendation: 'dismiss',
      confidenceLevel: 0,
      timelineAnalysis: 'Timeline analysis unavailable'
    }
  }
}

// POST: Create copyright dispute
export async function POST(request: NextRequest) {
  try {
    const body: DisputeRequest = await request.json()
    const {
      reporterAddress,
      accusedAddress,
      originalWorkId,
      accusedWorkId,
      disputeReason,
      evidenceDescription,
      evidenceUrls
    } = body

    if (!reporterAddress || !accusedAddress || !originalWorkId || !accusedWorkId || !disputeReason) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Fetch both works
    const { data: works, error: worksError } = await supabase
      .from('works')
      .select('*')
      .in('work_id', [originalWorkId, accusedWorkId])

    if (worksError || !works || works.length !== 2) {
      return NextResponse.json(
        { error: 'Failed to fetch works' },
        { status: 404 }
      )
    }

    const originalWork = works.find(w => w.work_id === originalWorkId)
    const accusedWork = works.find(w => w.work_id === accusedWorkId)

    if (!originalWork || !accusedWork) {
      return NextResponse.json(
        { error: 'Works not found' },
        { status: 404 }
      )
    }

    // Analyze similarity with Qwen-VL
    const analysis = await analyzeCopyrightWithQwen(
      originalWork.image_url,
      accusedWork.image_url,
      new Date(originalWork.created_at),
      new Date(accusedWork.created_at)
    )

    // Create dispute record
    const { data: dispute, error: disputeError } = await supabase
      .from('copyright_disputes')
      .insert({
        reporter_address: reporterAddress,
        accused_address: accusedAddress,
        original_work_id: originalWorkId,
        accused_work_id: accusedWorkId,
        dispute_reason: disputeReason,
        evidence_description: evidenceDescription,
        evidence_urls: evidenceUrls || [],
        status: 'analyzing',
        similarity_score: analysis.overallSimilarity,
        composition_similarity: analysis.compositionSimilarity,
        color_similarity: analysis.colorSimilarity,
        character_similarity: analysis.characterSimilarity,
        style_similarity: analysis.styleSimilarity,
        disputed_regions: analysis.disputedRegions,
        original_work_date: originalWork.created_at,
        accused_work_date: accusedWork.created_at,
        timeline_analysis: analysis.timelineAnalysis,
        ai_conclusion: analysis.aiConclusion,
        ai_recommendation: analysis.aiRecommendation,
        confidence_level: analysis.confidenceLevel,
        works_locked: true,
        analyzed_at: new Date().toISOString(),
        ai_report: {
          analysis,
          originalWork: {
            id: originalWork.work_id,
            title: originalWork.title,
            creator: originalWork.creator_address
          },
          accusedWork: {
            id: accusedWork.work_id,
            title: accusedWork.title,
            creator: accusedWork.creator_address
          }
        }
      })
      .select()
      .single()

    if (disputeError) throw disputeError

    // Add evidence if provided
    if (evidenceUrls && evidenceUrls.length > 0) {
      const evidenceRecords = evidenceUrls.map(url => ({
        dispute_id: dispute.id,
        evidence_type: 'link',
        evidence_url: url,
        description: evidenceDescription,
        uploaded_by: reporterAddress
      }))

      await supabase.from('dispute_evidence').insert(evidenceRecords)
    }

    return NextResponse.json({
      success: true,
      dispute,
      analysis,
      message: 'Copyright dispute created and analyzed by AI'
    })

  } catch (error) {
    console.error('Copyright dispute error:', error)
    return NextResponse.json(
      { error: 'Failed to create copyright dispute' },
      { status: 500 }
    )
  }
}

// GET: Fetch disputes
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const disputeId = searchParams.get('disputeId')
    const address = searchParams.get('address')
    const workId = searchParams.get('workId')

    let query = supabase
      .from('copyright_disputes')
      .select(`
        *,
        original_work:works!copyright_disputes_original_work_id_fkey(work_id, title, image_url, creator_address),
        accused_work:works!copyright_disputes_accused_work_id_fkey(work_id, title, image_url, creator_address)
      `)

    if (disputeId) {
      query = query.eq('id', disputeId)
    } else if (address) {
      query = query.or(`reporter_address.eq.${address},accused_address.eq.${address}`)
    } else if (workId) {
      query = query.or(`original_work_id.eq.${workId},accused_work_id.eq.${workId}`)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ disputes: data })

  } catch (error) {
    console.error('Get disputes error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch disputes' },
      { status: 500 }
    )
  }
}

// PATCH: Resolve dispute
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { disputeId, resolution, resolutionDetails, resolvedBy } = body

    if (!disputeId || !resolution || !resolvedBy) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .rpc('resolve_dispute', {
        p_dispute_id: disputeId,
        p_resolution: resolution,
        p_resolution_details: resolutionDetails,
        p_resolved_by: resolvedBy
      })

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: 'Dispute resolved successfully'
    })

  } catch (error) {
    console.error('Resolve dispute error:', error)
    return NextResponse.json(
      { error: 'Failed to resolve dispute' },
      { status: 500 }
    )
  }
}
