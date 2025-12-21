import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateLicenseDeclaration, LicenseDeclarationData, isValidLicenseType } from '@/lib/services/license-declaration.service';

/**
 * 生成并保存作品授权声明书
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workId, workTitle, workType, authorName, walletAddress, licenseType } = body;

    // 验证必填字段
    if (!workId || !workTitle || !workType || !authorName || !walletAddress || !licenseType) {
      return NextResponse.json(
        { error: '缺少必填字段' },
        { status: 400 }
      );
    }

    // 验证授权类型
    if (!isValidLicenseType(licenseType)) {
      return NextResponse.json(
        { error: '无效的授权类型' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // 检查作品是否存在
    const { data: work, error: workError } = await supabase
      .from('works')
      .select('id, title, creator_wallet')
      .eq('id', workId)
      .single();

    if (workError || !work) {
      return NextResponse.json(
        { error: '作品不存在' },
        { status: 404 }
      );
    }

    // 验证是否为作品创作者
    if (work.creator_wallet.toLowerCase() !== walletAddress.toLowerCase()) {
      return NextResponse.json(
        { error: '只有作品创作者可以生成授权声明' },
        { status: 403 }
      );
    }

    // 生成声明书内容
    const declarationData: LicenseDeclarationData = {
      workId,
      workTitle,
      workType,
      authorName,
      walletAddress,
      licenseType,
      createdAt: new Date()
    };

    const declarationContent = generateLicenseDeclaration(declarationData);

    // 保存到数据库
    const { data: declaration, error: saveError } = await supabase
      .from('license_declarations')
      .insert({
        work_id: workId,
        work_title: workTitle,
        work_type: workType,
        author_name: authorName,
        wallet_address: walletAddress,
        license_type: licenseType,
        declaration_content: declarationContent,
        content_hash: null, // 后续可以添加IPFS哈希
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (saveError) {
      console.error('保存声明书失败:', saveError);
      return NextResponse.json(
        { error: '保存声明书失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      declaration: {
        id: declaration.id,
        workId: declaration.work_id,
        content: declaration.declaration_content,
        createdAt: declaration.created_at
      }
    });

  } catch (error) {
    console.error('生成授权声明失败:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}

/**
 * 获取作品的授权声明书
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workId = searchParams.get('workId');

    if (!workId) {
      return NextResponse.json(
        { error: '缺少作品ID' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    const { data: declaration, error } = await supabase
      .from('license_declarations')
      .select('*')
      .eq('work_id', workId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !declaration) {
      return NextResponse.json(
        { error: '未找到授权声明' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      declaration: {
        id: declaration.id,
        workId: declaration.work_id,
        workTitle: declaration.work_title,
        workType: declaration.work_type,
        authorName: declaration.author_name,
        walletAddress: declaration.wallet_address,
        licenseType: declaration.license_type,
        content: declaration.declaration_content,
        contentHash: declaration.content_hash,
        createdAt: declaration.created_at
      }
    });

  } catch (error) {
    console.error('获取授权声明失败:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}