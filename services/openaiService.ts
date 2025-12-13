// .env (no quotes): 
// OPENAI_API_KEY=your_openai_api_key_here

import OpenAI from "openai";

export interface IdentificationResult {
  cardCode: string;      // O número de 8 dígitos (Passcode)
  collectionCode: string; // O código do set (ex: LOB-001)
  name: string;           // Nome da carta
}

export const identifyCard = async (
  base64Image: string
): Promise<IdentificationResult> => {
  try {
    // Remover prefixo se existir (por exemplo: "data:image/jpeg;base64,")
    const base64Data = base64Image.split(",")[1] || base64Image;

    // Prompt para GPT-4o Mini Vision
    const prompt = `Analise cuidadosamente a imagem deste card de Yu-Gi-Oh!. 
Extraia as seguintes informações:
1. O "Passcode" (número de 8 dígitos, geralmente no canto inferior esquerdo). Se não for visível, retorne string vazia.
2. O "Set Code" (código do conjunto, geralmente sob a imagem à direita, ex: LOB-EN001). Se não for visível, retorne string vazia.
3. O nome exato do card.

Retorne APENAS um objeto JSON bruto (sem blocos de código markdown) com chaves: "cardCode", "collectionCode", "name".`;

    // Inicializa o cliente OpenAI com a chave da variável de ambiente
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || ""
    });

    // Envia imagem e prompt para o modelo GPT-4o-mini (vision-enabled)
    const response = await openai.responses.create({
      model: "gpt-4o-mini",
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: prompt },
            { type: "input_image", image_url: `data:image/jpeg;base64,${base64Data}` }
          ]
        }
      ]
    });

    // Obtém texto da resposta (concatena todo conteúdo de saída)
    const text = response.output_text;
    if (!text) {
      throw new Error("Nenhuma resposta recebida do modelo OpenAI.");
    }

    // Limpa possíveis markdown e parseia JSON
    const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const result = JSON.parse(cleanedText);

    return {
      cardCode: result.cardCode || "",
      collectionCode: result.collectionCode || "",
      name: result.name || ""
    };
  } catch (error) {
    console.error("Erro ao identificar o card via OpenAI:", error);
    throw error;
  }
};
