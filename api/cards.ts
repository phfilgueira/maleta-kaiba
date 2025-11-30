import { prisma } from "./prisma";

// GET → listar cartas
export async function GET(request: Request) {
  try {
    const cards = await prisma.card.findMany({
      orderBy: { name_en: "asc" },
    });

    return Response.json(cards);
  } catch (error) {
    console.error("GET /api/cards error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}

// POST → adicionar carta + aumentar quantidade
export async function POST(request: Request) {
  try {
    const data = await request.json();

    if (!data.userId || !data.id || !data.name) {
      return Response.json(
        { error: "userId, id e name são obrigatórios." },
        { status: 400 }
      );
    }

    // 1️⃣ Upsert da carta
    const card = await prisma.card.upsert({
      where: { id: data.id },
      update: {},
      create: {
        id: data.id,
        name_en: data.name,
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
        releaseDate: data.releaseDate || null,
      },
    });

    // 2️⃣ Upsert da coleção do usuário
    const userCard = await prisma.userCard.upsert({
      where: {
        userId_cardId: {
          userId: data.userId,
          cardId: data.id,
        },
      },
      update: {
        quantity: { increment: data.quantity || 1 },
        dateAdded: Date.now(),
      },
      create: {
        userId: data.userId,
        cardId: data.id,
        quantity: data.quantity || 1,
        dateAdded: Date.now(),
      },
    });

    return Response.json(
      { card, userCard },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/cards error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}