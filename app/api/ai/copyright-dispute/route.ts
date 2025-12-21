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
  contentSimilarity: number
  textSimilarity: number
  disputedRegions: any[]
  textualSimilarities: any[]
  aiConclusion: string
  aiRecommendation: string
  confidenceLevel: number
  timelineAnalysis: string
  plagiarismRisk: string
}

// 下载图片并转换为Base64
async function downloadImageAsBase64(imageUrl: string): Promise<string> {
  try {
    console.log(`📥 下载图片: ${imageUrl}`)
    
    // 如果是IPFS URL，尝试多个网关
    let urlsToTry = [imageUrl]
    if (imageUrl.includes('gateway.pinata.cloud') || imageUrl.includes('/ipfs/')) {
      const ipfsHash = imageUrl.split('/ipfs/')[1]
      if (ipfsHash) {
        urlsToTry = [
          imageUrl,
          `https://ipfs.io/ipfs/${ipfsHash}`,
          `https://cloudflare-ipfs.com/ipfs/${ipfsHash}`,
          `https://dweb.link/ipfs/${ipfsHash}`
        ]
      }
    }
    
    let lastError: Error | null = null
    for (const url of urlsToTry) {
      try {
        console.log(`   尝试网关: ${url}`)
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        })
        
        if (!response.ok) {
          console.log(`   ❌ ${response.status} ${response.statusText}`)
          lastError = new Error(`Failed to download image: ${response.status} ${response.statusText}`)
          continue
        }
        
        const arrayBuffer = await response.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const base64 = buffer.toString('base64')
        const mimeType = response.headers.get('content-type') || 'image/jpeg'
        
        console.log(`✅ 图片下载成功，大小: ${buffer.length} bytes`)
        return `data:${mimeType};base64,${base64}`
      } catch (error) {
        console.log(`   ❌ 网关失败: ${error instanceof Error ? error.message : 'Unknown error'}`)
        lastError = error instanceof Error ? error : new Error('Unknown error')
        continue
      }
    }
    
    throw lastError || new Error('All IPFS gateways failed')
    
  } catch (error) {
    console.error(`❌ 图片下载失败: ${imageUrl}`, error)
    throw error
  }
}

