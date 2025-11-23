
import React, { useState, useEffect, useMemo } from 'react';
import { Card, ArtworkInfo, Deck } from '../types';
import { PlusIcon, MinusIcon, TrashIcon, CloseIcon } from './icons';
import CardImage from './CardImage';
import ArtworkSelector from './ArtworkSelector';
import { getCardSets } from '../services/ygoProDeckService';

interface CardDetailModalProps {
  card: Card;
  onClose: () => void;
  onUpdateQuantity: (cardId: string, newQuantity: number) => boolean;
  availableArtworks: ArtworkInfo[];
  onUpdateArtwork: (newArtwork: ArtworkInfo) => void;
  decks: Deck[];
}

const DetailItem = ({ label, value }: { label: string; value: string | number | null | undefined }) => {
    if (value === null || value === undefined) return null;
    return (
        <div>
            <p className="text-xs text-purple-300 font-orbitron">{label}</p>
            <p className="text-md">{value}</p>
        </div>
    );
};


const CardDetailModal: React.FC<CardDetailModalProps> = ({ card, onClose, onUpdateQuantity, availableArtworks, onUpdateArtwork, decks }) => {
  const [adjustMode, setAdjustMode] = useState<'add' | 'remove' | null>(null);
  const [adjustValue, setAdjustValue] = useState(1);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [fetchedSetName, setFetchedSetName] = useState<string | null>(null);
  
  useEffect(() => {
    setAdjustMode(null);
    setAdjustValue(1);
    setIsConfirmingDelete(false);
    setFetchedSetName(null);
  }, [card]);

  // Logic to fetch set name for legacy cards that don't have it saved
  useEffect(() => {
    if (!card.collectionName && card.collectionCode) {
        getCardSets(card.cardCode).then(sets => {
            if (sets && sets.length > 0) {
                // Parse user collection code
                const userCodeClean = card.collectionCode.toUpperCase().replace(/\s+/g, ''); 
                const userParts = userCodeClean.split('-');
                
                const match = sets.find((s: any) => {
                     const dbCodeClean = s.set_code.toUpperCase().replace(/\s+/g, '');
                     const dbParts = dbCodeClean.split('-');
                     
                     // Direct Match
                     if (dbCodeClean === userCodeClean) return true;
                     
                     // Fuzzy match (ignore region letters EN/PT/etc)
                     if (dbParts.length >= 2 && userParts.length >= 2) {
                        return dbParts[0] === userParts[0] && 
                               dbParts[1].replace(/\D/g,'') === userParts[1].replace(/\D/g,'');
                     }
                     return false;
                });
                
                if (match) {
                    setFetchedSetName(match.set_name);
                }
            }
        });
    }
  }, [card.collectionCode, card.collectionName, card.cardCode]);

  const allocationInfo = useMemo(() => {
    if (!card) return { maleta: 0, deckUsage: [] };

    const deckUsage: { name: string; count: number }[] = [];
    let totalUsed = 0;

    decks.forEach(deck => {
      const countInDeck = [
        ...deck.mainDeck,
        ...deck.extraDeck,
        ...deck.sideDeck
      ].filter(id => id === card.id).length;
      
      if (countInDeck > 0) {
        deckUsage.push({ name: deck.name, count: countInDeck });
        totalUsed += countInDeck;
      }
    });

    const maleta = card.quantity - totalUsed;
    
    deckUsage.sort((a, b) => a.name.localeCompare(b.name));

    return { maleta, deckUsage };
  }, [card, decks]);


  const handleConfirmAdjust = () => {
    if (!adjustMode) return;
    const amount = Number(adjustValue);
    if (isNaN(amount) || amount <= 0) {
        setAdjustMode(null);
        setAdjustValue(1);
        return;
    };

    if (adjustMode === 'add') {
        const newQuantity = card.quantity + amount;
        onUpdateQuantity(card.id, newQuantity);
        setAdjustMode(null);
        setAdjustValue(1);
    } else { // 'remove' mode
        const newQuantity = card.quantity - amount;
        if (newQuantity < 0) { // Should not happen with validation but good to have
            return;
        }

        const success = onUpdateQuantity(card.id, newQuantity);
        if (success) {
            if (newQuantity === 0) {
                // Parent handles closing modal
            } else {
                setAdjustMode(null);
                setAdjustValue(1);
            }
        } else {
            // If update failed (e.g. card is in use), just reset the adjustment UI
            setAdjustMode(null);
            setAdjustValue(1);
        }
    }
  };

  const handleCancelAdjust = () => {
    setAdjustMode(null);
    setAdjustValue(1);
  };

  const handleDelete = () => {
     if (allocationInfo.deckUsage.length > 0) {
        alert("Cannot remove all copies. This card is still in use in one or more decks.");
        return;
    }
    setIsConfirmingDelete(true);
  };

  const executeDelete = () => {
    onUpdateQuantity(card.id, 0);
    // The parent component will close the modal, but we can reset state here too.
    setIsConfirmingDelete(false);
    setAdjustMode(null);
  };

  const cancelDelete = () => {
    setIsConfirmingDelete(false);
    setAdjustMode(null);
    setAdjustValue(1);
  };

  const getSelectedArtwork = (): ArtworkInfo => {
    const artworkId = parseInt(card.id.split('-').pop() || '0', 10);
    return {
        id: artworkId,
        imageUrl: card.imageUrl,
    };
  };
  
  return (
    <div 
        className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-modal="true"
        role="dialog"
    >
      <div 
        className="bg-gray-800 rounded-2xl shadow-2xl shadow-purple-900/50 w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 border border-purple-700 relative m-4"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
      >
        <button onClick={onClose} className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/30 hover:bg-black/60 transition-colors text-gray-300 hover:text-white" aria-label="Close">
            <CloseIcon className="w-6 h-6" />
        </button>

        <div className="flex flex-col sm:flex-row gap-6">
            <div className="w-full sm:w-1/3 flex-shrink-0">
                <CardImage 
                    imageUrl={card.imageUrl}
                    rarity={card.rarity}
                    alt={card.name}
                    className="w-full rounded-lg"
                />
                <ArtworkSelector 
                    artworks={availableArtworks}
                    selected={getSelectedArtwork()}
                    onSelect={onUpdateArtwork}
                />
            </div>
            <div className="flex-grow flex flex-col">
                <div>
                    <h2 className="text-2xl font-bold text-yellow-300 font-orbitron mb-1">{card.name}</h2>
                    {card.name_pt && <h3 className="text-lg text-gray-300 -mt-1 mb-2">{card.name_pt}</h3>}
                    <p className="text-lg text-purple-300">{card.rarity}</p>
                    
                    <div className="mb-4">
                        <span className="text-sm font-bold text-gray-300 mr-2 border border-gray-600 rounded px-1.5 py-0.5 bg-gray-700">{card.collectionCode}</span>
                        {(card.collectionName || fetchedSetName) && (
                            <div className="inline-block">
                                <span className="text-sm text-green-400 font-medium block sm:inline mt-1 sm:mt-0">
                                    {card.collectionName || fetchedSetName}
                                </span>
                                {card.releaseDate && (
                                    <span className="block text-xs text-gray-400">
                                        Released: {card.releaseDate}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                
                <div className="flex-grow">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-4">
                        <DetailItem label="Card Type" value={card.type} />
                        <DetailItem label="Attribute" value={card.attribute} />
                        
                        <div className="col-span-2">
                             <p className="text-xs text-purple-300 font-orbitron mb-1">Tags / Types</p>
                             <div className="flex flex-wrap gap-1">
                                {card.typeTags && card.typeTags.length > 0 ? (
                                    card.typeTags
                                    .filter(tag => tag !== 'Non-Effect') // Hide Non-Effect from display
                                    .map(tag => (
                                        <span key={tag} className="px-2 py-0.5 bg-gray-700 border border-gray-600 rounded-full text-xs text-gray-200">
                                            {tag}
                                        </span>
                                    ))
                                ) : (
                                    <span className="text-gray-500 text-sm">None</span>
                                )}
                             </div>
                        </div>

                        <DetailItem label="Level/Rank" value={card.level} />
                        <DetailItem label="ATK" value={card.atk} />
                        <DetailItem label="DEF" value={card.def} />
                        <DetailItem label="Card Code" value={card.cardCode} />
                    </div>

                    <div className="bg-gray-900/50 p-3 rounded-lg border border-gray-700 mb-4">
                        <p className="text-sm italic text-gray-300 whitespace-pre-wrap">{card.description}</p>
                        {card.description_pt && (
                            <>
                                <hr className="my-2 border-gray-600" />
                                <p className="text-sm italic text-gray-300 whitespace-pre-wrap">{card.description_pt}</p>
                            </>
                        )}
                    </div>
                </div>

                <div className="mt-4">
                    <p className="block text-sm text-purple-300 font-orbitron mb-2">Quantity</p>
                    {isConfirmingDelete ? (
                        <div className="p-3 bg-red-900/50 border border-red-700 rounded-lg flex flex-col items-center gap-2 animate-fade-in text-center">
                            <h3 className="font-bold text-lg text-red-300">Confirm Removal</h3>
                            <p className="text-sm text-gray-300 mb-2">This will permanently remove all copies of this card from your collection.</p>
                            <div className="flex w-full gap-4 mt-2">
                                <button onClick={cancelDelete} className="flex-grow bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-3 rounded-md transition-colors">Cancel</button>
                                <button onClick={executeDelete} className="flex-grow bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-3 rounded-md transition-colors">Remove</button>
                            </div>
                        </div>
                    ) : adjustMode ? (
                        <div className="p-2 bg-gray-700 rounded-lg flex items-center gap-2 animate-fade-in">
                            <span className="font-bold text-lg px-2">{adjustMode === 'add' ? 'Add' : 'Remove'}:</span>
                            <input
                                type="number"
                                value={adjustValue}
                                onChange={e => setAdjustValue(Math.max(1, parseInt(e.target.value) || 1))}
                                onFocus={e => e.target.select()}
                                onKeyDown={e => e.key === 'Enter' && handleConfirmAdjust()}
                                className="w-20 bg-gray-900 text-center font-bold text-lg rounded-md p-2 border border-gray-600 focus:ring-purple-500 focus:border-purple-500"
                                min="1"
                                autoFocus
                            />
                            <button onClick={handleConfirmAdjust} className="flex-grow bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-3 rounded-md transition-colors">Confirm</button>
                            <button onClick={handleCancelAdjust} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-3 rounded-md transition-colors">Cancel</button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={() => setAdjustMode('remove')} 
                                className="p-2 rounded-full bg-gray-700 hover:bg-red-600 transition-colors"
                                aria-label="Remove copies"
                            >
                                <MinusIcon className="w-6 h-6" />
                            </button>
                            <div className="text-2xl font-bold w-16 text-center">{card.quantity}</div>
                            <button 
                                onClick={() => setAdjustMode('add')} 
                                className="p-2 rounded-full bg-gray-700 hover:bg-green-600 transition-colors"
                                aria-label="Add copies"
                            >
                                <PlusIcon className="w-6 h-6" />
                            </button>
                            <div className="flex-grow"></div>
                            <button
                                onClick={handleDelete}
                                className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors"
                                aria-label="Remove all copies of this card"
                            >
                                <TrashIcon className="w-5 h-5" />
                                <span>Remove All</span>
                            </button>
                        </div>
                    )}
                </div>
                
                <div className="mt-6 pt-4 border-t border-gray-700">
                    <h3 className="text-sm text-purple-300 font-orbitron mb-2">Allocation</h3>
                    <div className="space-y-1 text-sm">
                        <div className="flex justify-between items-center bg-gray-900/60 p-2 rounded-md">
                            <span className="font-semibold text-gray-200">Maleta (In storage)</span>
                            <span className="font-bold text-lg text-yellow-300">{allocationInfo.maleta}</span>
                        </div>
                        {allocationInfo.deckUsage.map(usage => (
                            <div key={usage.name} className="flex justify-between items-center p-2 rounded-md hover:bg-gray-700/50">
                                <span className="text-gray-300 truncate pr-2">{usage.name}</span>
                                <span className="font-semibold text-gray-200">x{usage.count}</span>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
      </div>
    </div>
  );
};

export default CardDetailModal;