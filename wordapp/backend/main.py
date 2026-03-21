import os
from fastapi import FastAPI, HTTPException
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
                    "features": [{"type": "LABEL_DETECTION", "maxResults": 3}],
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

        english_label = annotations[0]["description"]

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
