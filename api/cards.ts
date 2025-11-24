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
        orderBy: { name_en: "asc" }, // Atualizado para name_en
      });
      return res.status(200).json(cards);
    }

    // POST: cria um novo card e associa ao usuário
    if (req.method === "POST") {
      const data = req.body;

      // Validação básica
      if (!data.userId || !data.id || !data.name) {
        return res.status(400).json({ error: "Dados incompletos. userId, id e name são obrigatórios." });
      }

      // 1️⃣ Cria ou Atualiza o Card (Upsert é melhor para evitar erro de duplicidade)
      // Mapeia os dados do Frontend (types.ts) para o Backend (schema.prisma)
      const card = await prisma.card.upsert({
        where: { id: data.id },
        update: {
            // Em caso de update, podemos atualizar campos que podem ter mudado
            quantity: undefined, // Quantidade fica na tabela UserCard
        },
        create: {
          id: data.id,
          name_en: data.name, // Mapeando 'name' (front) para 'name_en' (banco)
          name_pt: data.name_pt || null,
          type: data.type,
          typeTags: data.typeTags || [],
          attribute: data.attribute || null,
          level: data.level || null,
          atk: data.atk || null,
          def: data.def || null,
          description: data.description,
          description_pt: data.description_pt || null,
          imageUrl: data.imageUrl,
          cardCode: data.cardCode,
          collectionCode: data.collectionCode,
          collectionName: data.collectionName || null,
          rarity: data.rarity,
          releaseDate: data.releaseDate || null
        },
      });

      // 2️⃣ Cria ou Atualiza o UserCard (quantidade do usuário)
      const userCard = await prisma.userCard.upsert({
        where: {
            userId_cardId: {
                userId: data.userId,
                cardId: card.id
            }
        },
        update: {
            quantity: { increment: data.quantity || 1 },
            dateAdded: Date.now()
        },
        create: {
          userId: data.userId,
          cardId: card.id,
          quantity: data.quantity || 1,
          dateAdded: Date.now()
        },
      });

      return res.status(201).json({ card, userCard });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("Erro na API /api/cards:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
