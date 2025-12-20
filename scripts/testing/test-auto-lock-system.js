#!/usr/bin/env node

/**
 * 测试完整的自动锁定系统
 * 使用Base64图片方法
 */

// 加载环境变量
require('dotenv').config({ path: '.env.local' });

// 模拟浏览器环境的fetch
global.fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testCompleteAutoLockSystem() {
  console.log('🔒 测试完整自动锁定系统 (Base64方法)\n');

  try {
    // 1. 测试版权争议创建和自动锁定
    console.log('1️⃣ 测试版权争议创建...');
    
    const disputeData = {
      reporterAddress: '0x1234567890123456789012345678901234567890',
      accusedAddress: '0x0987654321098765432109876543210987654321',
      originalWorkId: 1,
      accusedWorkId: 2,
      disputeReason: 'Copyright Infringement / Plagiarism - This work copies or plagiarizes another work',
      evidenceDescription: '测试自动锁定功能 - 使用相同图片测试100%相似度',
      evidenceUrls: ['https://example.com/evidence1.jpg']
    };

    console.log('📤 发送举报请求...');
    const response = await fetch('http://localhost:3001/api/ai/copyright-dispute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(disputeData),
    });

    console.log(`📥 响应状态: ${response.status} ${response.statusText}`);

    if (response.ok) {
      const result = await response.json();
      console.log('✅ 版权争议创建成功');
      console.log(`   争议ID: ${result.dispute?.id || 'N/A'}`);
      console.log(`   相似度: ${result.analysis?.overallSimilarity || 0}%`);
      console.log(`   风险等级: ${result.analysis?.plagiarismRisk || 'unknown'}`);
      console.log(`   AI建议: ${result.analysis?.aiRecommendation || 'unknown'}`);
      console.log(`   AI结论: ${result.analysis?.aiConclusion || 'N/A'}`);
      
      if (result.autoLock?.triggered) {
        console.log('🚨 自动锁定已触发');
        console.log(`   锁定成功: ${result.autoLock.success ? '✅' : '❌'}`);
        if (result.autoLock.success) {
          console.log(`   交易哈希: ${result.autoLock.txHash}`);
        } else {
          console.log(`   锁定失败: ${result.autoLock.error}`);
        }
      } else {
        console.log('ℹ️ 未触发自动锁定');
        if (result.analysis?.overallSimilarity < 80) {
          console.log(`   原因: 相似度 ${result.analysis.overallSimilarity}% 低于80%阈值`);
        }
      }

      // 显示详细的分析结果
      if (result.analysis) {
        console.log('\n📊 详细分析结果:');
        console.log(`   构图相似度: ${result.analysis.compositionSimilarity}%`);
        console.log(`   色彩相似度: ${result.analysis.colorSimilarity}%`);
        console.log(`   角色相似度: ${result.analysis.characterSimilarity}%`);
        console.log(`   风格相似度: ${result.analysis.styleSimilarity}%`);
        console.log(`   内容相似度: ${result.analysis.contentSimilarity}%`);
        console.log(`   文本相似度: ${result.analysis.textSimilarity}%`);
        console.log(`   置信度: ${result.analysis.confidenceLevel}%`);
      }

      // 2. 测试锁定用户查询
      if (result.autoLock?.success) {
        console.log('\n2️⃣ 测试锁定用户查询...');
        
        const lockedUsersResponse = await fetch('http://localhost:3001/api/admin/locked-users');
        
        if (lockedUsersResponse.ok) {
          const lockedData = await lockedUsersResponse.json();
          console.log('✅ 锁定用户查询成功');
          console.log(`   锁定用户数: ${lockedData.count}`);
          
          if (lockedData.lockedUsers.length > 0) {
            console.log('   锁定用户列表:');
            lockedData.lockedUsers.forEach((user, index) => {
              console.log(`   ${index + 1}. ${user.address}`);
              console.log(`      争议ID: ${user.disputeId}`);
              console.log(`      锁定金额: ${user.lockedAmount} wei`);
              console.log(`      锁定原因: ${user.reason}`);
            });
          }
        } else {
          console.log('❌ 锁定用户查询失败');
        }
      }

    } else {
      const error = await response.json();
      console.log('❌ 版权争议创建失败:', error.error);
      
      // 显示更多错误信息
      if (error.details) {
        console.log('错误详情:', error.details);
      }
    }

  } catch (error) {
    console.log('❌ 测试失败:', error.message);
    console.log('💡 请确保开发服务器正在运行: npm run dev');
    console.log('错误详情:', error);
  }
}

// 运行测试
console.log('🚀 启动完整自动锁定系统测试...\n');
testCompleteAutoLockSystem().catch(console.error);