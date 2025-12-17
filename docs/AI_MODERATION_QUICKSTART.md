# AI Moderation System - Quick Start Guide

## 🚀 Quick Setup (5 Minutes)

### Step 1: Environment Variables

Add to your `.env.local`:

```env
# Qwen-VL API Configuration
QWEN_API_URL=https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation
QWEN_API_KEY=your_qwen_api_key_here

# Supabase (if not already configured)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Step 2: Database Migration

Run the migration to create required tables:

```bash
# Connect to your Supabase project
# Go to SQL Editor and run:
src/backend/supabase/migrations/add_ai_moderation_system.sql
```

Or use Supabase CLI:

```bash
supabase db push
```

### Step 3: Install Dependencies

```bash
npm install @radix-ui/react-progress
```

### Step 4: Test the System

```bash
# Start your dev server
npm run dev

# In another terminal, run tests
node scripts/testing/test-ai-moderation.js
```

## 📦 What's Included

### Frontend Components (Ready to Use)

1. **ContentModerationButton** - AI content check on upload
2. **ReportCopyrightButton** - Report copyright infringement
3. **CopyrightDisputeModal** - Submit dispute with evidence
4. **DisputeReportViewer** - View AI arbitration reports
5. **ModerationDashboard** - Manage all moderation activities

### Backend APIs

1. **POST /api/ai/content-moderation** - Submit for AI moderation
2. **GET /api/ai/content-moderation** - Fetch moderation records
3. **POST /api/ai/copyright-dispute** - Create copyright dispute
4. **GET /api/ai/copyright-dispute** - Fetch disputes
5. **PATCH /api/ai/copyright-dispute** - Resolve disputes

### Database Tables

1. **content_moderation** - Moderation records
2. **copyright_disputes** - Dispute cases
3. **moderation_challenges** - Challenge records
4. **ai_analysis_cache** - Performance cache
5. **dispute_evidence** - Evidence storage

## 🎯 Usage Examples

### Example 1: Add Content Moderation to Upload

```tsx
// In your upload component
import { ContentModerationButton } from '@/components/whichwitch/content-moderation-button'

// After upload success
<ContentModerationButton
  workId={uploadedWork.id}
  imageUrl={uploadedWork.imageUrl}
  creatorAddress={userAddress}
  onModerationComplete={(result) => {
    if (result.status === 'approved') {
      toast.success('Content approved!')
    }
  }}
/>
```

### Example 2: Add Report Button to Work Details

```tsx
// In work detail page
import { ReportCopyrightButton } from '@/components/whichwitch/report-copyright-button'

<ReportCopyrightButton
  accusedWorkId={work.id}
  accusedWorkTitle={work.title}
  accusedWorkImage={work.imageUrl}
  accusedAddress={work.creatorAddress}
  variant="outline"
  size="sm"
/>
```

### Example 3: Add Dashboard to Profile

```tsx
// In user profile or admin panel
import { ModerationDashboard } from '@/components/whichwitch/moderation-dashboard'

<ModerationDashboard />
```

## 🧪 Testing

### Test Content Moderation

```bash
curl -X POST http://localhost:3000/api/ai/content-moderation \
  -H "Content-Type: application/json" \
  -d '{
    "workId": 1,
    "imageUrl": "https://example.com/test.jpg",
    "creatorAddress": "0x1234...",
    "stakeAmount": "0.01",
    "stakeTxHash": "0xabc..."
  }'
```

Expected response:
```json
{
  "success": true,
  "status": "approved",
  "moderation": {
    "overall_safety_score": 95.5,
    "nsfw_score": 2.1,
    "violence_score": 1.5,
    "hate_score": 0.8
  }
}
```

### Test Copyright Dispute

```bash
curl -X POST http://localhost:3000/api/ai/copyright-dispute \
  -H "Content-Type: application/json" \
  -d '{
    "reporterAddress": "0x1234...",
    "accusedAddress": "0x5678...",
    "originalWorkId": 1,
    "accusedWorkId": 2,
    "disputeReason": "This work copies my design"
  }'
