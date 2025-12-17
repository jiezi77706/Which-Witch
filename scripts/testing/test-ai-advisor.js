#!/usr/bin/env node

/**
 * WhichWitch AI授权顾问测试脚本
 * 测试Qwen API集成和AI顾问功能
 */

require('dotenv').config({ path: '.env.local' })

async function testAIAdvisor() {
  console.log('🤖 Testing WhichWitch AI Advisor...\n')

  try {
    // 1. 检查环境变量
    console.log('1️⃣ Checking environment variables...')
    if (!process.env.QWEN_API_KEY) {
      throw new Error('QWEN_API_KEY not found in environment')
    }
    if (!process.env.QWEN_BASE_URL) {
      throw new Error('QWEN_BASE_URL not found in environment')
    }
    console.log('✅ Environment variables configured')
    console.log(`   API URL: ${process.env.QWEN_BASE_URL}`)
    console.log(`   API Key: ${process.env.QWEN_API_KEY.slice(0, 10)}...`)
    console.log('')

    // 2. 测试AI API连接
    console.log('2️⃣ Testing Qwen API connection...')
    
    const testMessage = {
      model: 'qwen-plus',
      messages: [
        {
          role: 'system',
          content: 'You are an AI licensing advisor for the WhichWitch platform, specializing in providing licensing strategy recommendations for creators. Always respond in English.'
        },
        {
          role: 'user',
          content: 'Hello, please briefly introduce your functions.'
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    }

    const response = await fetch(`${process.env.QWEN_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.QWEN_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testMessage),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API request failed: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    
    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid API response format')
    }

    console.log('✅ Qwen API connection successful')
    console.log('📝 AI Response:')
    console.log(data.choices[0].message.content)
    console.log('')

    // 3. 测试授权建议功能
    console.log('3️⃣ Testing authorization advice functionality...')
    
    const advisorMessage = {
      model: 'qwen-plus',
      messages: [
        {
          role: 'system',
          content: `You are a professional AI licensing advisor for the WhichWitch platform, specializing in providing intelligent licensing strategy recommendations for creators. Always respond in English.

Current Work Information:
- Title: Cyberpunk City Illustration
- Description: Futuristic cityscape with neon lights and high-tech elements
- Tags: cyberpunk, digital, futuristic
- Materials: Digital
- Allow Derivatives: Yes
- Current License Fee: 0.05 ETH`
        },
        {
          role: 'user',
          content: 'Please help me analyze the reasonable licensing price for this work and provide pricing recommendations.'
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    }

    const advisorResponse = await fetch(`${process.env.QWEN_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.QWEN_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(advisorMessage),
    })

    if (!advisorResponse.ok) {
      throw new Error(`Advisor API request failed: ${advisorResponse.status}`)
    }

    const advisorData = await advisorResponse.json()
    
    console.log('✅ Authorization advice generated successfully')
    console.log('💡 AI Advisor Response:')
    console.log(advisorData.choices[0].message.content)
    console.log('')

    // 4. 测试API使用统计
    if (data.usage) {
      console.log('4️⃣ API Usage Statistics:')
      console.log(`   Prompt tokens: ${data.usage.prompt_tokens}`)
      console.log(`   Completion tokens: ${data.usage.completion_tokens}`)
      console.log(`   Total tokens: ${data.usage.total_tokens}`)
      console.log('')
    }

    console.log('🎉 AI Advisor test completed successfully!')
    console.log('\n📋 Test Summary:')
    console.log('✅ Environment configuration')
    console.log('✅ Qwen API connection')
    console.log('✅ Authorization advice generation')
    console.log('✅ Response format validation')

  } catch (error) {
    console.error('\n❌ AI Advisor test failed:', error.message)
    
    if (error.message.includes('API key')) {
      console.log('\n💡 Troubleshooting:')
      console.log('- Check if QWEN_API_KEY is correctly set in .env.local')
      console.log('- Verify the API key is valid and has sufficient quota')
    } else if (error.message.includes('network') || error.message.includes('fetch')) {
      console.log('\n💡 Troubleshooting:')
      console.log('- Check internet connection')
      console.log('- Verify QWEN_BASE_URL is correct')
      console.log('- Check if there are any firewall restrictions')
    }
    
    process.exit(1)
  }
}

// 运行测试
if (require.main === module) {
  testAIAdvisor()
}

module.exports = { testAIAdvisor }