import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const { userId, workId, folderId, note } = await request.json();
    
    console.log('📝 API received collection request:', { userId, workId, folderId, note })

    if (!userId || !workId || !folderId) {
      console.error('❌ Missing required fields:', { userId, workId, folderId })
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('💾 Inserting to collections table...')
    
    const { data, error } = await supabaseAdmin
      .from('collections')
      .insert({
        user_id: userId,
        work_id: workId,
        folder_id: folderId,
        note: note || null,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase error adding collection:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    console.log('✅ Collection added successfully:', data)
    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ Error in add collection API:', error);
    return NextResponse.json(
      { error: 'Failed to add collection' },
      { status: 500 }
    );
  }
}
