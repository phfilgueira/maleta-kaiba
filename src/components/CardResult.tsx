import React, { useState, useEffect } from 'react';
import { Card, ArtworkInfo } from '../types';
import { PlusIcon, RetryIcon } from './icons';
import { RARITIES } from '../constants';
import CardImage from './CardImage';
import ArtworkSelector from './ArtworkSelector';

interface CardResultProps {
  // FIX: Omitted 'dateAdded' from the card prop type as it is not present on identified cards before they are added to the collection.
  card: Omit<Card, 'id' | 'quantity' | 'imageUrl' | 'dateAdded'>;
  onAdd: (details: { rarity: string; quantity: number; collectionCode: string }) => Promise<void>;
  onRetry: () => void;
  availableArtworks: ArtworkInfo[];
  selectedArtwork: ArtworkInfo;
  onArtworkSelect: (artwork: ArtworkInfo) => void;
  printWasFound: boolean;
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

const CardResult: React.FC<CardResultProps> = ({ card, onAdd, onRetry, availableArtworks, selectedArtwork, onArtworkSelect, printWasFound }) => {
  const getInitialRarity = (suggestedRarity?: string | null) => {
    return suggestedRarity && RARITIES.includes(suggestedRarity) ? suggestedRarity : 'Common';
  };
  
  const [rarity, setRarity] = useState(getInitialRarity(card.rarity));
  const [quantity, setQuantity] = useState(1);
  const [collectionCode, setCollectionCode] = useState(card.collectionCode);
  const [showPrintWarning, setShowPrintWarning] = useState(!printWasFound);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    setRarity(getInitialRarity(card.rarity));
    setQuantity(1);
    setCollectionCode(card.collectionCode);
    setShowPrintWarning(!printWasFound);
  }, [card, printWasFound]);

  const handleAdd = async () => {
    if (isAdding || quantity <= 0 || rarity.trim() === '' || collectionCode.trim() === '') {
        return;
    }
    setIsAdding(true);
    try {
        await onAdd({ rarity, quantity, collectionCode });
        // On success, the parent component handles unmounting this view.
    } catch (error) {
        console.error("Add to collection failed:", error);
        // If it fails, the parent shows an alert, and we re-enable the button.
        setIsAdding(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-90 z-40 flex items-center justify-center p-4 backdrop-blur-md animate-fade-in">
        <div className="bg-gray-800 rounded-2xl shadow-2xl shadow-purple-900/50 w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col md:flex-row gap-4 p-6 border border-purple-700">
            <div className="w-full md:w-1/3 flex-shrink-0 flex flex-col">
                <CardImage 
                    imageUrl={selectedArtwork.imageUrl}
                    rarity={rarity}
                    alt={card.name}
                    className="w-full rounded-lg"
                />
                <ArtworkSelector 
                    artworks={availableArtworks}
                    selected={selectedArtwork}
                    onSelect={onArtworkSelect}
                />
            </div>
            <div className="flex-grow flex flex-col">
                <h2 className="text-3xl font-bold text-yellow-300 font-orbitron mb-1">{card.name}</h2>
                {card.name_pt && <p className="text-lg text-gray-300 -mt-1 mb-2">{card.name_pt}</p>}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2 mb-4">
                    <DetailItem label="Card Type" value={card.type} />
                    <DetailItem label="Type 1" value={card.race} />
                    <DetailItem label="Type 2" value={card.subType} />
                    <DetailItem label="Attribute" value={card.attribute} />
                    <DetailItem label="Level/Rank" value={card.level} />
                    <DetailItem label="ATK" value={card.atk} />
                    <DetailItem label="DEF" value={card.def} />
                     <div>
                        <label htmlFor="collectionCode" className="block text-xs text-purple-300 font-orbitron mb-1">Collection</label>
                        <input
                            id="collectionCode"
                            type="text"
                            value={collectionCode}
                            onChange={(e) => setCollectionCode(e.target.value)}
                            onFocus={(e) => e.target.select()}
                            className={`w-full bg-gray-700 border rounded-md px-3 py-2 text-white focus:ring-purple-500 focus:border-purple-500 text-md transition-all ${
                                showPrintWarning ? 'border-yellow-500 ring-2 ring-yellow-500/50' : 'border-gray-600'
                            }`}
                        />
                         {showPrintWarning && (
                            <div className="mt-2 p-3 bg-yellow-900/50 border border-yellow-700 rounded-md text-sm text-yellow-200 animate-fade-in">
                                <p className="font-bold mb-1">Print Not Found</p>
                                <p>We couldn't find this collection code. Please check if it's correct. If so, you can still add it.</p>
                                <button 
                                    onClick={() => setShowPrintWarning(false)} 
                                    className="mt-2 text-xs font-bold underline hover:text-white transition-colors"
                                    aria-label="Acknowledge print not found warning"
                                >
                                    Dismiss warning
                                </button>
                            </div>
                        )}
                    </div>
                    <DetailItem label="Card Code" value={card.cardCode} />
                </div>
                <div className="bg-gray-900/50 p-3 rounded-lg flex-grow border border-gray-700">
                    <p className="text-sm italic text-gray-300 whitespace-pre-wrap">{card.description}</p>
                    {card.description_pt && (
                        <>
                            <hr className="my-2 border-gray-600" />
                            <p className="text-sm italic text-gray-300 whitespace-pre-wrap">{card.description_pt}</p>
                        </>
                    )}
                </div>
                
                {/* Rarity and Quantity Inputs */}
                <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                        <label htmlFor="rarity" className="block text-xs text-purple-300 font-orbitron mb-1">Rarity</label>
                        <select
                            id="rarity"
                            value={rarity}
                            onChange={(e) => setRarity(e.target.value)}
                            className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-purple-500 focus:border-purple-500 appearance-none"
                            style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
                        >
                            {RARITIES.map(r => (
                                <option key={r} value={r}>{r}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="quantity" className="block text-xs text-purple-300 font-orbitron mb-1">Quantity</label>
                        <input
                            id="quantity"
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                            onFocus={(e) => e.target.select()}
                            className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-purple-500 focus:border-purple-500"
                            min="1"
                        />
                    </div>
                </div>

                 <div className="flex flex-col sm:flex-row gap-4 mt-6">
                    <button
                        onClick={handleAdd}
                        disabled={isAdding}
                        className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200 disabled:bg-green-800 disabled:cursor-wait"
                    >
                        {isAdding ? (
                            <>
                                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Adding...</span>
                            </>
                        ) : (
                            <>
                                <PlusIcon className="w-6 h-6" />
                                <span>Add to Collection</span>
                            </>
                        )}
                    </button>
                    <button
                        onClick={onRetry}
                        disabled={isAdding}
                        className="flex-1 flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50"
                    >
                        <RetryIcon className="w-6 h-6" />
                        Scan Another
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};

export default CardResult;