#!/usr/bin/env node

/**
 * 测试Qwen API直接调用 - 使用Base64图片
 * 用于调试AI分析问题
 */

// 加载环境变量
require('dotenv').config({ path: '.env.local' });

// 模拟浏览器环境的fetch
global.fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// 下载图片并转换为Base64
async function downloadImageAsBase64(imageUrl) {
  try {
    console.log(`📥 下载图片: ${imageUrl}`)
    
    // 如果是IPFS URL，尝试多个网关
    let urlsToTry = [imageUrl]
    if (imageUrl.includes('gateway.pinata.cloud')) {
      const ipfsHash = imageUrl.split('/ipfs/')[1]
      urlsToTry = [
        imageUrl,
        `https://ipfs.io/ipfs/${ipfsHash}`,
        `https://cloudflare-ipfs.com/ipfs/${ipfsHash}`,
        `https://dweb.link/ipfs/${ipfsHash}`
      ]
    }
    
    let lastError
    for (const url of urlsToTry) {
      try {
        console.log(`   尝试: ${url}`)
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        })
        
        if (!response.ok) {
          console.log(`   ❌ ${response.status} ${response.statusText}`)
          lastError = new Error(`Failed to download image: ${response.status} ${response.statusText}`)
          continue
        }
        
        const arrayBuffer = await response.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const base64 = buffer.toString('base64')
        const mimeType = response.headers.get('content-type') || 'image/jpeg'
        
        console.log(`✅ 图片下载成功，大小: ${buffer.length} bytes`)
        return `data:${mimeType};base64,${base64}`
      } catch (error) {
        console.log(`   ❌ 下载失败: ${error.message}`)
        lastError = error
        continue
      }
    }
    
    throw lastError || new Error('All download attempts failed')
    
  } catch (error) {
    console.error(`❌ 图片下载失败: ${imageUrl}`, error)
    throw error
  }
}

async function testQwenAPIWithBase64() {
  console.log('🤖 测试Qwen API - Base64图片方法\n');

  const QWEN_API_URL = process.env.QWEN_API_URL || 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation';
  const QWEN_API_KEY = process.env.QWEN_API_KEY;

  console.log('📋 配置检查:');
  console.log(`   API URL: ${QWEN_API_URL}`);
  console.log(`   API Key: ${QWEN_API_KEY ? 'configured' : 'missing'}`);

  if (!QWEN_API_KEY) {
    console.log('❌ QWEN_API_KEY未配置');
    return;
  }

  try {
    // 测试相同的IPFS图片（应该显示100%相似度）
    console.log('\n🔍 测试相同IPFS图片的相似度分析...');
    
    const imageUrl = 'https://gateway.pinata.cloud/ipfs/QmWi84jPeyUFj86bYAiZHkZFkketUPCeFUbzVmjSDhZFYV';
    
    // 下载并转换为Base64
    const imageBase64 = await downloadImageAsBase64(imageUrl);
    console.log(`📊 Base64长度: ${imageBase64.length} 字符`);
    
    const imageRequest = {
      model: 'qwen-vl-max',
      input: {
        messages: [
          {
            role: 'user',
            content: [
              { image: imageBase64 },
              { image: imageBase64 }, // 相同的图片
              { 
                text: `Compare these two images for copyright infringement analysis. They are the SAME image, so similarity should be 100%.

Analyze and return ONLY valid JSON format like this:
{
  "overallSimilarity": 100,
  "compositionSimilarity": 100,
  "colorSimilarity": 100,
  "characterSimilarity": 100,
  "styleSimilarity": 100,
  "contentSimilarity": 100,
  "textSimilarity": 0,
  "disputedRegions": ["entire image"],
  "textualSimilarities": [],
  "timelineAnalysis": "Same image uploaded twice",
  "aiConclusion": "These images are identical - 100% plagiarism",
  "aiRecommendation": "auto_lock",
  "confidenceLevel": 100,
  "plagiarismRisk": "critical"
}`
              }
            ]
          }
        ]
      },
      parameters: {
        result_format: 'message'
      }
    };

    console.log('📤 发送Base64图片分析请求...');
    
    const response = await fetch(QWEN_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${QWEN_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(imageRequest)
    });

    console.log(`📥 响应状态: ${response.status} ${response.statusText}`);

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Base64图片分析测试成功');
      
      const aiResponse = data.output?.choices?.[0]?.message?.content?.[0]?.text;
      console.log('🤖 AI响应文本:', aiResponse);
      
      // 尝试解析JSON
      try {
        // 清理响应文本，移除可能的markdown代码块标记
        const cleanResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsed = JSON.parse(cleanResponse);
        console.log('✅ JSON解析成功:', parsed);
        
        if (parsed.overallSimilarity >= 80) {
          console.log('🚨 检测到高相似度，应该触发自动锁定');
          console.log(`   相似度: ${parsed.overallSimilarity}%`);
          console.log(`   风险等级: ${parsed.plagiarismRisk}`);
          console.log(`   AI建议: ${parsed.aiRecommendation}`);
        } else {
          console.log(`ℹ️ 相似度较低: ${parsed.overallSimilarity}%`);
        }
      } catch (parseError) {
        console.log('❌ JSON解析失败:', parseError.message);
        console.log('原始响应:', aiResponse);
        
        // 尝试从响应中提取JSON
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            const extracted = JSON.parse(jsonMatch[0]);
            console.log('✅ 从响应中提取JSON成功:', extracted);
          } catch (extractError) {
            console.log('❌ JSON提取也失败:', extractError.message);
          }
        }
      }
    } else {
      const errorText = await response.text();
      console.log('❌ Base64图片分析测试失败:', errorText);
    }

  } catch (error) {
    console.log('❌ 测试失败:', error.message);
    console.log('错误详情:', error);
  }
}

// 运行测试
testQwenAPIWithBase64().catch(console.error);