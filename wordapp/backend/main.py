import os
import json
import tempfile
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

GOOGLE_CLOUD_API_KEY = os.environ.get("GOOGLE_CLOUD_API_KEY", "")
GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "llama-3.3-70b-versatile"


# ---------- /detect ----------

class DetectRequest(BaseModel):
    image: str
    targetLanguage: str


class DetectResponse(BaseModel):
    english: str
    target: str
    languageCode: str


@app.post("/detect", response_model=DetectResponse)
async def detect(request: DetectRequest):
    if not GOOGLE_CLOUD_API_KEY:
        raise HTTPException(status_code=500, detail="GOOGLE_CLOUD_API_KEY not configured")

    async with httpx.AsyncClient(timeout=15.0) as client:
        # Step 1: Google Cloud Vision — detect object labels
        vision_url = f"https://vision.googleapis.com/v1/images:annotate?key={GOOGLE_CLOUD_API_KEY}"
        vision_payload = {
            "requests": [
                {
                    "image": {"content": request.image},
                    "features": [{"type": "LABEL_DETECTION", "maxResults": 10}],
                }
            ]
        }

        try:
            vision_resp = await client.post(vision_url, json=vision_payload)
            vision_resp.raise_for_status()
            vision_data = vision_resp.json()
        except httpx.HTTPError as e:
            raise HTTPException(status_code=502, detail=f"Vision API error: {e}")

        annotations = (
            vision_data.get("responses", [{}])[0].get("labelAnnotations", [])
        )
        if not annotations:
            raise HTTPException(status_code=404, detail="No objects detected")

        GENERIC_LABELS = {
            "food", "liquid", "product", "material", "organism",
            "electronic device", "gadget", "kitchen utensil", "drinkware",
            "tableware", "furniture", "office supplies", "plant", "ingredient",
        }

        # Filter out generic labels, sort by topicality
        specific = [
            a for a in annotations
            if a["description"].lower() not in GENERIC_LABELS
        ]
        candidates = specific if specific else annotations
        best = max(candidates, key=lambda a: a.get("topicality", 0))
        english_label = best["description"]

        # Step 2: Google Cloud Translation — translate to target language
        translate_url = f"https://translation.googleapis.com/language/translate/v2?key={GOOGLE_CLOUD_API_KEY}"
        translate_payload = {
            "q": english_label,
            "target": request.targetLanguage,
            "source": "en",
            "format": "text",
        }

        try:
            translate_resp = await client.post(translate_url, json=translate_payload)
            translate_resp.raise_for_status()
            translate_data = translate_resp.json()
        except httpx.HTTPError as e:
            raise HTTPException(status_code=502, detail=f"Translation API error: {e}")

        translated_text = (
            translate_data.get("data", {})
            .get("translations", [{}])[0]
            .get("translatedText", "")
        )

        if not translated_text:
            raise HTTPException(status_code=502, detail="Translation returned empty result")

        return DetectResponse(
            english=english_label,
            target=translated_text,
            languageCode=request.targetLanguage,
        )


# ---------- Language name lookup ----------

LANGUAGE_NAMES = {
    "es": "Spanish",
    "fr": "French",
    "pt": "Portuguese",
    "zh": "Mandarin Chinese",
    "ja": "Japanese",
    "ko": "Korean",
}


# ---------- /generate-sentences (batch) ----------

class WordPair(BaseModel):
    english: str
    target: str


class GenerateSentencesRequest(BaseModel):
    words: list[WordPair]
    targetLanguage: str


class SentenceItem(BaseModel):
    word: str
    sentence_target: str
    sentence_english: str


class GenerateSentencesResponse(BaseModel):
    sentences: list[SentenceItem]


