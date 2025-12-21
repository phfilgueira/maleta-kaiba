import { GoogleGenAI } from "@google/genai";

let ai: GoogleGenAI | null = null;

const getAiClient = () => {
  if (!ai) {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error("Gemini API key not found (VITE_GEMINI_API_KEY)");
    }

    ai = new GoogleGenAI({ apiKey });
  }

  return ai;
};

export interface IdentificationResult {
  cardCode: string;
  collectionCode: string;
  name: string;
}

export const identifyCard = async (
  base64Image: string
): Promise<IdentificationResult> => {
  const client = getAiClient();

  const base64Data = base64Image.split(",")[1] || base64Image;

  const prompt = `
Analyze this Yu-Gi-Oh! card image carefully.

Extract:
1. Passcode (8 digits, bottom left)
2. Set Code (e.g. LOB-EN001)
3. Exact card name

Return ONLY raw JSON:
{
  "cardCode": "",
  "collectionCode": "",
  "name": ""
}
`;

  const response = await client.models.generateContent({
    model: "gemini-2.5-flash",
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: base64Data,
          },
        },
        { text: prompt },
      ],
    },
  });

  const text = response.text;
  if (!text) throw new Error("No response from Gemini");

  const cleaned = text.replace(/```json|```/g, "").trim();
  const result = JSON.parse(cleaned);

  return {
    cardCode: result.cardCode ?? "",
    collectionCode: result.collectionCode ?? "",
    name: result.name ?? "",
  };
};
