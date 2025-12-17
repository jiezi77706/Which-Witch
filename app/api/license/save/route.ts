import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface SaveLicenseRequest {
  workId: number
  commercial: string // A1, A2, A3
  derivative: string // B1, B2
  nft: string // C1, C2
  shareAlike: string // D1, D2
  customTerms?: string
  aiRecommended?: boolean
  aiData?: any
}

export async function POST(request: NextRequest) {
  try {
    const body: SaveLicenseRequest = await request.json()
    const { workId, commercial, derivative, nft, shareAlike, customTerms, aiRecommended, aiData } = body

    if (!workId || !commercial || !derivative || !nft || !shareAlike) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Call the database function to save license
    const { data, error } = await supabase.rpc('save_work_license', {
      p_work_id: workId,
      p_commercial: commercial,
      p_derivative: derivative,
      p_nft: nft,
      p_sharealike: shareAlike,
      p_custom_terms: customTerms || null,
      p_ai_recommended: aiRecommended || false,
      p_ai_data: aiData || null
    })

    if (error) throw error

    // Fetch the saved license info
    const { data: licenseData, error: fetchError } = await supabase
      .from('work_licenses')
      .select('*')
      .eq('work_id', workId)
      .single()

    if (fetchError) throw fetchError

    return NextResponse.json({
      success: true,
      license: licenseData,
      message: 'License saved successfully'
    })

  } catch (error) {
    console.error('Save license error:', error)
    return NextResponse.json(
      { error: 'Failed to save license' },
      { status: 500 }
    )
  }
}

// GET: Fetch license for a work
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const workId = searchParams.get('workId')

    if (!workId) {
      return NextResponse.json(
        { error: 'workId required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('work_licenses')
      .select(`
        *,
        license_options (
          license_code,
          license_name,
          description,
          license_url
        )
      `)
      .eq('work_id', workId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      throw error
    }

    return NextResponse.json({
      license: data || null
    })

  } catch (error) {
    console.error('Get license error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch license' },
      { status: 500 }
    )
  }
}