@app.post("/generate-sentences", response_model=GenerateSentencesResponse)
async def generate_sentences(request: GenerateSentencesRequest):
    if not GROQ_API_KEY:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY not configured")

    lang_name = LANGUAGE_NAMES.get(request.targetLanguage, request.targetLanguage)

    word_list = ", ".join(
        f"'{w.target}' ({w.english})" for w in request.words
    )
    prompt = (
        f"Generate a simple, practical sentence for each of these words that "
        f"a beginner learning {lang_name} would actually say. Keep each sentence "
        f"under 10 words. Words: {word_list}. "
        f"Respond in JSON only as an array: "
        f'[{{"word": "<english>", "sentence_target": "...", "sentence_english": "..."}}]'
    )

    payload = {
        "model": GROQ_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.7,
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            resp = await client.post(
                GROQ_URL,
                json=payload,
                headers={"Authorization": f"Bearer {GROQ_API_KEY}"},
            )
            resp.raise_for_status()
            data = resp.json()
        except httpx.HTTPError as e:
            raise HTTPException(status_code=502, detail=f"Groq API error: {e}")

    try:
        text = data["choices"][0]["message"]["content"]
        parsed = json.loads(text)
        items = [
            SentenceItem(
                word=item.get("word", ""),
                sentence_target=item["sentence_target"],
                sentence_english=item["sentence_english"],
            )
            for item in parsed
        ]
        return GenerateSentencesResponse(sentences=items)
    except (KeyError, IndexError, json.JSONDecodeError) as e:
        raise HTTPException(status_code=502, detail=f"Failed to parse Groq response: {e}")


# ---------- /grade-sentences (batch) ----------

class SentencePair(BaseModel):
    correct: str
    attempt: str


class GradeSentencesRequest(BaseModel):
    pairs: list[SentencePair]
    targetLanguage: str


class GradeItem(BaseModel):
    score: int
    feedback: str


class GradeSentencesResponse(BaseModel):
    grades: list[GradeItem]


@app.post("/grade-sentences", response_model=GradeSentencesResponse)
async def grade_sentences(request: GradeSentencesRequest):
    if not GROQ_API_KEY:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY not configured")

    lang_name = LANGUAGE_NAMES.get(request.targetLanguage, request.targetLanguage)

    pairs_text = "\n".join(
        f'{i+1}. Correct: "{p.correct}" | Student wrote: "{p.attempt}"'
        for i, p in enumerate(request.pairs)
    )
    prompt = (
        f"A student is learning {lang_name}. Grade each of their sentence "
        f"attempts 1-10 and give brief, encouraging feedback in 1 sentence each.\n\n"
        f"{pairs_text}\n\n"
        f"Respond in JSON only as an array: "
        f'[{{"score": <number>, "feedback": "<string>"}}]'
    )

    payload = {
        "model": GROQ_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.7,
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            resp = await client.post(
                GROQ_URL,
                json=payload,
                headers={"Authorization": f"Bearer {GROQ_API_KEY}"},
            )
            resp.raise_for_status()
            data = resp.json()
        except httpx.HTTPError as e:
            raise HTTPException(status_code=502, detail=f"Groq API error: {e}")

    try:
        text = data["choices"][0]["message"]["content"]
        parsed = json.loads(text)
        items = [
            GradeItem(score=int(item["score"]), feedback=str(item["feedback"]))
            for item in parsed
        ]
        return GradeSentencesResponse(grades=items)
    except (KeyError, IndexError, json.JSONDecodeError, ValueError) as e:
        raise HTTPException(status_code=502, detail=f"Failed to parse Groq response: {e}")


# ---------- /transcribe-audio ----------

WHISPER_URL = "https://api.groq.com/openai/v1/audio/transcriptions"
WHISPER_MODEL = "whisper-large-v3-turbo"


@app.post("/transcribe-audio")
async def transcribe_audio(
    audio: UploadFile = File(...),
    targetLanguage: str = Form(...),
    expectedSentence: str = Form(...),
):
    if not GROQ_API_KEY:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY not configured")

    lang_name = LANGUAGE_NAMES.get(targetLanguage, targetLanguage)

    # Save uploaded file to a temp file so we can send it to Whisper
    audio_bytes = await audio.read()
    suffix = os.path.splitext(audio.filename or "audio.m4a")[1] or ".m4a"

    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(audio_bytes)
        tmp_path = tmp.name

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            # Step 1: Whisper transcription
            with open(tmp_path, "rb") as f:
                whisper_resp = await client.post(
                    WHISPER_URL,
                    headers={"Authorization": f"Bearer {GROQ_API_KEY}"},
                    data={
                        "model": WHISPER_MODEL,
                        "language": targetLanguage,
                    },
                    files={"file": (audio.filename or "audio.m4a", f, audio.content_type or "audio/m4a")},
                )

            if whisper_resp.status_code != 200:
                raise HTTPException(
                    status_code=502,
                    detail=f"Whisper API error: {whisper_resp.text}",
                )

            transcription = whisper_resp.json().get("text", "").strip()

            if not transcription:
                return {
                    "score": 0,
                    "feedback": "Could not hear anything. Try speaking louder and closer to the microphone.",
                    "heard": "",
                }

            # Step 2: Grade pronunciation via Llama
            prompt = (
                f"The student tried to say: '{expectedSentence}' in {lang_name}. "
                f"Whisper heard them say: '{transcription}'. "
                f"Grade their pronunciation 1-10 and give specific, encouraging feedback "
                f"about what they got right and what to improve. "
                f'Respond in JSON only: {{"score": <number>, "feedback": "<string>", "heard": "<what whisper transcribed>"}}'
            )

            grade_resp = await client.post(
                GROQ_URL,
                json={
                    "model": GROQ_MODEL,
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.5,
                },
                headers={"Authorization": f"Bearer {GROQ_API_KEY}"},
            )

            if grade_resp.status_code != 200:
                raise HTTPException(
                    status_code=502,
                    detail=f"Groq grading error: {grade_resp.text}",
                )

            grade_data = grade_resp.json()
            grade_text = grade_data["choices"][0]["message"]["content"]
            parsed = json.loads(grade_text)

            return {
                "score": int(parsed.get("score", 0)),
                "feedback": str(parsed.get("feedback", "")),
                "heard": str(parsed.get("heard", transcription)),
            }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Transcription failed: {e}")
    finally:
        os.unlink(tmp_path)
