# AI Report Feature Documentation

## Overview

The AI Report feature allows users to generate intelligent insights and analysis of their progress using artificial intelligence.

## Location

- **Frontend Component:** `src/components/analytics/ai-report-generator.tsx`
- **Backend API:** `src/app/api/ai/generate-report/route.ts`
- **Analytics Page:** `src/app/analytics/page.tsx` (Insights tab)

## User Flow

### Accessing the Feature

1. From the main dashboard (`/demo`), click on **"داشبورد تحلیلی"** card
2. Navigate to the **"بینش‌ها"** (Insights) tab
3. The AI Report generator is displayed at the top

### Generating a Report

#### Prerequisites

- User must have **at least 3 days** of data
- If user has **more than 90 days** of data, only the **last 30 days** are used
- The feature automatically checks data availability

#### User Interface

**Before Generation:**
- Info banner (if >90 days of data): "از ۳۰ روز آخر استفاده می‌شود"
- Card with title: "گزارش هوشمند پیشرفت شما"
- Button: "تولید گزارش با AI" (if >= 3 days of data)
- Error message (if < 3 days of data): "داده کافی برای تولید گزارش ندارید"

**During Generation:**
- Loading spinner
- Button text: "در حال تولید گزارش..."

**After Generation:**

1. **Date Range Card:**
   - Shows start and end dates (in Persian)
   - Shows days used vs total days available

2. **Report Content Card:**
   - Title: "تحلیل پیشرفت شما"
   - Formatted AI-generated text with:
     - Headings (h1, h2, h3)
     - Bullet points
     - Numbered lists
     - Regular paragraphs
   - "بستن" (Close) button to hide the report

3. **Regenerate Button:**
   - Text: "تولید مجدد گزارش"
   - Allows generating a new report

## Technical Details

### Backend API

**Endpoint:** `POST /api/ai/generate-report`

**Authentication:** JWT Bearer token required

**Request Body:**
```json
{}
```
(Empty body - all data is automatically determined)

**Response (Success):**
```json
{
  "success": true,
  "report": {
    "content": "AI generated report text...",
    "dateRange": {
      "start": "2025-01-01",
      "end": "2025-01-30"
    },
    "daysUsed": 30,
    "totalDaysWithData": 95,
    "model": "gpt-4"
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "برای تولید گزارش حداقل به ۳ روز داده نیاز دارید",
  "currentDays": 2,
  "requiredDays": 3
}
```

### Logic Flow

1. **Authentication:**
   - Verify JWT token
   - Extract userId

2. **Data Availability Check:**
   - Fetch user's commitments
   - Count unique days with data
   - If < 3 days, return error

3. **Determine Date Range:**
   - If > 90 days of data: Use last 30 days
   - Otherwise: Use all available data

4. **Build Context:**
   - Fetch analytics data for the determined date range
   - Include statistics, streak, completion rates, etc.

5. **Generate AI Report:**
   - Build system prompt with context
   - Send to AI provider
   - Return generated content

### AI System Integration

The feature uses the central AI system:

- **AI Client:** `src/lib/ai/ai-client.ts`
- **AI Service:** `src/lib/ai/ai-service.ts`
- **Context Builder:** `src/lib/ai/context-builders.ts`
- **System Prompts:** `src/lib/ai/system-prompts.ts`

**Context Provided to AI:**
- User's commitment statistics
- Completion rates
- Streak information
- Date range being analyzed
- Mood distribution (if available)

## Development Notes

### Environment Variables

Required in `.env.local`:
```env
DATABASE_URL="file:db/hamsou.db?connection_limit=1"
JWT_SECRET="hamsou-dev-secret-key"
AI_PROVIDER="zai"
```

### Testing

1. Generate test data using DevToolsPanel:
   - Go to "ابزارهای توسعه" (Development Tools)
   - Click "14 روز (2 هفته)" or "28 روز (4 هفته)"

2. Navigate to Analytics Dashboard
   - Click on "داشبورد تحلیلی" card
   - Go to "بینش‌ها" tab

3. Generate AI Report
   - Click "تولید گزارش با AI"
   - Wait for generation
   - Review the generated report

### Integration Points

**Frontend Components:**
- `AIReportGenerator` - Main component
- `AnalyticsPage` - Parent page with tabs

**Backend Routes:**
- `/api/ai/generate-report` - Report generation
- `/api/commitments` - User's commitments
- `/api/analytics/*` - Analytics data

**AI System:**
- `aiClient.getProvider()` - Get AI provider
- `provider.chat()` - Generate content
- `buildAnalyticsContext()` - Build user context

## Design Decisions

### Simplified Logic (v2.0)

**Previous Behavior (v1.0):**
- User selected report type (weekly/monthly)
- User selected specific date
- Complex date calculations

**Current Behavior (v2.0):**
- Automatic determination based on available data
- No user input required for date range
- Simplified UX:
  - < 3 days: Feature disabled
  - 3-90 days: Use all data
  - > 90 days: Use last 30 days

### Why This Approach?

1. **User Experience:** No need to understand weekly/monthly concepts
2. **Simplicity:** One button, no configuration
3. **Intelligence:** System optimizes based on data available
4. **Performance:** Fixed 30-day cap prevents long processing

## Future Enhancements

Potential improvements:
- [ ] Export report to PDF
- [ ] Share report link
- [ ] Report history
- [ ] Custom date range selection
- [ ] Multiple report templates
- [ ] Report scheduling
- [ ] Comparison reports (different time periods)

## Related Documentation

- [AI Implementation Summary](./AI-IMPLEMENTATION-SUMMARY.md)
- [Development vs Production Separation](./DEV-PROD-SEPARATION.md)
- [Architecture Documentation](./architecture.md)
