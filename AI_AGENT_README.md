# 🤖 WhichWitch AI Agent System

## 📋 Overview

Complete AI-powered content moderation and copyright arbitration system for WhichWitch platform, powered by **Qwen-VL** multimodal AI.

## ✨ Features

### 1️⃣ Content Moderation (Upload Time)
- 🛡️ Automatic AI scanning on upload
- 💰 Token staking mechanism
- 🔍 Multi-category detection (NSFW, Violence, Hate)
- 📊 Detailed safety scores (0-100)
- ⏰ Challenge period for appeals

### 2️⃣ Copyright Arbitration (Report Time)
- 🚨 User-initiated dispute system
- 🔬 Multi-dimensional similarity analysis
- 📍 Disputed region detection
- ⏱️ Timeline analysis
- 🤖 AI recommendations (Dismiss/Warning/Takedown/Compensation)
- 🔒 Automatic work locking

## 📦 What's Included

### Frontend Components (6 files)
```
components/whichwitch/
├── content-moderation-button.tsx      # AI content check button
├── report-copyright-button.tsx        # Report copyright button
├── copyright-dispute-modal.tsx        # Dispute submission form
├── dispute-report-viewer.tsx          # AI report viewer
└── moderation-dashboard.tsx           # Management dashboard

components/ui/
└── progress.tsx                       # Progress bar component
```

### Backend APIs (3 files)
```
app/api/
├── ai/
│   ├── content-moderation/route.ts   # Moderation API
│   └── copyright-dispute/route.ts    # Dispute API
└── works/route.ts                     # Works query API
```

### Database (1 file)
```
src/backend/supabase/migrations/
└── add_ai_moderation_system.sql      # Complete schema
```

### Documentation (5 files)
```
docs/
├── AI_MODERATION_SYSTEM.md           # Full documentation (EN)
├── AI_MODERATION_SYSTEM_CN.md        # Full documentation (CN)
├── AI_MODERATION_QUICKSTART.md       # Quick start guide
├── AI_AGENT_IMPLEMENTATION_SUMMARY.md # Implementation summary
└── AI_AGENT_SETUP_CHECKLIST.md       # Setup checklist
```

### Testing (1 file)
```
scripts/testing/
└── test-ai-moderation.js             # API test script
```

## 🚀 Quick Start (5 Minutes)

### Step 1: Environment Variables
```bash
# Add to .env.local
QWEN_API_URL=https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation
QWEN_API_KEY=your_qwen_api_key_here
```

### Step 2: Database Migration
```bash
# Run in Supabase SQL Editor
src/backend/supabase/migrations/add_ai_moderation_system.sql
```

### Step 3: Test
```bash
npm run dev
node scripts/testing/test-ai-moderation.js
```

## 📖 Documentation

| Document | Description | Language |
|----------|-------------|----------|
| [AI_MODERATION_SYSTEM.md](docs/AI_MODERATION_SYSTEM.md) | Complete system documentation | 🇬🇧 English |
| [AI_MODERATION_SYSTEM_CN.md](docs/AI_MODERATION_SYSTEM_CN.md) | 完整系统文档 | 🇨🇳 中文 |
| [AI_MODERATION_QUICKSTART.md](docs/AI_MODERATION_QUICKSTART.md) | Quick start guide | 🇬🇧 English |
| [AI_AGENT_SETUP_CHECKLIST.md](docs/AI_AGENT_SETUP_CHECKLIST.md) | Setup checklist | 🇬🇧 English |
| [AI_AGENT_IMPLEMENTATION_SUMMARY.md](docs/AI_AGENT_IMPLEMENTATION_SUMMARY.md) | Implementation summary | 🇬🇧 English |

## 🎯 Usage Examples

### Content Moderation Button
```tsx
import { ContentModerationButton } from '@/components/whichwitch/content-moderation-button'

<ContentModerationButton
  workId={123}
  imageUrl="https://..."
  creatorAddress="0x..."
  onModerationComplete={(result) => console.log(result)}
/>
```

