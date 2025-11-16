import {
    collection as firestoreCollection,
    getDocs,
    doc,
    setDoc,
    deleteDoc,
    writeBatch,
    getDoc,
} from "firebase/firestore";
import { Card, Deck } from "../types";
import { db } from './firebase';

// --- Path Builders ---
const cardsCollectionRef = (userId: string) => firestoreCollection(db, "users", userId, "cards");
const cardDocRef = (userId: string, cardId: string) => doc(db, "users", userId, "cards", cardId);
const decksCollectionRef = (userId: string) => firestoreCollection(db, "users", userId, "decks");
const deckDocRef = (userId: string, deckId: string) => doc(db, "users", userId, "decks", deckId);


// --- Card Functions ---

export const getCollectionFromDB = async (userId: string): Promise<Card[]> => {
    const querySnapshot = await getDocs(cardsCollectionRef(userId));
    return querySnapshot.docs.map(doc => doc.data() as Card);
};

export const upsertCardInDB = async (userId: string, card: Card): Promise<void> => {
    await setDoc(cardDocRef(userId, card.id), card);
};

export const deleteCardFromDB = async (userId: string, cardId: string): Promise<void> => {
    await deleteDoc(cardDocRef(userId, cardId));
};

export const updateCardArtworkInDB = async (userId: string, oldCard: Card, newCard: Card): Promise<void> => {
    const batch = writeBatch(db);
    
    const oldCardRef = cardDocRef(userId, oldCard.id);
    const newCardRef = cardDocRef(userId, newCard.id);
    const newCardDoc = await getDoc(newCardRef);

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
    const decksSnapshot = await getDocs(decksCollectionRef(userId));
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
    const querySnapshot = await getDocs(decksCollectionRef(userId));
    return querySnapshot.docs.map(doc => doc.data() as Deck);
};

export const saveDeckToDB = async (userId: string, deck: Deck): Promise<void> => {
    await setDoc(deckDocRef(userId, deck.id), deck);
};

export const deleteDeckFromDB = async (userId: string, deckId: string): Promise<void> => {
    await deleteDoc(deckDocRef(userId, deckId));
};