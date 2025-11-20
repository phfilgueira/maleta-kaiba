import { PrismaClient } from "@prisma/client";

export const config = {
  runtime: "nodejs",
};

const prisma = new PrismaClient();

export default async function handler(req: any, res: any) {
  try {
    // GET: lista todos os cards
    if (req.method === "GET") {
      const cards = await prisma.card.findMany({
        orderBy: { createdAt: "desc" },
      });
      return res.status(200).json(cards);
    }

    // POST: cria um novo card e associa ao usuário
    if (req.method === "POST") {
      const data = req.body;

      if (!data.userId) {
        return res.status(400).json({ error: "userId é obrigatório" });
      }

      // 1️⃣ Cria o Card
      const newCard = await prisma.card.create({
        data: {
          nomeEN: data.nomeEN,
          nomeBR: data.nomeBR,
          efeitoEN: data.efeitoEN,
          efeitoBR: data.efeitoBR,
          cardType: data.cardType,
          atributo: data.atributo,
          tipo1: data.tipo1,
          tipo2: data.tipo2,
          levelOrRank: data.levelOrRank,
          atk: data.atk,
          def: data.def,
          cardCode: data.cardCode,
          collectorCode: data.collectorCode,
        },
      });

      // 2️⃣ Cria o UserCard (quantidade do usuário)
      const userCard = await prisma.userCard.create({
        data: {
          userId: data.userId,
          cardId: newCard.id,
          quantity: data.quantity ?? 1,
        },
      });

      // Retorna os dois
      return res.status(201).json({ card: newCard, userCard });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("Erro na API /api/cards:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
