export interface IdentificationResult {
  cardCode: string;
  collectionCode: string;
  name: string;
}

export const identifyCard = async (
  base64Image: string
): Promise<IdentificationResult> => {
  const base64Data = base64Image.split(",")[1] || base64Image;

  const prompt = `Analyze this Yu-Gi-Oh! card image carefully.
Extract:
1. Passcode (8 digits, bottom left). If not visible, return empty string.
2. Set code (e.g. LOB-EN001). If not visible, return empty string.
3. Exact card name.

Return ONLY raw JSON:
{ "cardCode": "", "collectionCode": "", "name": "" }`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Data}`
              }
            }
          ]
        }
      ],
      max_tokens: 300
    })
  });

  if (!response.ok) {
    throw new Error("OpenAI request failed");
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;

  if (!text) throw new Error("No response text from OpenAI");

  const cleaned = text.replace(/```json|```/g, "").trim();
  const result = JSON.parse(cleaned);

  return {
    cardCode: result.cardCode || "",
    collectionCode: result.collectionCode || "",
    name: result.name || ""
  };
};