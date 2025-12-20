#!/usr/bin/env node

/**
 * 测试版权仲裁API的自动锁定功能
 * 验证98%相似度是否触发自动锁定
 */

// 加载环境变量
require('dotenv').config({ path: '.env.local' });

// 模拟浏览器环境的fetch
global.fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testArbitrationAutoLock() {
  console.log('🔍 测试版权仲裁API自动锁定功能\n');

  try {
    // 模拟版权仲裁请求
    const arbitrationData = {
      reportId: 4499, // 使用日志中的报告ID
      reportedWorkId: 2,
      originalWorkId: 1
    };

    console.log('📤 发送版权仲裁请求...');
    console.log(`   报告ID: ${arbitrationData.reportId}`);
    console.log(`   原作品ID: ${arbitrationData.originalWorkId}`);
    console.log(`   被举报作品ID: ${arbitrationData.reportedWorkId}`);
    
    const response = await fetch('http://localhost:3002/api/ai/copyright-arbitration', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(arbitrationData),
    });

    console.log(`📥 响应状态: ${response.status} ${response.statusText}`);

    if (response.ok) {
      const result = await response.json();
      console.log('✅ 版权仲裁完成');
      
      const report = result.report;
      if (report) {
        console.log('\n📊 仲裁结果:');
        console.log(`   相似度: ${report.similarityScore}%`);
        console.log(`   AI建议: ${report.recommendation}`);
        console.log(`   置信度: ${report.confidence}%`);
        console.log(`   状态: ${report.status}`);
        console.log(`   操作: ${report.actionTaken}`);
        
        // 检查自动锁定结果
        if (report.autoLock) {
          console.log('\n🔒 自动锁定结果:');
          console.log(`   锁定成功: ${report.autoLock.success ? '✅' : '❌'}`);
          
          if (report.autoLock.success) {
            if (report.autoLock.lockTxHash) {
              console.log(`   资金锁定交易: ${report.autoLock.lockTxHash}`);
            }
            if (report.autoLock.disableTxHash) {
              console.log(`   提款禁用交易: ${report.autoLock.disableTxHash}`);
            }
            
            // 验证预期行为
            if (report.similarityScore >= 90) {
              if (report.status === 'withdrawal_disabled') {
                console.log('🎯 测试成功：90%+相似度触发提款禁用');
              } else {
                console.log('❌ 测试失败：90%+相似度未触发提款禁用');
              }
            } else if (report.similarityScore >= 80) {
              if (report.status === 'auto_locked') {
                console.log('🎯 测试成功：80%+相似度触发资金锁定');
              } else {
                console.log('❌ 测试失败：80%+相似度未触发资金锁定');
              }
            }
          } else {
            console.log(`   锁定失败: ${report.autoLock.error}`);
          }
        } else {
          console.log('\n⚠️ 未触发自动锁定');
          if (report.similarityScore >= 80) {
            console.log('❌ 错误：相似度≥80%但未触发自动锁定');
          } else {
            console.log(`ℹ️ 相似度${report.similarityScore}%未达到80%阈值`);
          }
        }
        
        // 显示争议区域
        if (report.disputedAreas && report.disputedAreas.length > 0) {
          console.log('\n🔍 争议区域:');
          report.disputedAreas.forEach((area, index) => {
            console.log(`   ${index + 1}. ${area}`);
          });
        }
      }
      
      console.log(`\n💬 系统消息: ${result.message}`);

    } else {
      const error = await response.json();
      console.log('❌ 版权仲裁失败:', error.error);
      
      if (error.message) {
        console.log('错误详情:', error.message);
      }
    }

  } catch (error) {
    console.log('❌ 测试失败:', error.message);
    console.log('💡 请确保开发服务器正在运行: npm run dev');
    console.log('错误详情:', error);
  }
}

// 运行测试
console.log('🚀 启动版权仲裁自动锁定测试...\n');
testArbitrationAutoLock().catch(console.error);