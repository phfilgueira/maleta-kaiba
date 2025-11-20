import { PrismaClient } from "@prisma/client";

export const config = {
  runtime: "nodejs",
};

const prisma = new PrismaClient();

export default async function handler(req: any, res: any) {
  try {
    if (req.method === "GET") {
      const cards = await prisma.card.findMany({
        orderBy: { created_at: "desc" }
      });

      return res.status(200).json(cards);
    }

    if (req.method === "POST") {
      const data = req.body;

      const newCard = await prisma.card.create({
        data: {
          nome_en: data.nome_en,
          nome_br: data.nome_br,
          efeito_en: data.efeito_en,
          efeito_br: data.efeito_br,
          card_type: data.card_type,
          atributo: data.atributo,
          tipo1: data.tipo1,
          tipo2: data.tipo2,
          level_rank: data.level_rank,
          atk: data.atk,
          def: data.def,
          card_code: data.card_code,
          collector_code: data.collector_code,
          quantidade: data.quantidade ?? 1,
        },
      });

      return res.status(201).json(newCard);
    }

    return res.status(405).json({ error: "Method not allowed" });

  } catch (err) {
    console.error("Erro na API /api/cards:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
