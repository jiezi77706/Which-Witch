import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const { userAddress, workIds } = await request.json();

    if (!userAddress || !workIds || !Array.isArray(workIds)) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 获取用户点赞的作品
    const { data, error } = await supabaseAdmin
      .from('work_likes')
      .select('work_id')
      .eq('user_address', userAddress.toLowerCase())
      .in('work_id', workIds);

    if (error) {
      console.error('Error getting user likes:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    const likedWorkIds = data?.map(item => item.work_id) || [];
    return NextResponse.json({ likedWorkIds });
  } catch (error) {
    console.error('Error in batch likes API:', error);
    return NextResponse.json(
      { error: 'Failed to get user likes' },
      { status: 500 }
    );
  }
}
