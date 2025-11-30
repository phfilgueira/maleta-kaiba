import { GoogleGenAI } from "@google/genai";

// Inicializa o cliente de forma preguiçosa
let ai: GoogleGenAI | null = null;

const getAiClient = () => {
  if (!ai) {
    // Pega a variável correta (Vite usa import.meta.env)
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error("VITE_GEMINI_API_KEY não encontrada no ambiente.");
    }

    ai = new GoogleGenAI({ apiKey });
  }

  return ai;
};

// -------------------------------------------------------
// TIPAGEM
// -------------------------------------------------------
export interface IdentificationResult {
  cardCode: string;
  collectionCode: string;
  name: string;
}

// -------------------------------------------------------
// FUNÇÃO PRINCIPAL: IDENTIFICAR CARTA
// -------------------------------------------------------
export const identifyCard = async (
  base64Image: string
): Promise<IdentificationResult> => {
  try {
    const client = getAiClient();

    const base64Data = base64Image.split(",")[1] || base64Image;

    const prompt = `
      Analyze this Yu-Gi-Oh! card image carefully.
      Extract the following information:
      1. The "Passcode" (8-digit number usually at bottom left). If not visible, return empty string.
      2. The "Set Code" (usually under the image on the right, e.g., LOB-EN001). If not visible, return empty string.
      3. The exact "Name" of the card.

      Return ONLY a raw JSON object with keys: "cardCode", "collectionCode", "name".
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
          {
            text: prompt,
          },
        ],
      },
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from Gemini.");

    const cleanedText = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const result = JSON.parse(cleanedText);

    return {
      cardCode: result.cardCode || "",
      collectionCode: result.collectionCode || "",
      name: result.name || "",
    };
  } catch (error) {
    console.error("Error identifying card:", error);
    throw error;
  }
};