### Report Copyright Button
```tsx
import { ReportCopyrightButton } from '@/components/whichwitch/report-copyright-button'

<ReportCopyrightButton
  accusedWorkId={456}
  accusedWorkTitle="Suspected Copy"
  accusedWorkImage="https://..."
  accusedAddress="0x..."
/>
```

### Moderation Dashboard
```tsx
import { ModerationDashboard } from '@/components/whichwitch/moderation-dashboard'

<ModerationDashboard />
```

## 🗄️ Database Schema

### Tables Created (5)
1. **content_moderation** - AI moderation records
2. **copyright_disputes** - Copyright dispute cases
3. **moderation_challenges** - Challenge records
4. **ai_analysis_cache** - Performance cache
5. **dispute_evidence** - Evidence storage

### Key Features
- ✅ JSONB for flexible AI reports
- ✅ Comprehensive indexing
- ✅ Foreign key relationships
- ✅ Stored procedures
- ✅ Optimized views

## 🔌 API Endpoints

### Content Moderation
- `POST /api/ai/content-moderation` - Submit for moderation
- `GET /api/ai/content-moderation?address=0x...` - Fetch records

### Copyright Disputes
- `POST /api/ai/copyright-dispute` - Create dispute
- `GET /api/ai/copyright-dispute?address=0x...` - Fetch disputes
- `PATCH /api/ai/copyright-dispute` - Resolve dispute

### Works
- `GET /api/works?creator=0x...` - Fetch works by creator
- `GET /api/works?workId=123` - Fetch specific work

## 🤖 Qwen-VL Integration

### Content Moderation
```
Input: Image URL + Moderation prompt
Output: {
  nsfwScore: 0-100,
  violenceScore: 0-100,
  hateScore: 0-100,
  overallSafetyScore: 0-100,
  detectedIssues: [...],
  flaggedContent: [...]
}
```

### Copyright Analysis
```
Input: Two image URLs + Comparison prompt
Output: {
  overallSimilarity: 0-100,
  compositionSimilarity: 0-100,
  colorSimilarity: 0-100,
  characterSimilarity: 0-100,
  styleSimilarity: 0-100,
  disputedRegions: [...],
  aiConclusion: "...",
  aiRecommendation: "dismiss|warning|takedown|compensation"
}
```

## 🧪 Testing

### Automated Test
```bash
node scripts/testing/test-ai-moderation.js
```

### Manual Test
```bash
# Test content moderation
curl -X POST http://localhost:3000/api/ai/content-moderation \
  -H "Content-Type: application/json" \
  -d '{"workId":1,"imageUrl":"https://...","creatorAddress":"0x..."}'

# Test copyright dispute
curl -X POST http://localhost:3000/api/ai/copyright-dispute \
  -H "Content-Type: application/json" \
  -d '{"reporterAddress":"0x...","accusedAddress":"0x...","originalWorkId":1,"accusedWorkId":2}'
```

## 📊 Monitoring

### Check System Health
```sql
-- Moderation stats
SELECT status, COUNT(*) FROM content_moderation GROUP BY status;

-- Dispute stats
SELECT ai_recommendation, COUNT(*) FROM copyright_disputes GROUP BY ai_recommendation;

-- Average scores
SELECT AVG(overall_safety_score) FROM content_moderation;
SELECT AVG(similarity_score) FROM copyright_disputes;
```

## 🔐 Security

- ✅ Wallet signature verification
- ✅ Token staking requirements
- ✅ Work locking during disputes
- ✅ Service role key protection
- ✅ Rate limiting ready
- ✅ Input validation

## 🎨 UI/UX

### Design Features
- ✅ Consistent with existing design system
- ✅ Responsive layouts
- ✅ Loading states with spinners
- ✅ Toast notifications
- ✅ Error handling
- ✅ Success feedback
- ✅ Intuitive workflows

### Color Coding
- 🟢 Green: Original work, Approved
- 🔴 Red: Accused work, Rejected
- 🔵 Blue: Info, Under review
- 🟡 Yellow: Warning
- 🟠 Orange: Alert

## 📈 Performance

- ✅ AI result caching
- ✅ Database indexing
- ✅ Lazy loading
- ✅ Optimized queries
- ✅ Efficient JSONB storage

