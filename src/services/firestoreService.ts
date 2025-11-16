// FIX: Changed Firebase Firestore imports to use a namespace import to resolve potential module resolution errors.
import * as firestore from "firebase/firestore";
import { Card, Deck } from "../types";
import { db } from './firebase';

// --- Path Builders ---
const cardsCollectionRef = (userId: string) => firestore.collection(db, "users", userId, "cards");
const cardDocRef = (userId: string, cardId: string) => firestore.doc(db, "users", userId, "cards", cardId);
const decksCollectionRef = (userId: string) => firestore.collection(db, "users", userId, "decks");
const deckDocRef = (userId: string, deckId: string) => firestore.doc(db, "users", userId, "decks", deckId);


// --- Card Functions ---

export const getCollectionFromDB = async (userId: string): Promise<Card[]> => {
    const querySnapshot = await firestore.getDocs(cardsCollectionRef(userId));
    return querySnapshot.docs.map(doc => doc.data() as Card);
};

export const upsertCardInDB = async (userId: string, card: Card): Promise<void> => {
    await firestore.setDoc(cardDocRef(userId, card.id), card);
};

export const deleteCardFromDB = async (userId: string, cardId: string): Promise<void> => {
    await firestore.deleteDoc(cardDocRef(userId, cardId));
};

export const updateCardArtworkInDB = async (userId: string, oldCard: Card, newCard: Card): Promise<void> => {
    const batch = firestore.writeBatch(db);
    
    const oldCardRef = cardDocRef(userId, oldCard.id);
    const newCardRef = cardDocRef(userId, newCard.id);
    const newCardDoc = await firestore.getDoc(newCardRef);

    if (newCardDoc.exists()) {
        const existingCard = newCardDoc.data() as Card;
        const finalQuantity = existingCard.quantity + oldCard.quantity;
        batch.update(newCardRef, { quantity: finalQuantity });
        batch.delete(oldCardRef);
    } else {
        batch.delete(oldCardRef);
        batch.set(newCardRef, newCard);
    }
    
    // Also update decks that use the old card id
    const decksSnapshot = await firestore.getDocs(decksCollectionRef(userId));
    decksSnapshot.docs.forEach(deckDoc => {
        const deck = deckDoc.data() as Deck;
        let deckWasModified = false;
        
        const updateDeckList = (list: string[]) => list.map(id => {
            if (id === oldCard.id) {
                deckWasModified = true;
                return newCard.id;
            }
            return id;
        });
        
        const newMainDeck = updateDeckList(deck.mainDeck);
        const newExtraDeck = updateDeckList(deck.extraDeck);
        const newSideDeck = updateDeckList(deck.sideDeck);

        if (deckWasModified) {
            batch.update(deckDoc.ref, {
                mainDeck: newMainDeck,
                extraDeck: newExtraDeck,
                sideDeck: newSideDeck,
                dateUpdated: Date.now()
            });
        }
    });

    await batch.commit();
};


// --- Deck Functions ---

export const getDecksFromDB = async (userId: string): Promise<Deck[]> => {
    const querySnapshot = await firestore.getDocs(decksCollectionRef(userId));
    return querySnapshot.docs.map(doc => doc.data() as Deck);
};

export const saveDeckToDB = async (userId: string, deck: Deck): Promise<void> => {
    await firestore.setDoc(deckDocRef(userId, deck.id), deck);
};

export const deleteDeckFromDB = async (userId: string, deckId: string): Promise<void> => {
    await firestore.deleteDoc(deckDocRef(userId, deckId));
};