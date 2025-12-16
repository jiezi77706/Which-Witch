import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const workData = await request.json();
    
    console.log('📝 API received work data:', workData);

    // 验证 workId 不能为 0
    if (!workData.workId || workData.workId === 0) {
      console.error('❌ Invalid workId:', workData.workId);
      return NextResponse.json(
        { error: 'Invalid workId: workId cannot be 0 or null' },
        { status: 400 }
      );
    }

    // 先检查 work_id 是否已存在
    const { data: existingWork } = await supabaseAdmin
      .from('works')
      .select('work_id')
      .eq('work_id', workData.workId)
      .single();

    if (existingWork) {
      console.log('⚠️ Work already exists:', workData.workId);
      // 如果已存在，返回现有记录
      const { data: existing } = await supabaseAdmin
        .from('works')
        .select('*')
        .eq('work_id', workData.workId)
        .single();
      
      return NextResponse.json(existing);
    }

    // 如果不存在，创建新记录
    const { data, error } = await supabaseAdmin
      .from('works')
      .insert({
        work_id: workData.workId,
        creator_address: workData.creatorAddress.toLowerCase(),
        title: workData.title,
        description: workData.description || null,
        story: workData.story || null,
        image_url: workData.imageUrl,
        images: workData.images || [workData.imageUrl],
        metadata_uri: workData.metadataUri,
        material: workData.material || null,
        tags: workData.tags || null,
        allow_remix: workData.allowRemix,
        license_fee: workData.licenseFee || null,
        parent_work_id: workData.parentWorkId || null,
        is_remix: workData.isRemix,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating work:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in create work API:', error);
    return NextResponse.json(
      { error: 'Failed to create work' },
      { status: 500 }
    );
  }
}
