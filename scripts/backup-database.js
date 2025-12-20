#!/usr/bin/env node

/**
 * 备份数据库中的作品数据
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 从项目根目录读取 .env.local
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

// 从环境变量读取 Supabase 配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 错误: 请确保设置了 SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY 环境变量');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function backupDatabase() {
  console.log('💾 开始备份数据库...\n');
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = `backups`;
  const backupFile = `database-backup-${timestamp}.json`;
  const backupPath = path.join(backupDir, backupFile);
  
  try {
    // 创建备份目录
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
      console.log('📁 创建备份目录:', backupDir);
    }
    
    const backupData = {
      timestamp: new Date().toISOString(),
      description: '数据库备份 - 新合约部署前',
      tables: {}
    };
    
    // 1. 备份作品表
    console.log('📋 备份作品表 (works)...');
    const { data: works, error: worksError } = await supabase
      .from('works')
      .select('*')
      .order('work_id', { ascending: true });
    
    if (worksError) {
      console.error('❌ 备份作品表失败:', worksError);
      return;
    }
    
    backupData.tables.works = works;
    console.log(`✅ 备份了 ${works.length} 个作品记录`);
    
    // 2. 备份许可证表
    console.log('📋 备份许可证表 (work_licenses)...');
    const { data: licenses, error: licensesError } = await supabase
      .from('work_licenses')
      .select('*')
      .order('work_id', { ascending: true });
    
    if (licensesError) {
      console.warn('⚠️ 备份许可证表失败:', licensesError);
      backupData.tables.work_licenses = [];
    } else {
      backupData.tables.work_licenses = licenses || [];
      console.log(`✅ 备份了 ${licenses?.length || 0} 个许可证记录`);
    }
    
    // 3. 备份点赞表
    console.log('📋 备份点赞表 (likes)...');
    const { data: likes, error: likesError } = await supabase
      .from('likes')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (likesError) {
      console.warn('⚠️ 备份点赞表失败:', likesError);
      backupData.tables.likes = [];
    } else {
      backupData.tables.likes = likes || [];
      console.log(`✅ 备份了 ${likes?.length || 0} 个点赞记录`);
    }
    
    // 4. 备份收藏表
    console.log('📋 备份收藏表 (collections)...');
    const { data: collections, error: collectionsError } = await supabase
      .from('collections')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (collectionsError) {
      console.warn('⚠️ 备份收藏表失败:', collectionsError);
      backupData.tables.collections = [];
    } else {
      backupData.tables.collections = collections || [];
      console.log(`✅ 备份了 ${collections?.length || 0} 个收藏记录`);
    }
    
    // 5. 备份内容审核表
    console.log('📋 备份内容审核表 (content_moderation)...');
    const { data: moderation, error: moderationError } = await supabase
      .from('content_moderation')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (moderationError) {
      console.warn('⚠️ 备份内容审核表失败:', moderationError);
      backupData.tables.content_moderation = [];
    } else {
      backupData.tables.content_moderation = moderation || [];
      console.log(`✅ 备份了 ${moderation?.length || 0} 个审核记录`);
    }
    
    // 6. 备份授权请求表
    console.log('📋 备份授权请求表 (authorization_requests)...');
    const { data: authRequests, error: authError } = await supabase
      .from('authorization_requests')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (authError) {
      console.warn('⚠️ 备份授权请求表失败:', authError);
      backupData.tables.authorization_requests = [];
    } else {
      backupData.tables.authorization_requests = authRequests || [];
      console.log(`✅ 备份了 ${authRequests?.length || 0} 个授权请求记录`);
    }
    
    // 保存备份文件
    fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
    
    console.log('\n🎉 备份完成!');
    console.log(`📄 备份文件: ${backupPath}`);
    console.log(`📊 备份统计:`);
    console.log(`   作品: ${backupData.tables.works.length} 条`);
    console.log(`   许可证: ${backupData.tables.work_licenses.length} 条`);
    console.log(`   点赞: ${backupData.tables.likes.length} 条`);
    console.log(`   收藏: ${backupData.tables.collections.length} 条`);
    console.log(`   审核: ${backupData.tables.content_moderation.length} 条`);
    console.log(`   授权: ${backupData.tables.authorization_requests.length} 条`);
    
    // 创建备份摘要
    const summaryFile = path.join(backupDir, `backup-summary-${timestamp}.txt`);
    const summary = `
数据库备份摘要
================
备份时间: ${backupData.timestamp}
备份文件: ${backupFile}

数据统计:
- 作品记录: ${backupData.tables.works.length} 条
- 许可证记录: ${backupData.tables.work_licenses.length} 条
- 点赞记录: ${backupData.tables.likes.length} 条
- 收藏记录: ${backupData.tables.collections.length} 条
- 审核记录: ${backupData.tables.content_moderation.length} 条
- 授权请求: ${backupData.tables.authorization_requests.length} 条

作品详情:
${backupData.tables.works.map(work => 
  `- Work ID ${work.work_id}: "${work.title}" by ${work.creator_address} (${work.created_at})`
).join('\n')}

恢复方法:
1. 使用 restore-database.js 脚本
2. 或手动导入 JSON 文件到 Supabase
`;
    
    fs.writeFileSync(summaryFile, summary);
    console.log(`📋 备份摘要: ${summaryFile}`);
    
    return backupPath;
    
  } catch (error) {
    console.error('❌ 备份过程中出现错误:', error);
    throw error;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  backupDatabase().catch(console.error);
}

module.exports = { backupDatabase };