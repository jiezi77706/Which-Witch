#!/bin/bash

# AI Components Verification Script
# Verifies all AI moderation components are in place

echo "🔍 Verifying AI Moderation Components..."
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counter
TOTAL=0
PASSED=0

# Function to check file
check_file() {
    TOTAL=$((TOTAL + 1))
    if [ -f "$1" ]; then
        echo -e "${GREEN}✅${NC} $1"
        PASSED=$((PASSED + 1))
        return 0
    else
        echo -e "${RED}❌${NC} $1 ${RED}(MISSING)${NC}"
        return 1
    fi
}

# Function to check file size
check_file_size() {
    TOTAL=$((TOTAL + 1))
    if [ -f "$1" ]; then
        SIZE=$(wc -c < "$1")
        if [ $SIZE -gt 100 ]; then
            echo -e "${GREEN}✅${NC} $1 (${SIZE} bytes)"
            PASSED=$((PASSED + 1))
            return 0
        else
            echo -e "${YELLOW}⚠️${NC} $1 ${YELLOW}(File too small: ${SIZE} bytes)${NC}"
            return 1
        fi
    else
        echo -e "${RED}❌${NC} $1 ${RED}(MISSING)${NC}"
        return 1
    fi
}

echo "📦 Frontend Components:"
echo "----------------------"
check_file_size "components/whichwitch/content-moderation-button.tsx"
check_file_size "components/whichwitch/report-copyright-button.tsx"
check_file_size "components/whichwitch/copyright-dispute-modal.tsx"
check_file_size "components/whichwitch/dispute-report-viewer.tsx"
check_file_size "components/whichwitch/moderation-dashboard.tsx"
check_file_size "components/ui/progress.tsx"
echo ""

echo "🔌 Backend APIs:"
echo "---------------"
check_file_size "app/api/ai/content-moderation/route.ts"
check_file_size "app/api/ai/copyright-dispute/route.ts"
check_file_size "app/api/works/route.ts"
echo ""

echo "🗄️  Database:"
echo "------------"
check_file_size "src/backend/supabase/migrations/add_ai_moderation_system.sql"
echo ""

echo "📖 Documentation:"
echo "----------------"
check_file "docs/AI_MODERATION_SYSTEM.md"
check_file "docs/AI_MODERATION_SYSTEM_CN.md"
check_file "docs/AI_MODERATION_QUICKSTART.md"
check_file "docs/AI_AGENT_IMPLEMENTATION_SUMMARY.md"
check_file "docs/AI_AGENT_SETUP_CHECKLIST.md"
check_file "docs/HOW_TO_USE_AI_COMPONENTS.md"
check_file "AI_AGENT_README.md"
echo ""

echo "🧪 Testing:"
echo "----------"
check_file_size "scripts/testing/test-ai-moderation.js"
echo ""

echo "📄 Pages:"
echo "--------"
check_file "app/app/moderation/page.tsx"
echo ""

echo "⚙️  Configuration:"
echo "-----------------"
check_file ".env.example"
echo ""

# Summary
echo "========================================"
echo -e "Summary: ${GREEN}${PASSED}${NC}/${TOTAL} files verified"
echo ""

if [ $PASSED -eq $TOTAL ]; then
    echo -e "${GREEN}✅ All components are in place!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Configure environment variables (.env.local)"
    echo "2. Run database migration"
    echo "3. Start dev server: npm run dev"
    echo "4. Visit: http://localhost:3000/app/moderation"
    echo ""
    exit 0
else
    echo -e "${RED}❌ Some components are missing or incomplete${NC}"
    echo ""
    echo "Please check the missing files above."
    echo ""
    exit 1
fi
