import { PrismaClient } from "@prisma/client";

export const config = {
  runtime: "edge",
};

const prisma = new PrismaClient();

export default async function handler(req: Request) {
  try {
    if (req.method === "GET") {
      const cards = await prisma.card.findMany({
        orderBy: { created_at: "desc" }
      });

      return new Response(JSON.stringify(cards), {
        headers: { "Content-Type": "application/json" }
      });
    }

    if (req.method === "POST") {
      const data = await req.json();

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

      return new Response(JSON.stringify(newCard), {
        status: 201,
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response("Method not allowed", { status: 405 });

  } catch (err) {
    console.error("Erro na API /api/cards:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