```

Expected response:
```json
{
  "success": true,
  "analysis": {
    "overallSimilarity": 85.5,
    "compositionSimilarity": 90.2,
    "aiRecommendation": "takedown",
    "confidenceLevel": 87.5
  }
}
```

## 🔧 Configuration

### Qwen-VL API Setup

1. Go to https://dashscope.aliyun.com
2. Create an account or sign in
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key to your `.env.local`

### Adjust AI Thresholds

In `app/api/ai/content-moderation/route.ts`:

```typescript
// Adjust these thresholds based on your needs
let status = 'approved'
if (moderationResult.overallSafetyScore < 50) {
  status = 'rejected'  // Strict: reject if safety < 50%
} else if (moderationResult.overallSafetyScore < 80) {
  status = 'under_review'  // Medium: review if safety < 80%
}
```

### Customize Challenge Period

In `app/api/ai/content-moderation/route.ts`:

```typescript
// Default: 7 days challenge period
const challengePeriodEnd = new Date()
challengePeriodEnd.setDate(challengePeriodEnd.getDate() + 7)  // Change to 3, 14, etc.
```

## 📊 Monitoring

### Check Moderation Stats

```sql
-- Total moderations by status
SELECT status, COUNT(*) 
FROM content_moderation 
GROUP BY status;

-- Average safety scores
SELECT 
  AVG(overall_safety_score) as avg_safety,
  AVG(nsfw_score) as avg_nsfw,
  AVG(violence_score) as avg_violence
FROM content_moderation;
```

### Check Dispute Stats

```sql
-- Disputes by recommendation
SELECT ai_recommendation, COUNT(*) 
FROM copyright_disputes 
GROUP BY ai_recommendation;

-- Average similarity scores
SELECT 
  AVG(similarity_score) as avg_similarity,
  AVG(confidence_level) as avg_confidence
FROM copyright_disputes;
```

## 🐛 Troubleshooting

### Issue: "Qwen API error"

**Solution**: Check your API key and ensure you have credits

```bash
# Test API key
curl -X POST https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"qwen-vl-max","input":{"messages":[{"role":"user","content":[{"text":"test"}]}]}}'
```

### Issue: "Database error"

**Solution**: Ensure migrations are applied

```bash
# Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('content_moderation', 'copyright_disputes');
```

### Issue: "Works not found"

**Solution**: Ensure works table has data

```bash
# Check works table
SELECT COUNT(*) FROM works;
```

## 🎨 UI Customization

### Change Button Styles

```tsx
<ReportCopyrightButton
  variant="destructive"  // default | outline | ghost | destructive
  size="lg"              // sm | default | lg
  className="custom-class"
/>
```

### Customize Modal Colors

In `copyright-dispute-modal.tsx`:

```tsx
// Change border colors
<div className="border-2 border-green-500/30">  // Original work
<div className="border-2 border-red-500/30">    // Accused work
```

## 📈 Performance Tips

1. **Enable AI Cache**: The system automatically caches AI results
2. **Batch Processing**: Process multiple moderations in parallel
3. **Lazy Loading**: Load dispute reports only when needed
4. **Optimize Images**: Compress images before sending to AI

## 🔐 Security Best Practices

1. **Never expose** `SUPABASE_SERVICE_ROLE_KEY` to frontend
2. **Validate** wallet signatures for all actions
3. **Rate limit** API endpoints to prevent abuse
4. **Sanitize** user inputs in dispute forms
5. **Verify** evidence URLs before storing

## 📚 Next Steps

1. ✅ Set up environment variables
2. ✅ Run database migrations
3. ✅ Test APIs with curl or test script
4. ✅ Add components to your pages
5. ✅ Customize thresholds and UI
6. 📖 Read full documentation: `docs/AI_MODERATION_SYSTEM.md`
7. 🚀 Deploy to production

## 💡 Tips

- Start with **lenient thresholds** and adjust based on feedback
- Monitor **AI confidence levels** to improve accuracy
- Use **challenge period** to allow community review
- Implement **appeal system** for disputed decisions
- Track **false positive rates** to tune the system

## 🆘 Support

- 📖 Full Documentation: `docs/AI_MODERATION_SYSTEM.md`
- 🇨🇳 中文文档: `docs/AI_MODERATION_SYSTEM_CN.md`
- 🧪 Test Script: `scripts/testing/test-ai-moderation.js`
- 💬 Issues: Check API logs and database records

---

**Ready to go!** Your AI moderation system is now set up and ready to protect your platform. 🎉
