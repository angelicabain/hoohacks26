// Change this to your machine's local IP when running on a physical device
// e.g. 'http://192.168.1.42:8000'
export const API_URL = 'http://10.142.35.165:8000';

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
