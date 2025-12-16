import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const { workId, userAddress } = await request.json();

    if (!workId || !userAddress) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 检查是否已经点赞
    const { data: existing } = await supabaseAdmin
      .from('work_likes')
      .select('*')
      .eq('work_id', workId)
      .eq('user_address', userAddress.toLowerCase())
      .single();

    if (existing) {
      // 已经点赞，取消点赞
      await supabaseAdmin
        .from('work_likes')
        .delete()
        .eq('work_id', workId)
        .eq('user_address', userAddress.toLowerCase());

      // 更新统计
      await supabaseAdmin.rpc('decrement_like_count', { work_id_param: workId });

      return NextResponse.json({ liked: false });
    } else {
      // 添加点赞
      await supabaseAdmin
        .from('work_likes')
        .insert({
          work_id: workId,
          user_address: userAddress.toLowerCase(),
        });

      // 更新统计
      await supabaseAdmin.rpc('increment_like_count', { work_id_param: workId });

      return NextResponse.json({ liked: true });
    }
  } catch (error) {
    console.error('Error in like API:', error);
    return NextResponse.json(
      { error: 'Failed to process like' },
      { status: 500 }
    );
  }
}
