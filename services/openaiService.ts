import OpenAI from "openai";

const client = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY
});

export interface IdentificationResult {
  cardCode: string;        // Passcode (8 dígitos)
  collectionCode: string; // Código do set (ex: LOB-EN001)
  name: string;            // Nome da carta
}

export const identifyCard = async (
  base64Image: string
): Promise<IdentificationResult> => {
  try {
    const base64Data = base64Image.split(",")[1] || base64Image;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are an expert Yu-Gi-Oh! card identifier. Extract information precisely."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `
Analyze this Yu-Gi-Oh! card image carefully.

Extract:
1. Passcode (8-digit number, bottom left). If missing, return empty string.
2. Set Code (e.g., LOB-EN001). If missing, return empty string.
3. Exact card name in English.

Return ONLY raw JSON with:
{
  "cardCode": "",
  "collectionCode": "",
  "name": ""
}
`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Data}`
              }
            }
          ]
        }
      ],
      temperature: 0
    });

    const text = response.choices[0]?.message?.content;

    if (!text) {
      throw new Error("Empty response from OpenAI");
    }

    const cleaned = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    return {
      cardCode: parsed.cardCode || "",
      collectionCode: parsed.collectionCode || "",
      name: parsed.name || ""
    };
  } catch (err) {
    console.error("OpenAI identifyCard error:", err);
    throw err;
  }
};
