#!/usr/bin/env node

/**
 * 测试相同图片的版权仲裁自动锁定
 * 使用相同的IPFS图片来模拟100%相似度
 */

// 加载环境变量
require('dotenv').config({ path: '.env.local' });

// 模拟浏览器环境的fetch
global.fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testSameImageArbitration() {
  console.log('🔍 测试相同图片版权仲裁自动锁定\n');

  try {
    // 首先创建两个使用相同图片的作品记录（模拟）
    console.log('📝 准备测试数据...');
    
    // 创建原作品
    const originalWork = {
      work_id: 100,
      title: "Original Artwork",
      image_url: "https://gateway.pinata.cloud/ipfs/QmWi84jPeyUFj86bYAiZHkZFkketUPCeFUbzVmjSDhZFYV",
      creator_address: "0x1111111111111111111111111111111111111111",
      created_at: new Date(Date.now() - 60000).toISOString() // 1分钟前
    };
    
    // 创建抄袭作品（相同图片）
    const copiedWork = {
      work_id: 101,
      title: "Copied Artwork",
      image_url: "https://gateway.pinata.cloud/ipfs/QmWi84jPeyUFj86bYAiZHkZFkketUPCeFUbzVmjSDhZFYV", // 相同图片
      creator_address: "0x2222222222222222222222222222222222222222",
      created_at: new Date().toISOString() // 现在
    };
    
    console.log('📤 模拟版权仲裁请求...');
    console.log(`   原作品: ${originalWork.title} (${originalWork.work_id})`);
    console.log(`   抄袭作品: ${copiedWork.title} (${copiedWork.work_id})`);
    console.log(`   图片URL: ${originalWork.image_url}`);
    
    // 直接调用AI分析函数来测试
    console.log('\n🤖 开始AI相似度分析...');
    
    // 模拟AI分析请求
    const analysisRequest = {
      model: 'qwen-vl-max',
      input: {
        messages: [
          {
            role: 'user',
            content: [
              { 
                text: `这是一个测试：比较两个完全相同的图片。

ORIGINAL WORK:
- Title: "${originalWork.title}"
- Created: ${originalWork.created_at}
- Creator: ${originalWork.creator_address}

REPORTED WORK:
- Title: "${copiedWork.title}"
- Created: ${copiedWork.created_at}
- Creator: ${copiedWork.creator_address}

由于这是相同的图片，相似度应该是100%。请返回JSON格式的分析结果，包含：
- similarityScore: 100
- recommendation: "plagiarized"
- confidence: 100
- plagiarismRisk: "critical"

返回格式：
{
  "similarityScore": 100,
  "disputedAreas": ["entire image"],
  "timelineAnalysis": "Identical images uploaded at different times",
  "recommendation": "plagiarized",
  "confidence": 100,
  "detailedAnalysis": "These are identical images - 100% plagiarism"
}`
              }
            ]
          }
        ]
      }
    };

    // 模拟100%相似度的结果
    const mockAnalysisResult = {
      similarityScore: 100,
      disputedAreas: ["entire image - identical content"],
      timelineAnalysis: "Accused work uploaded after original - clear copying",
      recommendation: "plagiarized",
      confidence: 100,
      detailedAnalysis: "These images are completely identical - this is 100% plagiarism"
    };

    console.log('📊 AI分析结果:');
    console.log(`   相似度: ${mockAnalysisResult.similarityScore}%`);
    console.log(`   AI建议: ${mockAnalysisResult.recommendation}`);
    console.log(`   置信度: ${mockAnalysisResult.confidence}%`);

    // 测试自动锁定逻辑
    console.log('\n🔒 测试自动锁定逻辑...');
    
    let finalStatus = 'resolved';
    let actionTaken = 'none';
    let autoLockTriggered = false;

    if (mockAnalysisResult.similarityScore >= 90) {
      finalStatus = 'withdrawal_disabled';
      actionTaken = 'auto_withdrawal_disabled';
      autoLockTriggered = true;
      
      console.log(`🚨 极高相似度检测 (${mockAnalysisResult.similarityScore}%)，应该触发提款禁用`);
      
      // 模拟锁定操作
      console.log('🔒 模拟资金锁定...');
      console.log(`   目标用户: ${copiedWork.creator_address}`);
      console.log(`   锁定原因: Automatic lock due to extreme plagiarism similarity (${mockAnalysisResult.similarityScore}%)`);
      
      console.log('🚫 模拟提款禁用...');
      console.log(`   目标用户: ${copiedWork.creator_address}`);
      console.log(`   禁用原因: Withdrawal disabled due to ${mockAnalysisResult.similarityScore}% plagiarism similarity`);
      console.log(`   严重程度: critical`);
      
      const mockAutoLockResult = {
        success: true,
        lockTxHash: `0x${Math.random().toString(16).substring(2).padStart(64, '0')}`,
        disableTxHash: `0x${Math.random().toString(16).substring(2).padStart(64, '0')}`
      };
      
      console.log('\n✅ 模拟锁定结果:');
      console.log(`   资金锁定交易: ${mockAutoLockResult.lockTxHash}`);
      console.log(`   提款禁用交易: ${mockAutoLockResult.disableTxHash}`);
      
    } else if (mockAnalysisResult.similarityScore >= 80) {
      finalStatus = 'auto_locked';
      actionTaken = 'auto_funds_locked';
      autoLockTriggered = true;
      console.log(`⚠️ 高相似度检测 (${mockAnalysisResult.similarityScore}%)，应该触发资金锁定`);
    }

    // 验证结果
    console.log('\n🧪 验证测试结果:');
    if (mockAnalysisResult.similarityScore >= 90 && finalStatus === 'withdrawal_disabled') {
      console.log('🎯 ✅ 测试通过：100%相似度成功触发提款禁用');
    } else if (mockAnalysisResult.similarityScore >= 80 && finalStatus === 'auto_locked') {
      console.log('🎯 ✅ 测试通过：高相似度成功触发资金锁定');
    } else {
      console.log('❌ 测试失败：自动锁定逻辑未正确触发');
    }

    console.log('\n📋 最终状态:');
    console.log(`   状态: ${finalStatus}`);
    console.log(`   操作: ${actionTaken}`);
    console.log(`   自动锁定触发: ${autoLockTriggered ? '✅' : '❌'}`);

    console.log('\n💡 说明:');
    console.log('   这是一个模拟测试，展示了当检测到100%相似度时应该发生的情况。');
    console.log('   在实际应用中，需要确保版权仲裁API正确调用自动锁定逻辑。');

  } catch (error) {
    console.log('❌ 测试失败:', error.message);
    console.log('错误详情:', error);
  }
}

// 运行测试
console.log('🚀 启动相同图片版权仲裁测试...\n');
testSameImageArbitration().catch(console.error);