## 🌐 Internationalization

- ✅ English UI labels
- ✅ English documentation
- ✅ Chinese documentation
- ✅ Ready for i18n expansion

## 🔮 Future Enhancements

1. Community voting on disputes
2. Appeal system for decisions
3. Reputation tracking
4. Automated action execution
5. Multi-language support
6. Evidence image uploads
7. Real-time notifications
8. Analytics dashboard

## 📝 File Structure

```
whichwitch/
├── components/
│   ├── whichwitch/
│   │   ├── content-moderation-button.tsx
│   │   ├── report-copyright-button.tsx
│   │   ├── copyright-dispute-modal.tsx
│   │   ├── dispute-report-viewer.tsx
│   │   ├── moderation-dashboard.tsx
│   │   └── upload-view.tsx (modified)
│   └── ui/
│       └── progress.tsx
├── app/
│   └── api/
│       ├── ai/
│       │   ├── content-moderation/route.ts
│       │   └── copyright-dispute/route.ts
│       └── works/route.ts
├── src/
│   └── backend/
│       └── supabase/
│           └── migrations/
│               └── add_ai_moderation_system.sql
├── docs/
│   ├── AI_MODERATION_SYSTEM.md
│   ├── AI_MODERATION_SYSTEM_CN.md
│   ├── AI_MODERATION_QUICKSTART.md
│   ├── AI_AGENT_IMPLEMENTATION_SUMMARY.md
│   └── AI_AGENT_SETUP_CHECKLIST.md
├── scripts/
│   └── testing/
│       └── test-ai-moderation.js
├── .env.example (updated)
└── AI_AGENT_README.md (this file)
```

## ✅ Implementation Status

| Feature | Status | Notes |
|---------|--------|-------|
| Content Moderation | ✅ Complete | Integrated with upload flow |
| Copyright Arbitration | ✅ Complete | Full dispute system |
| Database Schema | ✅ Complete | 5 tables, optimized |
| Frontend Components | ✅ Complete | 6 components |
| Backend APIs | ✅ Complete | 3 API routes |
| Documentation | ✅ Complete | 5 comprehensive docs |
| Testing | ✅ Complete | Automated test script |
| Integration | ✅ Complete | Upload flow integrated |

## 🎓 Learning Path

1. **Quick Start** → Read `AI_MODERATION_QUICKSTART.md`
2. **Setup** → Follow `AI_AGENT_SETUP_CHECKLIST.md`
3. **Deep Dive** → Read `AI_MODERATION_SYSTEM.md`
4. **中文文档** → 阅读 `AI_MODERATION_SYSTEM_CN.md`
5. **Testing** → Run `test-ai-moderation.js`

## 🆘 Support

### Common Issues

**"Qwen API error"**
- Check API key in `.env.local`
- Verify API credits
- Test API connection

**"Database error"**
- Run migration script
- Check Supabase connection
- Verify service role key

**"Component not found"**
- Restart dev server
- Clear Next.js cache
- Check file paths

### Getting Help

1. Check documentation in `docs/`
2. Review test script output
3. Check console logs
4. Verify database records
5. Test API endpoints directly

## 🏆 Success Criteria

✅ All features implemented
✅ All components working
✅ All APIs functional
✅ Database schema complete
✅ Documentation comprehensive
✅ Testing automated
✅ Integration seamless
✅ UI/UX polished

## 🎉 Ready for Production

The AI Agent system is **fully implemented** and **production-ready**:

- ✅ Tested and verified
- ✅ Documented in English and Chinese
- ✅ Integrated with existing system
- ✅ Optimized for performance
- ✅ Secured with best practices
- ✅ Monitored and maintainable

## 📞 Next Steps

1. **Setup** → Follow quick start guide
2. **Test** → Run test script
3. **Integrate** → Add components to pages
4. **Deploy** → Push to production
5. **Monitor** → Track performance
6. **Optimize** → Adjust thresholds

---

**Version**: 1.0.0  
**Status**: ✅ Production Ready  
**Last Updated**: 2024

**Built with**: Next.js, Supabase, Qwen-VL, TypeScript, Tailwind CSS
