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
      console.log('🔄 Updating existing work with new data...');
      
      // 更新现有记录而不是返回旧记录
      const { data: updatedWork, error: updateError } = await supabaseAdmin
        .from('works')
        .update({
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
          updated_at: new Date().toISOString()
        })
        .eq('work_id', workData.workId)
        .select()
        .single();
      
      if (updateError) {
        console.error('❌ Error updating existing work:', updateError);
        return NextResponse.json(
          { error: updateError.message },
          { status: 500 }
        );
      }
      
      console.log('✅ Work updated successfully');
      
      // 更新许可证信息
      if (workData.licenseSelection) {
        console.log('💾 Updating license information...');
        
        try {
          const { error: licenseError } = await supabaseAdmin
            .rpc('save_work_license', {
              p_work_id: workData.workId,
              p_commercial: workData.licenseSelection.commercial,
              p_derivative: workData.licenseSelection.derivative,
              p_nft: workData.licenseSelection.nft,
              p_sharealike: workData.licenseSelection.shareAlike,
            });

          if (licenseError) {
            console.error('⚠️ License update failed:', licenseError);
          } else {
            console.log('✅ License information updated successfully');
          }
        } catch (licenseErr) {
          console.error('⚠️ License update error:', licenseErr);
        }
      }
      
      return NextResponse.json(updatedWork);
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

    // 如果有许可证信息，保存许可证信息
    if (workData.licenseSelection) {
      console.log('💾 Saving license information...');
      
      try {
        const { error: licenseError } = await supabaseAdmin
          .rpc('save_work_license', {
            p_work_id: workData.workId,
            p_commercial: workData.licenseSelection.commercial,
            p_derivative: workData.licenseSelection.derivative,
            p_nft: workData.licenseSelection.nft,
            p_sharealike: workData.licenseSelection.shareAlike,
          });

        if (licenseError) {
          console.error('⚠️ License save failed:', licenseError);
          // 不阻止作品创建，只记录错误
        } else {
          console.log('✅ License information saved successfully');
        }
      } catch (licenseErr) {
        console.error('⚠️ License save error:', licenseErr);
        // 不阻止作品创建
      }
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
