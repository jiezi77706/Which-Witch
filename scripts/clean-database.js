#!/usr/bin/env node

/**
 * 清理数据库中的旧作品记录
 */

const { createClient } = require('@supabase/supabase-js');
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

async function cleanDatabase() {
  console.log('🧹 开始清理数据库...\n');
  
  try {
    // 1. 查看当前作品数据
    console.log('📊 查看当前作品数据...');
    const { data: works, error: selectError } = await supabase
      .from('works')
      .select('work_id, title, creator_address, created_at')
      .order('work_id', { ascending: true });
    
    if (selectError) {
      console.error('❌ 查询作品失败:', selectError);
      return;
    }
    
    console.log(`📋 找到 ${works.length} 个作品记录:`);
    works.forEach(work => {
      console.log(`   Work ID ${work.work_id}: "${work.title}" by ${work.creator_address} (${work.created_at})`);
    });
    
    // 2. 询问是否要删除特定记录
    console.log('\n🤔 选择操作:');
    console.log('1. 删除所有作品记录（重新开始）');
    console.log('2. 删除特定 work_id 的记录');
    console.log('3. 只查看，不删除');
    console.log('4. 完全清理（删除所有相关表的数据）');
    
    // 由于这是自动脚本，我们提供一个安全的默认选项
    const action = process.argv[2] || '3';
    
    switch (action) {
      case '1':
        console.log('\n🗑️ 删除所有作品记录...');
        const { error: deleteAllError } = await supabase
          .from('works')
          .delete()
          .neq('work_id', 0); // 删除所有 work_id 不等于 0 的记录
        
        if (deleteAllError) {
          console.error('❌ 删除失败:', deleteAllError);
        } else {
          console.log('✅ 所有作品记录已删除');
        }
        break;
        
      case '2':
        const workIdToDelete = process.argv[3];
        if (!workIdToDelete) {
          console.log('❌ 请提供要删除的 work_id');
          console.log('用法: node clean-database.js 2 <work_id>');
          return;
        }
        
        console.log(`\n🗑️ 删除 work_id ${workIdToDelete} 的记录...`);
        const { error: deleteOneError } = await supabase
          .from('works')
          .delete()
          .eq('work_id', parseInt(workIdToDelete));
        
        if (deleteOneError) {
          console.error('❌ 删除失败:', deleteOneError);
        } else {
          console.log(`✅ Work ID ${workIdToDelete} 已删除`);
        }
        break;
        
      case '4':
        console.log('\n🧹 完全清理所有相关数据...');
        
        // 清理所有相关表
        const tablesToClean = [
          'authorization_requests',
          'work_licenses', 
          'content_moderation'
        ];
        
        for (const table of tablesToClean) {
          console.log(`🗑️ 清理表: ${table}...`);
          try {
            const { error } = await supabase
              .from(table)
              .delete()
              .neq('id', 0); // 删除所有记录
            
            if (error) {
              console.error(`❌ 清理 ${table} 失败:`, error.message);
            } else {
              console.log(`✅ ${table} 已清理`);
            }
          } catch (err) {
            console.error(`❌ 清理 ${table} 出错:`, err.message);
          }
        }
        
        // 特别处理 works 表（使用 work_id）
        console.log('🗑️ 清理 works 表...');
        const { error: worksError } = await supabase
          .from('works')
          .delete()
          .neq('work_id', 0);
        
        if (worksError) {
          console.error('❌ 清理 works 表失败:', worksError.message);
        } else {
          console.log('✅ works 表已清理');
        }
        
        break;
        
      case '3':
      default:
        console.log('\n👀 只查看模式，没有删除任何记录');
        break;
    }
    
    // 3. 清理相关的许可证记录（选项1的旧逻辑，现在移到选项4）
    if (action === '1') {
      console.log('\n🧹 清理许可证记录...');
      const { error: licensesError } = await supabase
        .from('work_licenses')
        .delete()
        .neq('work_id', 0);
      
      if (licensesError) {
        console.error('❌ 清理许可证记录失败:', licensesError);
      } else {
        console.log('✅ 许可证记录已清理');
      }
    }
    
    // 4. 显示清理后的状态
    console.log('\n📊 清理后的状态:');
    const { data: finalWorks } = await supabase
      .from('works')
      .select('work_id, title')
      .order('work_id', { ascending: true });
    
    console.log(`📋 剩余 ${finalWorks?.length || 0} 个作品记录`);
    
    console.log('\n🎉 数据库清理完成!');
    
  } catch (error) {
    console.error('❌ 清理过程中出现错误:', error);
  }
}

// 显示使用说明
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('数据库清理工具使用说明:');
  console.log('');
  console.log('查看模式（默认）:');
  console.log('  node scripts/clean-database.js');
  console.log('');
  console.log('删除所有记录:');
  console.log('  node scripts/clean-database.js 1');
  console.log('');
  console.log('删除特定记录:');
  console.log('  node scripts/clean-database.js 2 <work_id>');
  console.log('  例如: node scripts/clean-database.js 2 3');
  console.log('');
  console.log('完全清理（删除所有相关表）:');
  console.log('  node scripts/clean-database.js 4');
  console.log('');
  console.log('⚠️ 选项4会删除以下表的所有数据:');
  console.log('  - works (作品)');
  console.log('  - work_licenses (许可证)');
  console.log('  - authorization_requests (授权请求)');
  console.log('  - content_moderation (内容审核)');
  console.log('');
  process.exit(0);
}

// 如果直接运行此脚本
if (require.main === module) {
  cleanDatabase().catch(console.error);
}

module.exports = { cleanDatabase };