# Marathi Language Test Script for STT

## Purpose
Test the Marathi-dominant language selection with a mental health consultation paragraph.

## Test Paragraph (Marathi - मराठी)

**Read this paragraph slowly and clearly:**

```
रुग्णाला गेल्या तीन महिन्यांपासून अनिद्रेचा त्रास आहे. रात्री झोप येत नाही आणि दिवसभर थकवा जाणवतो. त्यामुळे त्याच्या कामावर आणि कौटुंबिक जीवनावर परिणाम होत आहे. रुग्णाला चिंता आणि तणावही जाणवतो. मागील आठवड्यात त्याने भूक कमी झाल्याचे सांगितले. कधीकधी त्याला नैराश्याची भावना येते आणि कोणत्याही गोष्टीत रस वाटत नाही. मानसिक आरोग्याचा विचार करून आम्ही थेरपी आणि औषधोपचार सुरू केला आहे.
```

**Transliteration (Roman script):**
```
Rugnaala gelyaa teen mahinyanpaasun anidrecha traas aahe. Raatri zhop yet naahi aani divasbhar thakavaa janavato. Tyaamule tyaachya kaamaavar aani kautumbik jeevanavar parinam hot aahe. Rugnaala chinta aani tanaavahi janavato. Maageel aathavdyaat tyaane bhook kami zhalyaache saangitle. Kadhikaadhi tyaala nairashaachi bhavana yete aani konatyaahi goshtit ras vatat naahi. Maanasik aarogyaacha vichaar karun aamhi therapy aani aushadhopachar suru kelaa aahe.
```

**English Translation:**
```
The patient has been suffering from insomnia for the past three months. He cannot sleep at night and feels tired throughout the day. This is affecting his work and family life. The patient also experiences anxiety and stress. Last week he mentioned decreased appetite. Sometimes he feels depressed and has no interest in anything. Considering mental health, we have started therapy and medication.
```

---

## Testing Steps

### 1. **Start New Consultation**
   - Go to patient consultation page
   - Click "New Consultation"
   - **Select "Marathi (मराठी)" from Language Selector**
   - Verify you see: `[STT] 🗣️ Primary language: mr-IN` in browser console

### 2. **Record the Paragraph**
   - Click "Start Recording"
   - Read the Marathi paragraph slowly and clearly
   - Speak at a moderate pace (not too fast)
   - **Tip:** Read it in 2-3 chunks, pausing between sentences

### 3. **Check Results**

**Expected Console Logs:**
```
[STT] 🗣️ Primary language: mr-IN
```

**Expected Backend Logs:**
```
🗣️ [STT] User selected language: mr-IN
🗣️ [STT] Language priority: ['mr-IN', 'hi-IN', 'en-IN']
🌐 [Mental Health] Detected language: mr-IN
```

**Expected Transcript:**
- Should be in **Devanagari script** (मराठी)
- Should contain words like: रुग्ण, अनिद्रा, त्रास, चिंता, तणाव, नैराश्य, थेरपी

---

## Key Mental Health Terms (Marathi)

| English | Marathi | Transliteration |
|---------|---------|-----------------|
| Patient | रुग्ण | Rugna |
| Insomnia | अनिद्रा | Anidra |
| Anxiety | चिंता | Chinta |
| Stress | तणाव | Tanaav |
| Depression | नैराश्य | Nairashya |
| Therapy | थेरपी | Therapy |
| Medication | औषधोपचार | Aushadhopachar |
| Mental health | मानसिक आरोग्य | Maanasik aarogya |
| Appetite | भूक | Bhook |
| Sleep | झोप | Zhop |

---

## Troubleshooting

### If transcript is in wrong language:
1. Check browser console for: `[STT] 🗣️ Primary language:` - should show `mr-IN`
2. Check backend logs for language priority
3. Make sure you selected Marathi from the dropdown

### If transcript quality is poor:
1. **Speak slower** - STT works better with clear, measured speech
2. **Reduce background noise**
3. **Use a good microphone** - Built-in laptop mics often have poor quality
4. **Pause between sentences** - Let the 30-second chunks capture complete thoughts

### If getting mixed languages:
- This is normal for code-mixing support
- The backend includes alternate languages: `['mr-IN', 'hi-IN', 'en-IN']`
- Primary language (Marathi) gets priority

---

## Alternative Shorter Test (Quick Test)

If you want a shorter test, use this sentence:

**Marathi:**
```
रुग्णाला चिंता आणि तणाव जाणवतो आणि झोप येत नाही.
```

**Translation:**
```
The patient experiences anxiety and stress and cannot sleep.
```

This shorter version is easier to test quickly and contains key mental health terms that should trigger the specialized vocabulary boost.

