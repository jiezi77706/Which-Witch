# AI Moderation & Copyright Arbitration System

## Overview

This document describes the AI-powered content moderation and copyright arbitration system for WhichWitch platform, powered by Qwen-VL multimodal AI.

## Features

### 1. Content Moderation (Upload Time)

**Purpose**: Automatically scan uploaded content for policy violations before publishing.

**Process**:
1. Creator uploads artwork and stakes tokens
2. Qwen-VL AI automatically scans the content
3. AI detects sensitive content:
   - NSFW content (nudity, sexual content)
   - Violence and gore
   - Hate symbols and offensive imagery
4. AI generates safety scores (0-100) for each category
5. Content is approved, rejected, or flagged for review
6. Stake is locked/unlocked based on moderation result

**Components**:
- `ContentModerationButton` - Trigger AI content check
- `app/api/ai/content-moderation/route.ts` - Backend API
- Database table: `content_moderation`

**Usage Example**:
```tsx
import { ContentModerationButton } from '@/components/whichwitch/content-moderation-button'

<ContentModerationButton
  workId={123}
  imageUrl="https://..."
  creatorAddress="0x..."
  onModerationComplete={(result) => console.log(result)}
/>
```

### 2. Copyright Arbitration (Report Time)

**Purpose**: AI-powered copyright dispute resolution when users report plagiarism.

**Process**:
1. User reports suspected copyright infringement
2. User fills out dispute form and selects their original work
3. Both works are locked immediately
4. Qwen-VL AI analyzes both artworks
5. AI generates comprehensive arbitration report:
   - Overall similarity score (0-100%)
   - Composition similarity
   - Color scheme similarity
   - Character feature similarity
   - Artistic style similarity
   - Disputed region annotations
   - Timeline analysis (upload dates)
   - AI conclusion and recommendation

**AI Recommendations**:
- **Dismiss**: No significant infringement detected
- **Warning**: Minor similarities, issue warning
- **Takedown**: Significant infringement, remove content
- **Compensation**: Confirmed infringement, award compensation

**Components**:
- `ReportCopyrightButton` - Report copyright infringement
- `CopyrightDisputeModal` - Submit dispute with evidence
- `DisputeReportViewer` - View AI arbitration report
- `app/api/ai/copyright-dispute/route.ts` - Backend API
- Database table: `copyright_disputes`

**Usage Example**:
```tsx
import { ReportCopyrightButton } from '@/components/whichwitch/report-copyright-button'

<ReportCopyrightButton
  accusedWorkId={456}
  accusedWorkTitle="Suspected Copy"
  accusedWorkImage="https://..."
  accusedAddress="0x..."
/>
```

### 3. Moderation Dashboard

**Purpose**: Centralized view of all moderation and dispute activities.

**Features**:
- View all content moderation results
- Track copyright disputes
- View detailed AI reports
- Monitor dispute status

**Component**:
- `ModerationDashboard` - Complete dashboard UI

**Usage Example**:
```tsx
import { ModerationDashboard } from '@/components/whichwitch/moderation-dashboard'

<ModerationDashboard />
```

## Database Schema

### content_moderation Table
```sql
- id: Primary key
- work_id: Reference to works table
- creator_address: Wallet address
- status: pending | approved | rejected | under_review
- ai_analysis: Full AI report (JSONB)
- nsfw_score: 0-100
- violence_score: 0-100
- hate_score: 0-100
- overall_safety_score: 0-100
- detected_issues: Array of issue types
- flagged_content: Specific problematic elements
- stake_amount: Token amount staked
- stake_tx_hash: Blockchain transaction
- stake_locked: Boolean
- challenge_period_end: Timestamp
- created_at, reviewed_at: Timestamps
```

### copyright_disputes Table
```sql
- id: Primary key
- reporter_address: Who reported
- accused_address: Accused creator
- original_work_id: Original work reference
- accused_work_id: Accused work reference
- dispute_reason: Text description
- evidence_description: Additional evidence
- evidence_urls: Array of evidence links
- status: pending | analyzing | resolved | dismissed
- ai_report: Full AI analysis (JSONB)
- similarity_score: Overall similarity (0-100)
- composition_similarity: 0-100
- color_similarity: 0-100
- character_similarity: 0-100
- style_similarity: 0-100
- disputed_regions: JSONB array of flagged areas
- timeline_analysis: Text analysis
- ai_conclusion: AI's conclusion
- ai_recommendation: dismiss | warning | takedown | compensation
- confidence_level: AI confidence (0-100)
- resolution: Final resolution
- works_locked: Boolean
- created_at, analyzed_at, resolved_at: Timestamps
```

## API Endpoints

### Content Moderation API

**POST /api/ai/content-moderation**
```json
{
  "workId": 123,
  "imageUrl": "https://...",
  "creatorAddress": "0x...",
  "stakeAmount": "0.01",
  "stakeTxHash": "0x..."
}
```

**Response**:
```json
{
  "success": true,
  "moderation": { ... },
  "status": "approved",
  "message": "Content approved! Stake will be unlocked."
}
```

