-- Migration: initial
-- Timestamp: 000000_initial

CREATE TABLE "User" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" TEXT NOT NULL UNIQUE,
  "password" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) DEFAULT now() NOT NULL
);

CREATE TABLE "Card" (
  "id" SERIAL PRIMARY KEY,
  "nomeEN" TEXT NOT NULL,
  "nomeBR" TEXT NOT NULL,
  "efeitoEN" TEXT,
  "efeitoBR" TEXT,
  "cardType" TEXT NOT NULL,
  "atributo" TEXT,
  "tipo1" TEXT,
  "tipo2" TEXT,
  "levelOrRank" INTEGER,
  "atk" INTEGER,
  "def" INTEGER,
  "cardCode" TEXT UNIQUE,
  "collectorCode" TEXT,
  "createdAt" TIMESTAMP(3) DEFAULT now() NOT NULL,
  "updatedAt" TIMESTAMP(3) DEFAULT now() NOT NULL
);

CREATE TABLE "UserCard" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  "cardId" INTEGER NOT NULL,
  "quantity" INTEGER DEFAULT 0 NOT NULL
);

CREATE TABLE "Deck" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "userId" UUID NOT NULL,
  "createdAt" TIMESTAMP(3) DEFAULT now() NOT NULL,
  "updatedAt" TIMESTAMP(3) DEFAULT now() NOT NULL
);

CREATE TABLE "DeckCard" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "deckId" UUID NOT NULL,
  "userCardId" UUID NOT NULL,
  "quantity" INTEGER DEFAULT 1 NOT NULL
);

-- Foreign keys
ALTER TABLE "UserCard" ADD CONSTRAINT "UserCard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
ALTER TABLE "UserCard" ADD CONSTRAINT "UserCard_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE RESTRICT;

ALTER TABLE "Deck" ADD CONSTRAINT "Deck_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;

ALTER TABLE "DeckCard" ADD CONSTRAINT "DeckCard_deckId_fkey" FOREIGN KEY ("deckId") REFERENCES "Deck"("id") ON DELETE CASCADE;
ALTER TABLE "DeckCard" ADD CONSTRAINT "DeckCard_userCardId_fkey" FOREIGN KEY ("userCardId") REFERENCES "UserCard"("id") ON DELETE RESTRICT;

-- Indexes and unique constraints
CREATE UNIQUE INDEX "UserCard_userId_cardId_key" ON "UserCard" ("userId", "cardId");
CREATE UNIQUE INDEX "DeckCard_deckId_userCardId_key" ON "DeckCard" ("deckId", "userCardId");

CREATE INDEX "UserCard_userId_idx" ON "UserCard" ("userId");
CREATE INDEX "UserCard_cardId_idx" ON "UserCard" ("cardId");
CREATE INDEX "Deck_deck_userId_idx" ON "Deck" ("userId");
CREATE INDEX "DeckCard_deckId_idx" ON "DeckCard" ("deckId");
CREATE INDEX "DeckCard_userCardId_idx" ON "DeckCard" ("userCardId");
