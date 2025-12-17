#!/usr/bin/env node

/**
 * AI Moderation System Test Script
 * Tests content moderation and copyright dispute APIs
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

// Test data
const testData = {
  moderation: {
    workId: 1,
    imageUrl: 'https://example.com/test-image.jpg',
    creatorAddress: '0x1234567890123456789012345678901234567890',
    stakeAmount: '0.01',
    stakeTxHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
  },
  dispute: {
    reporterAddress: '0x1234567890123456789012345678901234567890',
    accusedAddress: '0x0987654321098765432109876543210987654321',
    originalWorkId: 1,
    accusedWorkId: 2,
    disputeReason: 'This work appears to copy my original composition, color scheme, and character design. The similarities are too significant to be coincidental.',
    evidenceDescription: 'Both works share identical character poses, color palettes, and compositional elements.',
    evidenceUrls: [
      'https://example.com/evidence1.jpg',
      'https://example.com/evidence2.jpg'
    ]
  }
}

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

async function testContentModeration() {
  log('\n🛡️  Testing Content Moderation API...', 'cyan')
  log('━'.repeat(60), 'cyan')

  try {
    // Test POST - Submit for moderation
    log('\n1. Submitting work for AI moderation...', 'blue')
    const response = await fetch(`${BASE_URL}/api/ai/content-moderation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData.moderation)
    })

    const data = await response.json()

    if (response.ok) {
      log('✅ Moderation submission successful!', 'green')
      log(`   Status: ${data.status}`, 'green')
      log(`   Message: ${data.message}`, 'green')
      
      if (data.moderation) {
        log('\n   Moderation Details:', 'yellow')
        log(`   - Overall Safety Score: ${data.moderation.overall_safety_score}%`, 'yellow')
        log(`   - NSFW Score: ${data.moderation.nsfw_score}%`, 'yellow')
        log(`   - Violence Score: ${data.moderation.violence_score}%`, 'yellow')
        log(`   - Hate Score: ${data.moderation.hate_score}%`, 'yellow')
        
        if (data.moderation.detected_issues?.length > 0) {
          log(`   - Detected Issues: ${data.moderation.detected_issues.join(', ')}`, 'yellow')
        }
      }
    } else {
      log(`❌ Moderation failed: ${data.error}`, 'red')
    }

    // Test GET - Fetch moderation records
    log('\n2. Fetching moderation records...', 'blue')
    const getResponse = await fetch(
      `${BASE_URL}/api/ai/content-moderation?address=${testData.moderation.creatorAddress}`
    )
    const getData = await getResponse.json()

    if (getResponse.ok) {
      log(`✅ Found ${getData.moderations?.length || 0} moderation records`, 'green')
    } else {
      log(`❌ Failed to fetch records: ${getData.error}`, 'red')
    }

  } catch (error) {
    log(`❌ Test failed: ${error.message}`, 'red')
  }
}

async function testCopyrightDispute() {
  log('\n⚖️  Testing Copyright Dispute API...', 'cyan')
  log('━'.repeat(60), 'cyan')

  try {
    // Test POST - Create dispute
    log('\n1. Creating copyright dispute...', 'blue')
    const response = await fetch(`${BASE_URL}/api/ai/copyright-dispute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData.dispute)
    })

    const data = await response.json()

    if (response.ok) {
      log('✅ Dispute created successfully!', 'green')
      
      if (data.analysis) {
        log('\n   AI Analysis Results:', 'yellow')
        log(`   - Overall Similarity: ${data.analysis.overallSimilarity}%`, 'yellow')
        log(`   - Composition Similarity: ${data.analysis.compositionSimilarity}%`, 'yellow')
        log(`   - Color Similarity: ${data.analysis.colorSimilarity}%`, 'yellow')
        log(`   - Character Similarity: ${data.analysis.characterSimilarity}%`, 'yellow')
        log(`   - Style Similarity: ${data.analysis.styleSimilarity}%`, 'yellow')
        log(`   - AI Recommendation: ${data.analysis.aiRecommendation}`, 'yellow')
        log(`   - Confidence Level: ${data.analysis.confidenceLevel}%`, 'yellow')
        
        if (data.analysis.aiConclusion) {
          log(`\n   AI Conclusion:`, 'yellow')
          log(`   ${data.analysis.aiConclusion}`, 'yellow')
        }
      }

      if (data.dispute) {
        log(`\n   Dispute ID: ${data.dispute.id}`, 'green')
        log(`   Status: ${data.dispute.status}`, 'green')
      }
    } else {
      log(`❌ Dispute creation failed: ${data.error}`, 'red')
    }

    // Test GET - Fetch disputes
    log('\n2. Fetching dispute records...', 'blue')
    const getResponse = await fetch(
      `${BASE_URL}/api/ai/copyright-dispute?address=${testData.dispute.reporterAddress}`
    )
    const getData = await getResponse.json()

    if (getResponse.ok) {
      log(`✅ Found ${getData.disputes?.length || 0} dispute records`, 'green')
      
      if (getData.disputes?.length > 0) {
        const dispute = getData.disputes[0]
        log('\n   Latest Dispute:', 'yellow')
        log(`   - ID: ${dispute.id}`, 'yellow')
        log(`   - Status: ${dispute.status}`, 'yellow')
        log(`   - Similarity: ${dispute.similarity_score}%`, 'yellow')
        log(`   - Recommendation: ${dispute.ai_recommendation}`, 'yellow')
      }
    } else {
      log(`❌ Failed to fetch disputes: ${getData.error}`, 'red')
    }

  } catch (error) {
    log(`❌ Test failed: ${error.message}`, 'red')
  }
}

async function runTests() {
  log('\n╔════════════════════════════════════════════════════════════╗', 'cyan')
  log('║        AI Moderation System - API Test Suite              ║', 'cyan')
  log('╚════════════════════════════════════════════════════════════╝', 'cyan')
  log(`\nTesting against: ${BASE_URL}`, 'blue')

  await testContentModeration()
  await testCopyrightDispute()

  log('\n' + '━'.repeat(60), 'cyan')
  log('✅ All tests completed!', 'green')
  log('\nNote: These tests use mock data. In production:', 'yellow')
  log('  - Qwen-VL API will analyze actual images', 'yellow')
  log('  - Real blockchain transactions will be required', 'yellow')
  log('  - Database records will be created', 'yellow')
  log('\n')
}

// Run tests
runTests().catch(error => {
  log(`\n❌ Fatal error: ${error.message}`, 'red')
  process.exit(1)
})
