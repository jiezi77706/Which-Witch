import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET: Fetch all license options
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'all', 'descriptions', 'licenses'

    if (type === 'descriptions') {
      // Get option descriptions (A1, A2, B1, etc.)
      const { data, error } = await supabase
        .from('license_option_descriptions')
        .select('*')
        .order('option_category', { ascending: true })
        .order('sort_order', { ascending: true })

      if (error) throw error

      // Group by category
      const grouped = data.reduce((acc: any, item: any) => {
        if (!acc[item.option_category]) {
          acc[item.option_category] = []
        }
        acc[item.option_category].push(item)
        return acc
      }, {})

      return NextResponse.json({
        descriptions: data,
        grouped
      })
    }

    if (type === 'licenses') {
      // Get predefined licenses
      const { data, error } = await supabase
        .from('license_options')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

      if (error) throw error

      return NextResponse.json({
        licenses: data
      })
    }

    // Default: get both
    const [descriptionsResult, licensesResult] = await Promise.all([
      supabase
        .from('license_option_descriptions')
        .select('*')
        .order('option_category', { ascending: true })
        .order('sort_order', { ascending: true }),
      supabase
        .from('license_options')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
    ])

    if (descriptionsResult.error) throw descriptionsResult.error
    if (licensesResult.error) throw licensesResult.error

    // Group descriptions by category
    const grouped = descriptionsResult.data.reduce((acc: any, item: any) => {
      if (!acc[item.option_category]) {
        acc[item.option_category] = []
      }
      acc[item.option_category].push(item)
      return acc
    }, {})

    return NextResponse.json({
      descriptions: descriptionsResult.data,
      grouped,
      licenses: licensesResult.data
    })

  } catch (error) {
    console.error('Get license options error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch license options' },
      { status: 500 }
    )
  }
}
