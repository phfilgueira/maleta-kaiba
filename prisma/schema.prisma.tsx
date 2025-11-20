generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String     @id @default(uuid())
  email     String     @unique
  password  String
  createdAt DateTime   @default(now())

  collection UserCard[]
  decks      Deck[]
}

model Card {
  id             Int      @id @default(autoincrement()) // id interno
  nomeEN         String
  nomeBR         String
  efeitoEN       String?
  efeitoBR       String?
  cardType       String   // Monster / Spell / Trap
  atributo       String?  // FIRE, WATER, DARK, LIGHT...
  tipo1          String?  // Dragon, Warrior, Quickplay, Field...
  tipo2          String?  // Tuner, Gemini, Spirit...
  levelOrRank    Int?     // Level / Rank
  atk            Int?
  def            Int?
  cardCode       String?  @unique
  collectorCode  String?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  owners      UserCard[]
  deckEntries DeckCard[]
}

model UserCard {
  id        String   @id @default(uuid())
  userId    String
  cardId    Int
  quantity  Int      @default(0) // quantas cópias esse usuário possui dessa carta

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  card Card @relation(fields: [cardId], references: [id], onDelete: Restrict)

  deckEntries DeckCard[]
  @@index([userId])
  @@index([cardId])
  @@unique([userId, cardId]) // um usuário tem um registro por carta
}

model Deck {
  id        String    @id @default(uuid())
  name      String
  userId    String
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  cards DeckCard[]

  @@index([userId])
}

model DeckCard {
  id         String   @id @default(uuid())
  deckId     String
  userCardId String
  quantity   Int      @default(1)

  deck     Deck     @relation(fields: [deckId], references: [id], onDelete: Cascade)
  userCard UserCard @relation(fields: [userCardId], references: [id], onDelete: Restrict)

  @@unique([deckId, userCardId]) // evita duplicar a mesma userCard no mesmo deck
  @@index([deckId])
  @@index([userCardId])
}
