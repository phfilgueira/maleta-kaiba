export interface Card {
  id: string; // Will be a composite of cardCode and rarity
  name: string;
  name_pt: string | null;
  type: string;
  race: string | null;
  subType: string | null;
  attribute: string | null;
  level: number | null;
  atk: number | null;
  def: number | null;
  description: string;
  description_pt: string | null;
  imageUrl: string;
  cardCode: string;
  collectionCode: string;
  rarity: string;
  quantity: number;
  dateAdded: number;
}

export type AppView = 'collection' | 'scanning' | 'result' | 'decks' | 'deck-editor';

export interface ArtworkInfo {
    id: number;
    imageUrl: string;
}

export interface Deck {
  id: string;
  name: string;
  mainDeck: string[]; // Array of card IDs from collection
  extraDeck: string[]; // Array of card IDs from collection
  sideDeck: string[]; // Array of card IDs from collection
  dateCreated: number;
  dateUpdated: number;
}