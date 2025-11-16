import React from 'react';
import { Deck } from '../types';
import { Card } from '../types';
import { PlusIcon, PencilAltIcon, TrashIcon } from './icons';

interface DecksViewProps {
  decks: Deck[];
  collection: Card[];
  onCreate: () => void;
  onEdit: (deck: Deck) => void;
  onDelete: (deckId: string) => void;
}

const DecksView: React.FC<DecksViewProps> = ({ decks, collection, onCreate, onEdit, onDelete }) => {
    
    const getCardById = (cardId: string) => collection.find(c => c.id === cardId);

    return (
        <div className="p-4 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-orbitron text-purple-300">My Decks</h2>
                <button
                    onClick={onCreate}
                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                >
                    <PlusIcon className="w-6 h-6" />
                    Create New Deck
                </button>
            </div>

            {decks.length === 0 ? (
                <div className="text-center py-20">
                    <h2 className="text-2xl font-bold text-gray-400">No decks found.</h2>
                    <p className="text-gray-500 mt-2">Tap 'Create New Deck' to get started!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {decks.map(deck => {
                        const mainDeckCount = deck.mainDeck.length;
                        const extraDeckCount = deck.extraDeck.length;
                        const sideDeckCount = deck.sideDeck.length;

                        // Find some card images for a preview
                        const previewCardIds = [...deck.mainDeck, ...deck.extraDeck].slice(0, 4);
                        const previewCards = previewCardIds.map(getCardById).filter((c): c is Card => !!c);
                        
                        return (
                            <div key={deck.id} className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 overflow-hidden flex flex-col">
                                <div className="p-4 flex-grow">
                                    <h3 className="text-xl font-bold font-orbitron text-yellow-300 truncate">{deck.name}</h3>
                                    <p className="text-sm text-gray-400">Last updated: {new Date(deck.dateUpdated).toLocaleDateString()}</p>
                                    <div className="flex justify-around text-center my-4">
                                        <div>
                                            <p className="text-2xl font-bold">{mainDeckCount}</p>
                                            <p className="text-xs text-purple-300">Main</p>
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold">{extraDeckCount}</p>
                                            <p className="text-xs text-purple-300">Extra</p>
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold">{sideDeckCount}</p>
                                            <p className="text-xs text-purple-300">Side</p>
                                        </div>
                                    </div>
                                </div>
                                
                                {previewCards.length > 0 && (
                                    <div className="h-24 bg-gray-900/50 flex justify-center items-center p-2 -space-x-8">
                                        {previewCards.map((card, index) => (
                                            <img key={`${card.id}-${index}`} src={card.imageUrl} alt={card.name} className="w-16 h-auto rounded-md shadow-md transform hover:scale-125 hover:z-10 transition-transform" />
                                        ))}
                                    </div>
                                )}

                                <div className="p-2 bg-gray-900 grid grid-cols-2 gap-2">
                                    <button onClick={() => onEdit(deck)} className="flex items-center justify-center gap-2 w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-3 rounded-md transition-colors">
                                        <PencilAltIcon className="w-5 h-5" /> Edit
                                    </button>
                                    <button onClick={() => window.confirm(`Are you sure you want to delete the deck "${deck.name}"?`) && onDelete(deck.id)} className="flex items-center justify-center gap-2 w-full text-center bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-3 rounded-md transition-colors">
                                        <TrashIcon className="w-5 h-5" /> Delete
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default DecksView;
