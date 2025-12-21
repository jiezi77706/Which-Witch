#!/usr/bin/env node

/**
 * 从备份文件恢复数据库数据
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

async function restoreDatabase(backupFilePath) {
  console.log('🔄 开始恢复数据库...\n');
  
  try {
    // 检查备份文件是否存在
    if (!fs.existsSync(backupFilePath)) {
      console.error('❌ 备份文件不存在:', backupFilePath);
      return;
    }
    
    // 读取备份数据
    console.log('📖 读取备份文件:', backupFilePath);
    const backupData = JSON.parse(fs.readFileSync(backupFilePath, 'utf8'));
    
    console.log('📊 备份信息:');
    console.log(`   备份时间: ${backupData.timestamp}`);
    console.log(`   描述: ${backupData.description}`);
    
    // 恢复作品表
    if (backupData.tables.works && backupData.tables.works.length > 0) {
      console.log(`\n📋 恢复作品表 (${backupData.tables.works.length} 条记录)...`);
      
      for (const work of backupData.tables.works) {
        try {
          const { error } = await supabase
            .from('works')
            .upsert(work, { onConflict: 'work_id' });
          
          if (error) {
            console.error(`❌ 恢复作品 ${work.work_id} 失败:`, error.message);
          } else {
            console.log(`✅ 恢复作品 ${work.work_id}: "${work.title}"`);
          }
        } catch (err) {
          console.error(`❌ 恢复作品 ${work.work_id} 出错:`, err.message);
        }
      }
    }
    
    // 恢复许可证表
    if (backupData.tables.work_licenses && backupData.tables.work_licenses.length > 0) {
      console.log(`\n📋 恢复许可证表 (${backupData.tables.work_licenses.length} 条记录)...`);
      
      const { error: licensesError } = await supabase
        .from('work_licenses')
        .upsert(backupData.tables.work_licenses, { onConflict: 'work_id' });
      
      if (licensesError) {
        console.error('❌ 恢复许可证表失败:', licensesError);
      } else {
        console.log('✅ 许可证表恢复成功');
      }
    }
    
    // 恢复点赞表
    if (backupData.tables.likes && backupData.tables.likes.length > 0) {
      console.log(`\n📋 恢复点赞表 (${backupData.tables.likes.length} 条记录)...`);
      
      const { error: likesError } = await supabase
        .from('likes')
        .upsert(backupData.tables.likes, { onConflict: 'id' });
      
      if (likesError) {
        console.error('❌ 恢复点赞表失败:', likesError);
      } else {
        console.log('✅ 点赞表恢复成功');
      }
    }
    
    // 恢复收藏表
    if (backupData.tables.collections && backupData.tables.collections.length > 0) {
      console.log(`\n📋 恢复收藏表 (${backupData.tables.collections.length} 条记录)...`);
      
      const { error: collectionsError } = await supabase
        .from('collections')
        .upsert(backupData.tables.collections, { onConflict: 'id' });
      
      if (collectionsError) {
        console.error('❌ 恢复收藏表失败:', collectionsError);
      } else {
        console.log('✅ 收藏表恢复成功');
      }
    }
    
    // 恢复内容审核表
    if (backupData.tables.content_moderation && backupData.tables.content_moderation.length > 0) {
      console.log(`\n📋 恢复内容审核表 (${backupData.tables.content_moderation.length} 条记录)...`);
      
      const { error: moderationError } = await supabase
        .from('content_moderation')
        .upsert(backupData.tables.content_moderation, { onConflict: 'id' });
      
      if (moderationError) {
        console.error('❌ 恢复内容审核表失败:', moderationError);
      } else {
        console.log('✅ 内容审核表恢复成功');
      }
    }
    
    // 恢复授权请求表
    if (backupData.tables.authorization_requests && backupData.tables.authorization_requests.length > 0) {
      console.log(`\n📋 恢复授权请求表 (${backupData.tables.authorization_requests.length} 条记录)...`);
      
      const { error: authError } = await supabase
        .from('authorization_requests')
        .upsert(backupData.tables.authorization_requests, { onConflict: 'id' });
      
      if (authError) {
        console.error('❌ 恢复授权请求表失败:', authError);
      } else {
        console.log('✅ 授权请求表恢复成功');
      }
    }
    
    console.log('\n🎉 数据库恢复完成!');
    
  } catch (error) {
    console.error('❌ 恢复过程中出现错误:', error);
    throw error;
  }
}

// 显示使用说明
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('数据库恢复工具使用说明:');
  console.log('');
  console.log('恢复数据:');
  console.log('  node scripts/restore-database.js <backup-file-path>');
  console.log('  例如: node scripts/restore-database.js backups/database-backup-2023-12-20T10-30-00-000Z.json');
  console.log('');
  process.exit(0);
}

// 如果直接运行此脚本
if (require.main === module) {
  const backupFilePath = process.argv[2];
  
  if (!backupFilePath) {
    console.error('❌ 请提供备份文件路径');
    console.log('用法: node scripts/restore-database.js <backup-file-path>');
    process.exit(1);
  }
  
  restoreDatabase(backupFilePath).catch(console.error);
}

module.exports = { restoreDatabase };