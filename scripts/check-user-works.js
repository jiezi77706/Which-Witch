#!/usr/bin/env node

/**
 * 检查当前用户的作品列表
 * 帮助确认"Test Work - Ready to Mint"是否存在
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkUserWorks() {
  console.log('🔍 检查所有用户的作品...\n');
  
  // 获取所有用户
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('wallet_address, name');
  
  if (usersError) {
    console.error('❌ 获取用户错误:', usersError);
    return;
  }
  
  console.log(`📊 找到 ${users.length} 个用户:\n`);
  
  for (const user of users) {
    console.log(`👤 用户: ${user.name || user.wallet_address.slice(0, 8) + '...'} (${user.wallet_address})`);
    
    // 获取该用户的作品
    const { data: works, error: worksError } = await supabase
      .from('works')
      .select('work_id, title, created_at, is_remix')
      .eq('creator_address', user.wallet_address)
      .order('created_at', { ascending: false });
    
    if (worksError) {
      console.error(`❌ 获取用户${user.wallet_address}的作品错误:`, worksError);
      continue;
    }
    
    if (works.length === 0) {
      console.log('   📝 没有作品\n');
      continue;
    }
    
    console.log(`   📝 作品 (${works.length}个):`);
    works.forEach(work => {
      const type = work.is_remix ? '🔄 Remix' : '🎨 Original';
      console.log(`     ${type} - ID: ${work.work_id}, Title: ${work.title}`);
      console.log(`       Created: ${new Date(work.created_at).toLocaleDateString()}`);
    });
    console.log('');
  }
}

async function searchSpecificWork() {
  console.log('🔍 搜索特定的测试作品...\n');
  
  // 搜索可能的测试作品标题
  const searchTerms = [
    'Test Work',
    'Ready to Mint',
    'Test',
    'Demo',
    'Sample',
    'Example'
  ];
  
  for (const term of searchTerms) {
    const { data: works, error } = await supabase
      .from('works')
      .select('*')
      .ilike('title', `%${term}%`);
    
    if (error) {
      console.error(`❌ 搜索"${term}"错误:`, error);
      continue;
    }
    
    if (works.length > 0) {
      console.log(`📋 包含"${term}"的作品:`);
      works.forEach(work => {
        console.log(`  - ID: ${work.work_id}`);
        console.log(`    Title: ${work.title}`);
        console.log(`    Creator: ${work.creator_address}`);
        console.log(`    Created: ${new Date(work.created_at).toLocaleDateString()}`);
        console.log(`    Description: ${work.description || 'N/A'}`);
        console.log('');
      });
    }
  }
}

async function main() {
  console.log('🚀 开始检查用户作品\n');
  
  try {
    await checkUserWorks();
    
    console.log('='.repeat(60) + '\n');
    
    await searchSpecificWork();
    
    console.log('✅ 检查完成！\n');
    console.log('💡 如果你在Profile页面看到"Test Work - Ready to Mint"，但这里没有显示，可能是：');
    console.log('   1. 浏览器缓存问题 - 尝试硬刷新 (Cmd+Shift+R)');
    console.log('   2. 前端状态问题 - 尝试重新登录');
    console.log('   3. 数据已经被删除，但前端还没有更新');
    console.log('   4. 你看到的是其他页面的mock数据');
    
  } catch (error) {
    console.error('❌ 检查失败:', error);
  }
}

main();