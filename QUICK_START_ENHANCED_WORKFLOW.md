# Quick Start: Enhanced Report Workflow

## Prerequisites

1. **GCP Service Account Credentials** - Already configured ✅ (gcp-credentials.json)
2. **Backend running** with database connection
3. **Frontend running** on localhost:3000

---

## Setup (2 minutes)

### Step 1: Verify GCP Credentials

```bash
cd backend

# Verify credentials file exists
ls gcp-credentials.json

# Should show: gcp-credentials.json
```

**Note:** The Gemini service is already configured to use your existing GCP service account. No additional API key needed!

### Step 2: Run Database Migration

```bash
# From backend directory
alembic upgrade head
```

You should see:
```
INFO  [alembic.runtime.migration] Running upgrade -> enhanced_report_001, Add enhanced report fields
```

### Step 3: Restart Backend

```bash
# Stop current backend (Ctrl+C)
# Start again
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Look for:
```
✅ Gemini 2.5 Flash initialized successfully (Mumbai region)
✅ Global Gemini service initialized successfully
```

### Step 4: Verify Frontend

```bash
cd ../frontend
npm run dev
```

Navigate to: `http://localhost:3000/dashboard/patients`

---

## Test the Workflow (3 minutes)

### Quick Test:

1. **Select any patient** from the patients list

2. **Click "Follow Up"** button

3. **Start Recording:**
   - Click "Start Recording"
   - Speak for 30 seconds (e.g., "Patient complains of anxiety and sleep issues...")
   - Click "Stop"

4. **Review Transcript:**
   - ✅ Transcript Review Section appears automatically
   - Click "Edit Transcript" to make changes
   - Click "Confirm & Continue to Medication"

5. **Add Medications:**
   - ✅ Medication Modal opens
   - Select patient status: "Stable"
   - Add medication:
     - Name: "Alprazolam"
     - Dosage: "0.5mg"
     - Frequency: "Before bed"
     - Duration: "7 days"
   - Click "Generate Report"

6. **View Report:**
   - ✅ Report Modal shows:
     - STT Confidence (e.g., 87%)
     - LLM Confidence (e.g., 82%)
     - 10 Keywords
     - Full report
   - Click "👍 Yes, helpful"
   - Modal closes after 1 second

7. **Verify in Database:**

```sql
SELECT 
  id,
  patient_status,
  stt_confidence_score,
  llm_confidence_score,
  array_length(keywords, 1) as keyword_count,
  doctor_feedback,
  created_at
FROM reports 
ORDER BY created_at DESC 
LIMIT 1;
```

Expected result:
```
id: <uuid>
patient_status: stable
stt_confidence_score: 0.87
llm_confidence_score: 0.82
keyword_count: 10
doctor_feedback: thumbs_up
created_at: 2025-10-14...
```

---

## Troubleshooting

### ❌ "AI service unavailable"

```bash
# Verify GCP credentials exist
cd backend
ls gcp-credentials.json

# Check backend logs for Gemini initialization
tail -f backend.log | grep "Gemini"

# Should see:
# ✅ Gemini 2.5 Flash initialized successfully (Mumbai region)
# ✅ Global Gemini service initialized successfully

# If not, restart backend
```

### ❌ "Column keywords does not exist"

```bash
# Run migration
cd backend
alembic upgrade head
```

### ❌ "No transcript available"

- Ensure microphone permissions are granted
- Check if VAD recorder is active
- Verify audio is being recorded (check volume indicator)

### ❌ Modal not showing

- Check browser console for errors
- Verify React components are imported correctly
- Clear browser cache and reload

---

## Success Indicators

### You'll know it's working when you see:

1. **Backend Logs:**
```
🤖 Generating follow_up report with enhanced workflow
📝 Transcript length: 234 chars, Patient status: stable
📊 STT Confidence: 0.87 (from 15 chunks)
✅ Report generated with confidence: 0.82
🏷️ Keywords: anxiety, sleep, insomnia, medication, therapy...
💾 Report saved to database: abc-123-def-456
```

2. **Frontend:**
- Transcript Review Section slides in smoothly
- Quality metrics show green checkmarks (>80%)
- Keywords appear as blue tags
- Feedback buttons are clickable
- Auto-close works after thumbs up/down

3. **Database:**
- New row in `reports` table
- All fields populated (keywords, confidence scores, feedback)

---

## Common Questions

### Q: How long does report generation take?
**A:** 2-5 seconds (Gemini 2.5 Flash is fast!)

### Q: Can I edit the report after it's generated?
**A:** Not in this version, but you can regenerate with edited transcript

### Q: What if I don't want to prescribe medications?
**A:** Click "Skip (No Medications)" button in the medication modal

### Q: Can I change patient status after submitting?
**A:** You'll need to generate a new report

### Q: Where are reports stored?
**A:** In PostgreSQL `reports` table with encryption

### Q: Can I export the report?
**A:** Not yet - this is a future enhancement

---

## Next Steps

✅ **You're all set!** The enhanced workflow is ready to use.

### Optional Enhancements:

1. **Adjust Confidence Thresholds:**
   - Edit `ReportModal.tsx` line 145: Change `sttConfidence > 0.8` to desired threshold

2. **Customize Keywords:**
   - Edit `gemini_service.py` prompts to focus on specific clinical terms

3. **Change Auto-Close Delay:**
   - Edit `ReportModal.tsx` line 36: Change `1000` to desired milliseconds

4. **Add More Patient Statuses:**
   - Edit `MedicationModal.tsx` to add more status buttons
   - Update backend validation accordingly

---

## Support

### Need Help?

1. **Check Logs:** `backend/backend.log` and browser console
2. **Review Documentation:** `ENHANCED_REPORT_WORKFLOW_COMPLETE.md`
3. **Verify Setup:** Run through Quick Test again
4. **Check Credentials:** Ensure gcp-credentials.json is valid and accessible

### Report Issues:

Include:
- Error message
- Backend logs (last 50 lines)
- Browser console errors
- Steps to reproduce

---

**Happy Report Generating! 🎉**

The workflow is designed to save doctors time while maintaining high-quality documentation standards.

