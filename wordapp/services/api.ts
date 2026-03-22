import { API_URL } from '@/constants/config';

export interface DetectResult {
  english: string;
  target: string;
  languageCode: string;
}

export async function detectObject(
  image: string,
  targetLanguage: string,
): Promise<DetectResult> {
  const response = await fetch(`${API_URL}/detect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image, targetLanguage }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Detection failed: ${error}`);
  }

  return response.json();
}

export interface SentenceResult {
  word: string;
  sentence_target: string;
  sentence_english: string;
}

export async function generateSentences(
  words: Array<{ english: string; target: string }>,
  targetLanguage: string,
): Promise<SentenceResult[]> {
  const response = await fetch(`${API_URL}/generate-sentences`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ words, targetLanguage }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Sentence generation failed: ${error}`);
  }

  const data = await response.json();
  return data.sentences;
}

export interface TranscribeResult {
  score: number;
  feedback: string;
  heard: string;
}

export async function transcribeAudio(
  audioUri: string,
  targetLanguage: string,
  expectedSentence: string,
): Promise<TranscribeResult> {
  const formData = new FormData();

  const filename = audioUri.split('/').pop() ?? 'audio.m4a';
  formData.append('audio', {
    uri: audioUri,
    name: filename,
    type: 'audio/m4a',
  } as any);
  formData.append('targetLanguage', targetLanguage);
  formData.append('expectedSentence', expectedSentence);

  const response = await fetch(`${API_URL}/transcribe-audio`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Transcription failed: ${error}`);
  }

  return response.json();
}

export interface GradeResult {
  score: number;
  feedback: string;
}

export async function gradeSentences(
  pairs: Array<{ correct: string; attempt: string }>,
  targetLanguage: string,
): Promise<GradeResult[]> {
  const response = await fetch(`${API_URL}/grade-sentences`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pairs, targetLanguage }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Grading failed: ${error}`);
  }

  const data = await response.json();
  return data.grades;
}