// Analyze copyright similarity with Qwen-VL
async function analyzeCopyrightWithQwen(
  originalImageUrl: string,
  accusedImageUrl: string,
  originalDate: Date,
  accusedDate: Date,
  originalTitle: string,
  accusedTitle: string,
  originalDescription: string,
  accusedDescription: string
): Promise<SimilarityAnalysis> {
  try {
    console.log('🔍 开始AI版权分析...')
    console.log(`   原作品图片: ${originalImageUrl}`)
    console.log(`   被举报图片: ${accusedImageUrl}`)
    console.log(`   API URL: ${QWEN_API_URL}`)
    console.log(`   API Key: ${QWEN_API_KEY ? 'configured' : 'missing'}`)

    // 下载并转换图片为Base64
    console.log('📥 下载图片并转换为Base64...')
    const originalImageBase64 = await downloadImageAsBase64(originalImageUrl)
    const accusedImageBase64 = await downloadImageAsBase64(accusedImageUrl)

    const requestBody = {
      model: 'qwen-vl-max',
      input: {
        messages: [
          {
            role: 'user',
            content: [
              { image: originalImageBase64 },
              { image: accusedImageBase64 },
              { 
                text: `Compare these two artworks for copyright infringement analysis.

ORIGINAL WORK:
- Title: "${originalTitle}"
- Description: "${originalDescription}"
- Upload Date: ${originalDate.toISOString()}

ACCUSED WORK:
- Title: "${accusedTitle}"
- Description: "${accusedDescription}"
- Upload Date: ${accusedDate.toISOString()}

Perform comprehensive similarity analysis and provide scores (0-100) for:
1. Overall Similarity (visual + textual combined)
2. Composition Similarity (layout, structure, arrangement)
3. Color Similarity (palette, color scheme, tones)
4. Character Similarity (if applicable, character features, poses)
5. Style Similarity (artistic style, technique, brushwork)
6. Content Similarity (subject matter, themes, concepts)
7. Text Similarity (title and description similarity)

CRITICAL: If Overall Similarity >= 80%, this indicates HIGH PROBABILITY of plagiarism.

Also provide:
- disputedRegions: array of specific visual areas showing similarity
- textualSimilarities: array of similar phrases/concepts in titles/descriptions
- timelineAnalysis: analysis of upload dates and copying likelihood
- aiConclusion: detailed conclusion about copyright infringement
- aiRecommendation: one of [dismiss, warning, takedown, compensation, auto_lock]
- confidenceLevel: confidence in the analysis (0-100)
- plagiarismRisk: one of [low, medium, high, critical]

Use "auto_lock" recommendation and "critical" risk if Overall Similarity >= 80%.

Return ONLY valid JSON format like this:
{
  "overallSimilarity": 85,
  "compositionSimilarity": 90,
  "colorSimilarity": 80,
  "characterSimilarity": 75,
  "styleSimilarity": 88,
  "contentSimilarity": 92,
  "textSimilarity": 60,
  "disputedRegions": ["background", "main subject"],
  "textualSimilarities": ["similar titles"],
  "timelineAnalysis": "Accused work uploaded after original",
  "aiConclusion": "High similarity detected",
  "aiRecommendation": "auto_lock",
  "confidenceLevel": 85,
  "plagiarismRisk": "critical"
}`
              }
            ]
          }
        ]
      },
      parameters: {
        result_format: 'message'
      }
    }

    console.log('📤 发送请求到Qwen API...')
    
    const response = await fetch(QWEN_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${QWEN_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    })

    console.log(`📥 API响应状态: ${response.status} ${response.statusText}`)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Qwen API错误响应:', errorText)
      throw new Error(`Qwen API error: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const data = await response.json()
    console.log('📊 API响应数据结构:', {
      hasOutput: !!data.output,
      hasChoices: !!data.output?.choices,
      choicesLength: data.output?.choices?.length || 0
    })
    
    const aiResponse = data.output?.choices?.[0]?.message?.content?.[0]?.text || '{}'
    console.log('🤖 AI分析原始响应:', aiResponse)
    
    let aiAnalysis
    try {
      // 清理响应文本，移除可能的markdown代码块标记
      const cleanResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      aiAnalysis = JSON.parse(cleanResponse)
      console.log('✅ AI响应解析成功:', aiAnalysis)
    } catch (parseError) {
      console.error('❌ AI响应解析失败:', parseError)
      console.error('原始响应:', aiResponse)
      
      // 尝试从响应中提取JSON
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try {
          aiAnalysis = JSON.parse(jsonMatch[0])
          console.log('✅ 从响应中提取JSON成功:', aiAnalysis)
        } catch (extractError) {
          console.error('❌ JSON提取也失败:', extractError)
          aiAnalysis = { 
            error: 'Failed to parse AI response', 
            rawResponse: aiResponse,
            parseError: parseError.message 
          }
        }
      } else {
        aiAnalysis = { 
          error: 'No JSON found in response', 
          rawResponse: aiResponse,
          parseError: parseError.message 
        }
      }
    }

    const result = {
      overallSimilarity: aiAnalysis.overallSimilarity || 0,
      compositionSimilarity: aiAnalysis.compositionSimilarity || 0,
      colorSimilarity: aiAnalysis.colorSimilarity || 0,
      characterSimilarity: aiAnalysis.characterSimilarity || 0,
      styleSimilarity: aiAnalysis.styleSimilarity || 0,
      contentSimilarity: aiAnalysis.contentSimilarity || 0,
      textSimilarity: aiAnalysis.textSimilarity || 0,
      disputedRegions: aiAnalysis.disputedRegions || [],
      textualSimilarities: aiAnalysis.textualSimilarities || [],
      aiConclusion: aiAnalysis.aiConclusion || 'Unable to determine - AI analysis failed',
      aiRecommendation: aiAnalysis.aiRecommendation || 'manual_review_required',
      confidenceLevel: aiAnalysis.confidenceLevel || 0,
      timelineAnalysis: aiAnalysis.timelineAnalysis || 'Timeline analysis unavailable',
      plagiarismRisk: aiAnalysis.plagiarismRisk || 'unknown'
    }

    console.log('📋 最终分析结果:', result)
    return result

  } catch (error) {
    console.error('❌ Qwen copyright analysis error:', error)
    console.error('错误详情:', {
      message: error.message,
      stack: error.stack,
      originalImageUrl,
      accusedImageUrl
    })
    
    return {
      overallSimilarity: 0,
      compositionSimilarity: 0,
      colorSimilarity: 0,
      characterSimilarity: 0,
      styleSimilarity: 0,
      contentSimilarity: 0,
      textSimilarity: 0,
      disputedRegions: [],
      textualSimilarities: [],
      aiConclusion: `AI analysis failed: ${error.message}`,
      aiRecommendation: 'manual_review_required',
      confidenceLevel: 0,
      timelineAnalysis: 'Analysis failed due to technical error',
      plagiarismRisk: 'unknown'
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
      new Date(accusedWork.created_at),
      originalWork.title,
      accusedWork.title,
      originalWork.description || '',
      accusedWork.description || ''
    )

    console.log(`🔍 AI分析结果: 相似度 ${analysis.overallSimilarity}%, 风险等级: ${analysis.plagiarismRisk}`)

    // 自动锁定逻辑：如果相似度 >= 90%，自动禁用提款功能
    let autoLockResult = null
    let shouldAutoLock = false
    
    if (analysis.overallSimilarity >= 90 && analysis.plagiarismRisk === 'critical') {
      shouldAutoLock = true
      console.log(`🚨 检测到极高度抄袭 (${analysis.overallSimilarity}%)，自动禁用提款功能...`)
      
      try {
        // 动态导入版权保护服务
        const { lockUserFunds, disableUserWithdrawals } = await import('@/lib/web3/services/copyright-protection.service')
        
        // 1. 锁定现有资金
        autoLockResult = await lockUserFunds(
          accusedAddress,
          `Automatic lock due to extreme plagiarism similarity (${analysis.overallSimilarity}%)`,
          0, // 临时争议ID，稍后更新
          undefined // 锁定所有余额
        )
        
        // 2. 禁用提款功能
        const withdrawalDisableResult = await disableUserWithdrawals(
          accusedAddress,
          `Withdrawal disabled due to ${analysis.overallSimilarity}% plagiarism similarity`,
          0 // 临时争议ID
        )
        
        if (autoLockResult.success && withdrawalDisableResult.success) {
          console.log(`✅ 用户 ${accusedAddress} 的资金已锁定且提款功能已禁用`)
          console.log(`   资金锁定交易: ${autoLockResult.txHash}`)
          console.log(`   提款禁用交易: ${withdrawalDisableResult.txHash}`)
        } else {
          console.error(`❌ 自动锁定失败:`)
          console.error(`   资金锁定: ${autoLockResult?.success ? '成功' : autoLockResult?.error}`)
          console.error(`   提款禁用: ${withdrawalDisableResult?.success ? '成功' : withdrawalDisableResult?.error}`)
        }
        
        // 合并结果
        autoLockResult = {
          success: autoLockResult.success && withdrawalDisableResult.success,
          txHash: autoLockResult.txHash,
          withdrawalDisableTxHash: withdrawalDisableResult.txHash,
          error: autoLockResult.success && withdrawalDisableResult.success 
            ? null 
            : `Fund lock: ${autoLockResult.error || 'OK'}, Withdrawal disable: ${withdrawalDisableResult.error || 'OK'}`
        }
        
      } catch (lockError) {
        console.error('❌ 自动锁定服务错误:', lockError)
        autoLockResult = {
          success: false,
          error: lockError instanceof Error ? lockError.message : 'Lock service error'
        }
      }
    } else if (analysis.overallSimilarity >= 80 && analysis.plagiarismRisk === 'critical') {
      // 80-89% 相似度：只锁定资金，不禁用提款
      shouldAutoLock = true
      console.log(`⚠️ 检测到高度抄袭 (${analysis.overallSimilarity}%)，锁定资金但保留提款权限...`)
      
      try {
        const { lockUserFunds } = await import('@/lib/web3/services/copyright-protection.service')
        
        autoLockResult = await lockUserFunds(
          accusedAddress,
          `Automatic lock due to high plagiarism similarity (${analysis.overallSimilarity}%)`,
          0,
          undefined
        )
        
        if (autoLockResult.success) {
          console.log(`✅ 用户 ${accusedAddress} 的争议资金已锁定`)
        }
      } catch (lockError) {
        console.error('❌ 资金锁定失败:', lockError)
        autoLockResult = {
          success: false,
          error: lockError instanceof Error ? lockError.message : 'Lock service error'
        }
      }
    }

    // 确定争议状态
    let disputeStatus = 'analyzing'
    if (shouldAutoLock && autoLockResult?.success) {
      if (analysis.overallSimilarity >= 90) {
        disputeStatus = 'withdrawal_disabled' // 新状态：提款已禁用
      } else {
        disputeStatus = 'auto_locked' // 状态：仅资金锁定
      }
    } else if (analysis.overallSimilarity >= 90) {
      disputeStatus = 'critical_risk' // 极高风险但操作失败
    } else if (analysis.overallSimilarity >= 80) {
      disputeStatus = 'high_risk' // 高风险但锁定失败
    }

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
        status: disputeStatus,
        similarity_score: analysis.overallSimilarity,
        composition_similarity: analysis.compositionSimilarity,
        color_similarity: analysis.colorSimilarity,
        character_similarity: analysis.characterSimilarity,
        style_similarity: analysis.styleSimilarity,
        content_similarity: analysis.contentSimilarity || 0,
        text_similarity: analysis.textSimilarity || 0,
        disputed_regions: analysis.disputedRegions,
        textual_similarities: analysis.textualSimilarities || [],
        original_work_date: originalWork.created_at,
        accused_work_date: accusedWork.created_at,
        timeline_analysis: analysis.timelineAnalysis,
        ai_conclusion: analysis.aiConclusion,
        ai_recommendation: analysis.aiRecommendation,
        confidence_level: analysis.confidenceLevel,
        plagiarism_risk: analysis.plagiarismRisk,
        works_locked: shouldAutoLock && autoLockResult?.success,
        auto_lock_tx_hash: autoLockResult?.txHash || null,
        auto_lock_reason: shouldAutoLock ? `High similarity detected (${analysis.overallSimilarity}%)` : null,
        withdrawal_disabled: analysis.overallSimilarity >= 90 && autoLockResult?.success,
        withdrawal_disable_tx_hash: autoLockResult?.withdrawalDisableTxHash || null,
        withdrawal_disable_reason: analysis.overallSimilarity >= 90 && autoLockResult?.success 
          ? `Withdrawal disabled due to extreme plagiarism (${analysis.overallSimilarity}%)` 
          : null,
        analyzed_at: new Date().toISOString(),
        ai_report: {
          analysis,
          autoLockResult,
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

    // 如果自动锁定成功，更新争议ID到锁定记录
    if (shouldAutoLock && autoLockResult?.success && dispute.id) {
      try {
        const { lockUserFunds } = await import('@/lib/web3/services/copyright-protection.service')
        // 重新锁定以更新争议ID（实际实现中应该有更新函数）
        await lockUserFunds(
          accusedAddress,
          `Automatic lock due to high plagiarism similarity (${analysis.overallSimilarity}%) - Dispute #${dispute.id}`,
          dispute.id
        )
      } catch (updateError) {
        console.error('❌ 更新锁定记录失败:', updateError)
      }
    }

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
      autoLock: {
        triggered: shouldAutoLock,
        success: autoLockResult?.success || false,
        txHash: autoLockResult?.txHash,
        withdrawalDisabled: analysis.overallSimilarity >= 90 && autoLockResult?.success,
        withdrawalDisableTxHash: autoLockResult?.withdrawalDisableTxHash,
        error: autoLockResult?.error
      },
      message: analysis.overallSimilarity >= 90 && autoLockResult?.success
        ? `CRITICAL: ${analysis.overallSimilarity}% similarity detected. User funds locked and withdrawal disabled.`
        : shouldAutoLock && autoLockResult?.success 
        ? `Copyright dispute created and user funds automatically locked due to ${analysis.overallSimilarity}% similarity`
        : 'Copyright dispute created and analyzed by AI'
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
