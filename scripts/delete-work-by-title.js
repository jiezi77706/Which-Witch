#!/usr/bin/env node

/**
 * 根据标题删除作品的脚本
 * 使用方法: node scripts/delete-work-by-title.js "作品标题"
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function deleteWorkByTitle(title) {
  console.log(`🔍 搜索标题为"${title}"的作品...\n`);
  
  try {
    // 首先查找作品
    const { data: works, error: searchError } = await supabase
      .from('works')
      .select('*')
      .eq('title', title);
    
    if (searchError) {
      console.error('❌ 搜索错误:', searchError);
      return;
    }
    
    if (works.length === 0) {
      console.log('❌ 没有找到匹配的作品');
      
      // 尝试模糊搜索
      const { data: fuzzyWorks, error: fuzzyError } = await supabase
        .from('works')
        .select('*')
        .ilike('title', `%${title}%`);
      
      if (fuzzyError) {
        console.error('❌ 模糊搜索错误:', fuzzyError);
        return;
      }
      
      if (fuzzyWorks.length > 0) {
        console.log('📋 找到相似的作品:');
        fuzzyWorks.forEach(work => {
          console.log(`  - ID: ${work.work_id}, Title: ${work.title}`);
          console.log(`    Creator: ${work.creator_address}`);
          console.log('');
        });
        console.log('💡 请使用确切的标题或作品ID来删除');
      }
      return;
    }
    
    console.log(`📋 找到 ${works.length} 个匹配的作品:`);
    works.forEach(work => {
      console.log(`  - ID: ${work.work_id}`);
      console.log(`    Title: ${work.title}`);
      console.log(`    Creator: ${work.creator_address}`);
      console.log(`    Created: ${new Date(work.created_at).toLocaleDateString()}`);
      console.log('');
    });
    
    // 确认删除
    console.log('⚠️  即将删除以上作品！');
    console.log('💡 如果确认删除，请修改脚本中的CONFIRM_DELETE变量为true');
    
    const CONFIRM_DELETE = false; // 改为true来确认删除
    
    if (!CONFIRM_DELETE) {
      console.log('❌ 删除已取消（安全保护）');
      return;
    }
    
    // 执行删除
    for (const work of works) {
      console.log(`🗑️  删除作品: ${work.title} (ID: ${work.work_id})`);
      
      // 首先删除相关的统计数据
      const { error: statsError } = await supabase
        .from('work_stats')
        .delete()
        .eq('work_id', work.work_id);
      
      if (statsError) {
        console.error(`❌ 删除统计数据失败:`, statsError);
      } else {
        console.log(`  ✅ 删除统计数据成功`);
      }
      
      // 删除作品本身
      const { error: deleteError } = await supabase
        .from('works')
        .delete()
        .eq('work_id', work.work_id);
      
      if (deleteError) {
        console.error(`❌ 删除作品失败:`, deleteError);
      } else {
        console.log(`  ✅ 删除作品成功`);
      }
    }
    
    console.log('\n🎉 删除操作完成！');
    
  } catch (error) {
    console.error('❌ 删除失败:', error);
  }
}

// 获取命令行参数
const title = process.argv[2];

if (!title) {
  console.log('❌ 请提供作品标题');
  console.log('使用方法: node scripts/delete-work-by-title.js "作品标题"');
  console.log('例如: node scripts/delete-work-by-title.js "Test Work - Ready to Mint"');
  process.exit(1);
}

deleteWorkByTitle(title);