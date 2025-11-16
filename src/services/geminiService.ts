import { GoogleGenAI, Type } from "@google/genai";

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const cardSchema = {
    type: Type.OBJECT,
    properties: {
        cardCode: {
            type: Type.STRING,
            description: "The 8-digit numeric code. This is always located at the bottom-left of the card image, just below the main description text box."
        },
        collectionCode: {
            type: Type.STRING,
            description: "The unique identifier for the card's set and number. It's on the right side, directly under the card's main artwork. Its format is typically letters, a hyphen, and numbers (e.g., 'LOB-001', 'SDK-001', 'MAMA-EN001'). Read this code with extreme care."
        },
        error: {
            type: Type.STRING,
            nullable: true,
            description: "If either of the two required fields (cardCode, collectionCode) cannot be clearly identified, describe the specific problem here."
        }
    },
    required: ["cardCode", "collectionCode"],
};

/**
 * Identifies the card's card code and collection code from an image.
 * This focused approach is more reliable than extracting all details via AI.
 * @param base64ImageData The base64 encoded image data.
 * @returns A promise that resolves to the card's card code and collection code.
 */
export async function identifyCard(base64ImageData: string): Promise<{ cardCode: string; collectionCode: string }> {
  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
            { text: `You are an expert at identifying Yu-Gi-Oh! cards from images. Your goal is to extract two key pieces of information with maximum precision.
1.  **cardCode**: The 8-digit number at the bottom-left.
2.  **collectionCode**: This is CRITICAL. It is located just below the artwork on the right side. It looks like 'XXX-ENNNN' or similar (e.g., 'SKE-001', 'LOB-EN125'). Double-check your reading of this code.
If either of these two fields are obscured, blurry, or unreadable, you MUST specify which one in the 'error' field. Do not guess.` },
            { inlineData: { mimeType: 'image/jpeg', data: base64ImageData.split(',')[1] } }
        ],
        config: {
            systemInstruction: "You are an expert Yu-Gi-Oh! card identifier. Your only output is a JSON object matching the requested schema. Do not add any conversational text or markdown formatting.",
            responseMimeType: "application/json",
            responseSchema: cardSchema,
        },
    });

    const cardData = JSON.parse(response.text);

    if (cardData.error) {
        throw new Error(cardData.error);
    }

    if (!cardData.cardCode || !cardData.collectionCode) {
        throw new Error("Could not read the card's 8-digit code and collection code. Please try again with a clearer picture.");
    }

    return {
        cardCode: cardData.cardCode,
        collectionCode: cardData.collectionCode
    };
  } catch (error) {
    console.error("Error identifying card:", error);
    if (error instanceof Error) {
        if (error.message.toLowerCase().includes("quota")) {
            throw new Error("API Limit Reached: You've made too many scan requests in a short time. Please wait a minute and try again.");
        }
        if (error.message.includes("Could not read")) {
            throw error;
        }
    }
    throw new Error("Could not identify the card from the image. Please try again with a clearer picture.");
  }
}