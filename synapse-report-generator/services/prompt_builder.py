import re


def _sanitize_text(text: str, max_len: int) -> str:
    if not text:
        return ""
    cleaned = re.sub(r"\s+", " ", text).strip()
    if len(cleaned) > max_len:
        cleaned = cleaned[:max_len]
    return cleaned


def build_medical_report_prompt(transcript: str, medications: str) -> str:
    transcript_s = _sanitize_text(transcript, 10000)
    medications_s = _sanitize_text(medications, 2000)

    return f"""You are an expert medical scribe and quality analyst. Your job is to generate a concise, accurate medical report in English based on a Hindi conversation transcript, and analyze how well the report captures the patient's primary complaints.

**[CONTEXT]**

**Hindi Transcript:**
---
{transcript_s}
---

**Structured Doctor's Notes:**
---
Medications prescribed: {medications_s if medications_s else "None documented"}
---

**[INSTRUCTIONS]**

Perform three tasks and return a single, valid JSON object containing all results.

**Task 1: Generate Medical Report**
Create a professional English medical report with these sections:
- **Chief Complaint:** Primary reason for visit (1-2 sentences)
- **History of Present Illness (HPI):** Detailed symptom timeline and context (3-5 sentences)
- **Assessment and Plan (A&P):** Diagnosis, treatment plan, and prescribed medications (2-4 sentences)

Keep the language clear and professional. Focus on clinical accuracy.

**Task 2: Identify Complaint Capture Tags**
Extract the 7 most important medical terms (symptoms, conditions, complaints) that:
1. Were mentioned by the patient in the Hindi transcript
2. Are successfully documented in your English report
3. Are specific medical terms, not generic words

Return as an array of English strings (e.g., ["fever", "chest pain", "shortness of breath"]).

**Task 3: Calculate Complaint Capture Score**
Provide a score (0-100) representing your confidence that ALL critical patient complaints were captured in the report. Include a one-sentence rationale explaining the score.

**[OUTPUT FORMAT]**

Return ONLY a valid JSON object with NO markdown formatting, NO code fences, and NO additional text:

{{
  "generated_report": "Chief Complaint:\n[content]\n\nHistory of Present Illness:\n[content]\n\nAssessment and Plan:\n[content]",
  "highlight_tags": ["term1", "term2", "term3", "term4", "term5", "term6", "term7"],
  "complaint_capture_score": {{
    "score": 85,
    "rationale": "Brief explanation of score"
  }}
}}

CRITICAL: Output must be valid, parseable JSON only. No other text."""