**GET /api/ai/content-moderation?address=0x...**
- Returns all moderation records for an address

### Copyright Dispute API

**POST /api/ai/copyright-dispute**
```json
{
  "reporterAddress": "0x...",
  "accusedAddress": "0x...",
  "originalWorkId": 123,
  "accusedWorkId": 456,
  "disputeReason": "This work copies my composition...",
  "evidenceDescription": "Additional context...",
  "evidenceUrls": ["https://..."]
}
```

**Response**:
```json
{
  "success": true,
  "dispute": { ... },
  "analysis": {
    "overallSimilarity": 85.5,
    "compositionSimilarity": 90.2,
    "colorSimilarity": 78.3,
    "aiConclusion": "...",
    "aiRecommendation": "takedown"
  }
}
```

**GET /api/ai/copyright-dispute?address=0x...**
- Returns all disputes involving an address

**PATCH /api/ai/copyright-dispute**
```json
{
  "disputeId": 1,
  "resolution": "reporter_wins",
  "resolutionDetails": "...",
  "resolvedBy": "ai"
}
```

## Qwen-VL Integration

### API Configuration

Set environment variables:
```env
QWEN_API_URL=https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation
QWEN_API_KEY=your_api_key_here
```

### Content Moderation Prompt
```
Analyze this image for content moderation. Detect and score:
1. NSFW content (nudity, sexual content) - score 0-100
2. Violence and gore - score 0-100
3. Hate symbols and offensive content - score 0-100

Provide JSON with:
- nsfwScore, violenceScore, hateScore
- detectedIssues: array of issue types
- flaggedContent: specific problematic elements
- reasoning: detailed explanation
```

### Copyright Analysis Prompt
```
Compare these two artworks for copyright infringement.

Analyze and provide scores (0-100) for:
1. Overall Similarity
2. Composition Similarity
3. Color Similarity
4. Character Similarity
5. Style Similarity

Also provide:
- disputedRegions: specific similar areas
- timelineAnalysis: upload date analysis
- aiConclusion: detailed conclusion
- aiRecommendation: dismiss | warning | takedown | compensation
- confidenceLevel: 0-100
```

## Integration Guide

### Step 1: Add to Upload Flow

In `upload-view.tsx`, content moderation is automatically triggered after upload:

```tsx
// After successful upload
const moderationResponse = await fetch('/api/ai/content-moderation', {
  method: 'POST',
  body: JSON.stringify({
    workId: uploadResult.work.workId,
    imageUrl: uploadResult.work.imageUrl,
    creatorAddress: address,
    stakeAmount: "0.01",
    stakeTxHash: txHash
  })
})
```

### Step 2: Add Report Button to Work Details

```tsx
import { ReportCopyrightButton } from '@/components/whichwitch/report-copyright-button'

// In work detail page
<ReportCopyrightButton
  accusedWorkId={work.work_id}
  accusedWorkTitle={work.title}
  accusedWorkImage={work.image_url}
  accusedAddress={work.creator_address}
/>
```

### Step 3: Add Dashboard to Profile

```tsx
import { ModerationDashboard } from '@/components/whichwitch/moderation-dashboard'

// In user profile or admin panel
<ModerationDashboard />
```

## Testing

### Test Content Moderation
```bash
curl -X POST http://localhost:3000/api/ai/content-moderation \
  -H "Content-Type: application/json" \
  -d '{
    "workId": 1,
    "imageUrl": "https://example.com/image.jpg",
    "creatorAddress": "0x123...",
    "stakeAmount": "0.01",
    "stakeTxHash": "0xabc..."
  }'
```

### Test Copyright Dispute
```bash
curl -X POST http://localhost:3000/api/ai/copyright-dispute \
  -H "Content-Type: application/json" \
  -d '{
    "reporterAddress": "0x123...",
    "accusedAddress": "0x456...",
    "originalWorkId": 1,
    "accusedWorkId": 2,
    "disputeReason": "This work copies my design"
  }'
```

## Future Enhancements

1. **Community Voting**: Allow community to vote on disputes
2. **Appeal System**: Let creators appeal moderation decisions
3. **Reputation System**: Track creator reputation based on moderation history
4. **Automated Actions**: Automatically execute AI recommendations
5. **Multi-language Support**: Support dispute forms in multiple languages
6. **Evidence Upload**: Allow image uploads as evidence
7. **Real-time Notifications**: Notify users of dispute updates
8. **Analytics Dashboard**: Track moderation and dispute statistics

## Security Considerations

1. **Rate Limiting**: Prevent abuse of moderation and dispute APIs
2. **Authentication**: Verify wallet signatures for all actions
3. **Stake Requirements**: Require token stakes to prevent spam
4. **Appeal Period**: Allow time for appeals before final decisions
5. **Evidence Validation**: Verify evidence URLs and content
6. **AI Confidence Threshold**: Only auto-execute high-confidence decisions

## Support

For issues or questions:
- Check API logs for error details
- Verify Qwen API key is valid
- Ensure database migrations are applied
- Test with sample images first
