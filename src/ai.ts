import { GoogleGenAI } from "@google/genai";

let ai: GoogleGenAI | null = null;

export function getAI() {
  if (!ai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is missing");
    }
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
}

export async function generatePitch(currentDay: number, customRequestsText?: string): Promise<string[]> {
  const model = getAI().models;
  const req = customRequestsText ? `Also include this flavor: ${customRequestsText}` : "";
  const prompt = `You are a creative writer tracking a 'bestie' search journey (currently Day ${currentDay}). Generate 3 unique, engaging, and slightly humorous pitch templates to finding a "bestie" in online group chats. One should be anime/Naruto themed. One should be in Hindi. One should be a standard quirky introverted pitch.
  
  Format your response as a valid JSON array of strings.
  
  ${req}`;
  
  try {
    const response = await model.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    if (response.text) {
        return JSON.parse(response.text) as string[];
    }
    return [];
  } catch (error) {
    console.error("AI Generation error:", error);
    return [];
  }
}

export async function extractGCNamesFromImage(file: File): Promise<string[]> {
  const model = getAI().models;
  
  const base64Data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const prompt = `Analyze this screenshot of a group chat application (like Telegram, WhatsApp, Discord, etc.). Extract all the distinct group chat names visible in the list. Return a JSON object with a single key "names" containing an array of strings representing the extracted names. If no group chat names can be found, return an empty array. Example: {"names": ["Anime Weebs", "Study Group", "Meme Lords"]}`;

  try {
    const response = await model.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          { text: prompt },
          { inlineData: { mimeType: file.type, data: base64Data } }
        ]
      },
      config: {
        responseMimeType: "application/json"
      }
    });

    if (response.text) {
      const parsed = JSON.parse(response.text);
      return parsed.names || [];
    }
  } catch (error) {
    console.error("AI Extractor error:", error);
  }
  return [];
}
