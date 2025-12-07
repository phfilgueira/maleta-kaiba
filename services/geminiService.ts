import { GoogleGenAI } from "@google/genai";

// Inicializa o cliente de forma preguiçosa para evitar erros se a API KEY não estiver pronta no load
let ai: GoogleGenAI | null = null;

const getAiClient = () => {
  if (!ai) {
    // The API key must be obtained exclusively from the environment variable process.env.API_KEY.
    // Assume this variable is pre-configured, valid, and accessible.
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  }

  return ai;
};

export interface IdentificationResult {
  cardCode: string; // O número de 8 dígitos (Passcode)
  collectionCode: string; // O código do set (ex: LOB-001)
  name: string;
}

export const identifyCard = async (base64Image: string): Promise<IdentificationResult> => {
  try {
    const client = getAiClient();
    // Remove o prefixo data:image/jpeg;base64, se existir para enviar apenas os dados
    const base64Data = base64Image.split(',')[1] || base64Image;

    const prompt = `Analyze this Yu-Gi-Oh! card image carefully.
    Extract the following information:
    1. The "Passcode" (8-digit number usually at bottom left). If not visible, return empty string.
    2. The "Set Code" (usually under the image on the right, e.g., LOB-EN001). If not visible, return empty string.
    3. The exact "Name" of the card.

    Return ONLY a raw JSON object (no markdown code blocks) with keys: "cardCode", "collectionCode", "name".`;

    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Data
            }
          },
          {
            text: prompt
          }
        ]
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    // Limpar markdown se o modelo retornar ```json ... ```
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const result = JSON.parse(cleanedText);

    return {
      cardCode: result.cardCode || "",
      collectionCode: result.collectionCode || "",
      name: result.name || ""
    };

  } catch (error) {
    console.error("Error identifying card:", error);
    throw error;
  }
};
