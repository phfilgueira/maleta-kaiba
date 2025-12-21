export interface IdentificationResult {
  cardCode: string;
  collectionCode: string;
  name: string;
}

export const identifyCard = async (
  base64Image: string
): Promise<IdentificationResult> => {
  console.log("➡️ [OpenAI] Starting card identification");

  // Remove prefixo data:image/jpeg;base64,
  const base64Data = base64Image.split(",")[1] || base64Image;

  const prompt = `
Analyze this Yu-Gi-Oh! card image carefully.

Extract:
1. Passcode (8 digits, usually bottom left). If not visible, return empty string.
2. Set code (e.g. LOB-EN001). If not visible, return empty string.
3. Exact card name.

Return ONLY a raw JSON object in this exact format:
{
  "cardCode": "",
  "collectionCode": "",
  "name": ""
}
`;

  // Timeout para evitar loading infinito
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000); // 20s

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
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
        max_tokens: 300,
        temperature: 0
      })
    });

    clearTimeout(timeout);

    console.log("⬅️ [OpenAI] Response status:", response.status);

    if (!response.ok) {
      const errText = await response.text();
      console.error("❌ OpenAI error response:", errText);
      throw new Error("OpenAI request failed");
    }

    const data = await response.json();
    console.log("📦 [OpenAI] Full response:", data);

    const text = data.choices?.[0]?.message?.content;

    if (!text) {
      throw new Error("OpenAI returned empty content");
    }

    console.log("🧾 [OpenAI] Raw text:", text);

    // 🔒 Extrai SOMENTE o JSON da resposta
    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error("No JSON found in OpenAI response");
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch (err) {
      console.error("❌ JSON parse failed:", jsonMatch[0]);
      throw err;
    }

    console.log("✅ [OpenAI] Parsed result:", parsed);

    return {
      cardCode: parsed.cardCode || "",
      collectionCode: parsed.collectionCode || "",
      name: parsed.name || ""
    };

  } catch (error: any) {
    if (error.name === "AbortError") {
      console.error("⏱️ OpenAI request timed out");
      throw new Error("OpenAI request timeout");
    }

    console.error("🔥 Error identifying card:", error);
    throw error;

  } finally {
    clearTimeout(timeout);
  }
};
