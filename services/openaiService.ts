export interface IdentificationResult {
  cardCode: string;
  collectionCode: string;
  name: string;
}

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

export const identifyCard = async (
  base64Image: string
): Promise<IdentificationResult> => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("Missing OpenAI API Key");
  }

  const base64Data = base64Image.split(",")[1] || base64Image;

  const response = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0,
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

Return ONLY raw JSON:
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
      ]
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI error: ${err}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;

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
};
