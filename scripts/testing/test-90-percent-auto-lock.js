#!/usr/bin/env node

/**
 * 测试90%相似度自动禁用提款功能
 * 验证极高相似度时的自动锁定和提款禁用
 */

// 加载环境变量
require('dotenv').config({ path: '.env.local' });

// 模拟浏览器环境的fetch
global.fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function test90PercentAutoLock() {
  console.log('🚨 测试90%相似度自动禁用提款功能\n');

  try {
    // 测试数据 - 模拟极高相似度的抄袭案例
    const disputeData = {
      reporterAddress: '0x1111111111111111111111111111111111111111',
      accusedAddress: '0x2222222222222222222222222222222222222222',
      originalWorkId: 1,
      accusedWorkId: 2,
      disputeReason: 'Copyright Infringement / Plagiarism - Identical work detected',
      evidenceDescription: '测试90%+相似度自动禁用提款功能 - 使用相同图片应该触发提款禁用',
      evidenceUrls: ['https://example.com/evidence-critical.jpg']
    };

    console.log('📤 发送极高相似度举报请求...');
    console.log(`   举报者: ${disputeData.reporterAddress}`);
    console.log(`   被举报者: ${disputeData.accusedAddress}`);
    console.log(`   原作品ID: ${disputeData.originalWorkId}`);
    console.log(`   被举报作品ID: ${disputeData.accusedWorkId}`);
    
    const response = await fetch('http://localhost:3002/api/ai/copyright-dispute', {
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
      
      // 分析结果
      const analysis = result.analysis;
      if (analysis) {
        console.log('\n📊 AI分析结果:');
        console.log(`   总体相似度: ${analysis.overallSimilarity}%`);
        console.log(`   风险等级: ${analysis.plagiarismRisk}`);
        console.log(`   AI建议: ${analysis.aiRecommendation}`);
        console.log(`   AI结论: ${analysis.aiConclusion}`);
        console.log(`   置信度: ${analysis.confidenceLevel}%`);
        
        // 详细相似度分析
        console.log('\n🔍 详细相似度分析:');
        console.log(`   构图相似度: ${analysis.compositionSimilarity}%`);
        console.log(`   色彩相似度: ${analysis.colorSimilarity}%`);
        console.log(`   角色相似度: ${analysis.characterSimilarity}%`);
        console.log(`   风格相似度: ${analysis.styleSimilarity}%`);
        console.log(`   内容相似度: ${analysis.contentSimilarity}%`);
        console.log(`   文本相似度: ${analysis.textSimilarity}%`);
      }
      
      // 自动锁定结果
      const autoLock = result.autoLock;
      if (autoLock) {
        console.log('\n🔒 自动锁定结果:');
        console.log(`   触发锁定: ${autoLock.triggered ? '✅' : '❌'}`);
        console.log(`   锁定成功: ${autoLock.success ? '✅' : '❌'}`);
        
        if (autoLock.success) {
          console.log(`   资金锁定交易: ${autoLock.txHash}`);
          
          // 检查是否触发了提款禁用
          if (autoLock.withdrawalDisabled) {
            console.log('🚫 提款功能已禁用:');
            console.log(`   提款禁用: ✅ 已禁用`);
            console.log(`   禁用交易: ${autoLock.withdrawalDisableTxHash}`);
            console.log('   🎯 测试成功：90%+相似度自动禁用提款功能正常工作！');
          } else {
            console.log('⚠️ 提款功能未被禁用');
            if (analysis?.overallSimilarity >= 90) {
              console.log('❌ 错误：相似度≥90%但未禁用提款功能');
            } else {
              console.log(`ℹ️ 相似度${analysis?.overallSimilarity}%未达到90%阈值`);
            }
          }
        } else {
          console.log(`   锁定失败原因: ${autoLock.error}`);
        }
      }
      
      // 显示最终消息
      console.log(`\n💬 系统消息: ${result.message}`);
      
      // 验证预期行为
      console.log('\n🧪 验证测试结果:');
      if (analysis?.overallSimilarity >= 90) {
        if (autoLock?.withdrawalDisabled) {
          console.log('✅ 测试通过：90%+相似度成功触发提款禁用');
        } else {
          console.log('❌ 测试失败：90%+相似度未触发提款禁用');
        }
      } else if (analysis?.overallSimilarity >= 80) {
        if (autoLock?.success && !autoLock?.withdrawalDisabled) {
          console.log('✅ 测试通过：80-89%相似度仅锁定资金，未禁用提款');
        } else {
          console.log('⚠️ 80-89%相似度行为异常');
        }
      } else {
        console.log(`ℹ️ 相似度${analysis?.overallSimilarity}%低于阈值，未触发自动锁定`);
      }

    } else {
      const error = await response.json();
      console.log('❌ 版权争议创建失败:', error.error);
      
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
console.log('🚀 启动90%相似度自动禁用提款测试...\n');
test90PercentAutoLock().catch(console.error);