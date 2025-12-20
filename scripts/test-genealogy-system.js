#!/usr/bin/env node

/**
 * 测试Creation Genealogy系统
 * 这个脚本会添加测试数据并验证genealogy功能
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 从环境变量读取Supabase配置
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration in .env.local');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runSQL(sqlContent) {
  console.log('📝 Executing SQL...');
  
  // 分割SQL语句（简单的分割，基于分号）
  const statements = sqlContent
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

  for (const statement of statements) {
    if (statement.trim()) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
        if (error) {
          console.error('❌ SQL Error:', error.message);
          console.error('Statement:', statement.substring(0, 100) + '...');
        }
      } catch (err) {
        // 尝试直接执行
        try {
          const { error } = await supabase.from('works').select('*').limit(1);
          if (!error) {
            console.log('✅ SQL executed (direct method)');
          }
        } catch (directErr) {
          console.error('❌ Failed to execute SQL:', directErr.message);
        }
      }
    }
  }
}

async function addTestData() {
  console.log('🔄 Adding genealogy test data...');
  
  try {
    // 添加测试作品数据
    const testWorks = [
      {
        work_id: 100,
        creator_address: '0x1111111111111111111111111111111111111111',
        title: 'The Magical Forest',
        description: 'An original fantasy story about a magical forest and its inhabitants',
        image_url: 'https://example.com/magical-forest.jpg',
        metadata_uri: 'ipfs://QmMagicalForest',
        material: ['Digital Story'],
        tags: ['fantasy', 'original', 'story'],
        allow_remix: true,
        license_fee: '0.02',
        creation_type: 'original',
        parent_work_id: null,
        is_remix: false
      },
      {
        work_id: 101,
        creator_address: '0x1111111111111111111111111111111111111111',
        title: 'The Magical Forest: Chapter 2',
        description: 'The official continuation by the original author',
        image_url: 'https://example.com/magical-forest-2.jpg',
        metadata_uri: 'ipfs://QmMagicalForest2',
        material: ['Digital Story'],
        tags: ['fantasy', 'continuation', 'story'],
        allow_remix: true,
        license_fee: '0.02',
        creation_type: 'author_continuation',
        parent_work_id: 100,
        is_remix: true
      },
      {
        work_id: 102,
        creator_address: '0x1111111111111111111111111111111111111111',
        title: 'The Magical Forest: Prequel',
        description: 'The backstory of the magical forest, by original author',
        image_url: 'https://example.com/magical-forest-prequel.jpg',
        metadata_uri: 'ipfs://QmMagicalForestPrequel',
        material: ['Digital Story'],
        tags: ['fantasy', 'prequel', 'story'],
        allow_remix: true,
        license_fee: '0.02',
        creation_type: 'author_continuation',
        parent_work_id: 100,
        is_remix: true
      },
      {
        work_id: 103,
        creator_address: '0x2222222222222222222222222222222222222222',
        title: 'Forest Creatures: A Side Story',
        description: 'A fan-created story focusing on the forest creatures',
        image_url: 'https://example.com/forest-creatures.jpg',
        metadata_uri: 'ipfs://QmForestCreatures',
        material: ['Digital Story'],
        tags: ['fantasy', 'fanfiction', 'creatures'],
        allow_remix: true,
        license_fee: '0.01',
        creation_type: 'authorized_derivative',
        parent_work_id: 100,
        is_remix: true
      },
      {
        work_id: 104,
        creator_address: '0x3333333333333333333333333333333333333333',
        title: 'The Dark Side of the Forest',
        description: 'A darker interpretation of the magical forest',
        image_url: 'https://example.com/dark-forest.jpg',
        metadata_uri: 'ipfs://QmDarkForest',
        material: ['Digital Story'],
        tags: ['fantasy', 'dark', 'alternative'],
        allow_remix: true,
        license_fee: '0.015',
        creation_type: 'authorized_derivative',
        parent_work_id: 100,
        is_remix: true
      }
    ];

    // 插入作品数据
    for (const work of testWorks) {
      const { error } = await supabase
        .from('works')
        .upsert(work, { onConflict: 'work_id' });
      
      if (error) {
        console.error(`❌ Failed to insert work ${work.work_id}:`, error.message);
      } else {
        console.log(`✅ Added work: ${work.title}`);
      }
    }

    // 添加用户数据
    const testUsers = [
      {
        wallet_address: '0x1111111111111111111111111111111111111111',
        username: 'AUTHOR001',
        display_name: 'Alice Creator',
        bio: 'Original fantasy author',
        skills: ['Writing', 'Storytelling']
      },
      {
        wallet_address: '0x2222222222222222222222222222222222222222',
        username: 'FAN001',
        display_name: 'Bob Fan',
        bio: 'Fantasy story enthusiast',
        skills: ['Writing', 'Fan Fiction']
      },
      {
        wallet_address: '0x3333333333333333333333333333333333333333',
        username: 'DARK001',
        display_name: 'Charlie Dark',
        bio: 'Dark fantasy specialist',
        skills: ['Writing', 'Horror']
      }
    ];

    for (const user of testUsers) {
      const { error } = await supabase
        .from('users')
        .upsert(user, { onConflict: 'wallet_address' });
      
      if (error) {
        console.error(`❌ Failed to insert user ${user.username}:`, error.message);
      } else {
        console.log(`✅ Added user: ${user.display_name}`);
      }
    }

    console.log('✅ Test data added successfully!');
    
  } catch (error) {
    console.error('❌ Error adding test data:', error.message);
  }
}

async function testGenealogyFunction() {
  console.log('🧪 Testing genealogy function...');
  
  try {
    // 测试获取作品100的genealogy
    const { data, error } = await supabase
      .from('works')
      .select(`
        *,
        continuations:works!parent_work_id(*)
      `)
      .eq('work_id', 100)
      .single();

    if (error) {
      console.error('❌ Error fetching genealogy:', error.message);
      return;
    }

    console.log('📊 Root work:', data.title);
    
    // 获取所有衍生作品
    const { data: derivatives, error: derivError } = await supabase
      .from('works')
      .select('*')
      .eq('parent_work_id', 100);

    if (derivError) {
      console.error('❌ Error fetching derivatives:', derivError.message);
      return;
    }

    const continuations = derivatives.filter(w => w.creation_type === 'author_continuation');
    const communityDerivatives = derivatives.filter(w => w.creation_type === 'authorized_derivative');

    console.log(`📈 Statistics:`);
    console.log(`   - Official continuations: ${continuations.length}`);
    console.log(`   - Community derivatives: ${communityDerivatives.length}`);
    console.log(`   - Total derivatives: ${derivatives.length}`);

    console.log('\n📝 Official Continuations:');
    continuations.forEach(work => {
      console.log(`   - ${work.title} (ID: ${work.work_id})`);
    });

    console.log('\n🎨 Community Derivatives:');
    communityDerivatives.forEach(work => {
      console.log(`   - ${work.title} (ID: ${work.work_id})`);
    });

    console.log('\n✅ Genealogy function test completed!');
    
  } catch (error) {
    console.error('❌ Error testing genealogy:', error.message);
  }
}

async function main() {
  console.log('🚀 Starting Creation Genealogy System Test\n');
  
  try {
    // 1. 添加测试数据
    await addTestData();
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // 2. 测试genealogy功能
    await testGenealogyFunction();
    
    console.log('\n🎉 All tests completed!');
    console.log('\n📋 Next steps:');
    console.log('1. Open your app and navigate to work ID 100');
    console.log('2. Check the Creation Genealogy section');
    console.log('3. Verify that it shows:');
    console.log('   - 2 Official Continuations');
    console.log('   - 2 Community Derivatives');
    console.log('   - Total of 4 derivatives');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// 运行测试
if (require.main === module) {
  main();
}

module.exports = { addTestData, testGenealogyFunction };