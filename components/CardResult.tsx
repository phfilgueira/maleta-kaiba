import React, { useState, useEffect } from 'react';
import { Card, ArtworkInfo } from '../types';
import { PlusIcon, RetryIcon, CheckCircleIcon, ExclamationCircleIcon } from './icons';
import { RARITIES } from '../constants';
import CardImage from './CardImage';
import ArtworkSelector from './ArtworkSelector';

interface CardResultProps {
  card: Omit<Card, 'id' | 'quantity' | 'imageUrl' | 'dateAdded'>;
  onAdd: (details: { rarity: string; quantity: number; collectionCode: string, collectionName?: string, releaseDate?: string | null }) => void;
  onRetry: () => void;
  availableArtworks: ArtworkInfo[];
  selectedArtwork: ArtworkInfo;
  onArtworkSelect: (artwork: ArtworkInfo) => void;
  printWasFound: boolean;
  validSets?: { name: string; code: string; rarity: string; releaseDate?: string | null }[];
}

// Mapas de prefixos regionais (PT) para o padrão internacional (EN/DB)
const PREFIX_MAP: Record<string, string> = {
    'LDB': 'LOB', // A Lenda do Dragão Branco -> Legend of Blue Eyes
    'PMT': 'MRD', // Predadores Metálicos -> Metal Raiders
    'MRL': 'SRL', // Magic Ruler -> Spell Ruler
    'DDK': 'SDK', // Deck de Duelo Kaiba
    'DDY': 'SDY', // Deck de Duelo Yugi
    'DDJ': 'SDJ', // Deck de Duelo Joey
    'DDP': 'SDP', // Deck de Duelo Pegasus
    'DDE': 'SYE', // Yugi Evolution
    'DDC': 'SKE', // Kaiba Evolution
};

const DetailItem = ({ label, value }: { label: string; value: string | number | null | undefined }) => {
    if (value === null || value === undefined) return null;
    return (
        <div>
            <p className="text-xs text-purple-300 font-orbitron">{label}</p>
            <p className="text-md text-white">{value}</p>
        </div>
    );
};

const CardResult: React.FC<CardResultProps> = ({ card, onAdd, onRetry, availableArtworks, selectedArtwork, onArtworkSelect, printWasFound, validSets = [] }) => {
  const getInitialRarity = (suggestedRarity?: string | null) => {
    return suggestedRarity && RARITIES.includes(suggestedRarity) ? suggestedRarity : 'Common';
  };
  
  const [rarity, setRarity] = useState(getInitialRarity(card.rarity));
  const [quantity, setQuantity] = useState(1);
  const [collectionCode, setCollectionCode] = useState(card.collectionCode);
  const [showPrintWarning, setShowPrintWarning] = useState(!printWasFound);
  const [matchedSetName, setMatchedSetName] = useState<string | null>(null);
  const [matchedReleaseDate, setMatchedReleaseDate] = useState<string | null>(null);

  useEffect(() => {
    setRarity(getInitialRarity(card.rarity));
    setQuantity(1);
    setCollectionCode(card.collectionCode);
    setShowPrintWarning(!printWasFound);
  }, [card, printWasFound]);

  const parseSetCode = (code: string) => {
    if (!code) return { prefix: '', number: '' };
    const clean = code.toUpperCase().replace(/\s+/g, ''); 
    const parts = clean.split('-');
    
    if (parts.length < 2) return { prefix: clean, number: '' };
    
    const prefix = parts[0]; 
    const suffix = parts[1]; 
    const number = suffix.replace(/\D/g, ''); 
    
    return { prefix, number };
  };

  useEffect(() => {
    const userParsed = parseSetCode(collectionCode);
    
    const match = validSets.find(s => {
        const dbParsed = parseSetCode(s.code);
        
        if (!userParsed.number && !dbParsed.number) {
            return userParsed.prefix === dbParsed.prefix;
        }

        if (userParsed.number !== dbParsed.number) return false;
        if (userParsed.prefix === dbParsed.prefix) return true;
        if (PREFIX_MAP[userParsed.prefix] === dbParsed.prefix) return true;
        
        return false;
    });

    if (match) {
        setMatchedSetName(match.name);
        setMatchedReleaseDate(match.releaseDate || null);
        setShowPrintWarning(false);
        if (match.rarity && RARITIES.includes(match.rarity) && rarity === 'Common') {
            setRarity(match.rarity);
        }
    } else {
        setMatchedSetName(null);
        setMatchedReleaseDate(null);
        setShowPrintWarning(true);
    }
  }, [collectionCode, validSets, rarity]);

  const handleAdd = () => {
    if (quantity > 0 && rarity.trim() !== '' && collectionCode.trim() !== '') {
        onAdd({ 
            rarity, 
            quantity, 
            collectionCode,
            collectionName: matchedSetName || undefined,
            releaseDate: matchedReleaseDate
        });
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/95 z-40 overflow-y-auto backdrop-blur-md animate-fade-in">
        <div className="min-h-screen flex items-center justify-center p-4 py-8">
            <div className="bg-gray-800 rounded-2xl shadow-2xl shadow-purple-900/50 w-full max-w-5xl flex flex-col md:flex-row gap-8 p-6 border border-purple-700/50">
                
                <div className="w-full md:w-1/3 flex-shrink-0 flex flex-col items-center">
                    <CardImage 
                        imageUrl={selectedArtwork.imageUrl}
                        rarity={rarity}
                        alt={card.name}
                        className="w-2/3 md:w-full max-w-[280px] rounded-lg shadow-lg mb-4 transition-all duration-300"
                    />
                    <ArtworkSelector 
                        artworks={availableArtworks}
                        selected={selectedArtwork}
                        onSelect={onArtworkSelect}
                    />
                </div>

                <div className="flex-grow flex flex-col min-w-0">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-bold text-yellow-300 font-orbitron mb-1 leading-tight">{card.name}</h2>
                        {card.name_pt && <h3 className="text-lg md:text-xl text-gray-300 -mt-1 mb-3 font-light">{card.name_pt}</h3>}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-4">
                        <DetailItem label="Card Type" value={card.type} />
                        <DetailItem label="Attribute" value={card.attribute} />
                        
                        {/* Tags Section replaces old Type 1 / Type 2 */}
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

                    <div className="space-y-4 mb-6 bg-gray-900/50 p-4 rounded-xl border border-gray-700">
                         <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1">
                                <label className="block text-xs text-purple-300 font-orbitron mb-1">Rarity</label>
                                <select 
                                    value={rarity} 
                                    onChange={(e) => setRarity(e.target.value)}
                                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-purple-500 focus:border-purple-500"
                                >
                                    {RARITIES.map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs text-purple-300 font-orbitron mb-1">Quantity</label>
                                <div className="flex items-center gap-3">
                                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-2 rounded-full bg-gray-700 hover:bg-gray-600">
                                        <div className="w-4 h-1 bg-white"></div>
                                    </button>
                                    <span className="text-xl font-bold w-8 text-center">{quantity}</span>
                                    <button onClick={() => setQuantity(quantity + 1)} className="p-2 rounded-full bg-gray-700 hover:bg-gray-600">
                                        <PlusIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>

                         <div>
                            <label className="block text-xs text-purple-300 font-orbitron mb-1">Collection Code</label>
                            <div className="flex items-center gap-2">
                                <input 
                                    type="text" 
                                    value={collectionCode} 
                                    onChange={(e) => setCollectionCode(e.target.value)}
                                    className={`w-full bg-gray-700 border rounded-md px-3 py-2 text-white focus:ring-purple-500 focus:border-purple-500 uppercase ${showPrintWarning ? 'border-yellow-500' : 'border-green-500'}`}
                                />
                                {showPrintWarning ? (
                                    <ExclamationCircleIcon className="w-6 h-6 text-yellow-500 flex-shrink-0" />
                                ) : (
                                    <CheckCircleIcon className="w-6 h-6 text-green-500 flex-shrink-0" />
                                )}
                            </div>
                            {matchedSetName && (
                                <div className="mt-1">
                                    <p className="text-green-400 text-sm font-medium">{matchedSetName}</p>
                                    {matchedReleaseDate && (
                                        <p className="text-gray-400 text-xs">Released: {matchedReleaseDate}</p>
                                    )}
                                </div>
                            )}
                            {showPrintWarning && (
                                <p className="text-yellow-500 text-xs mt-1">
                                    Code not found in database for this card. You can still add it as a custom entry.
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="bg-gray-900/50 p-3 rounded-lg border border-gray-700 mb-6 flex-grow">
                        <p className="text-sm italic text-gray-300 whitespace-pre-wrap">{card.description}</p>
                         {card.description_pt && (
                            <>
                                <hr className="my-2 border-gray-600" />
                                <p className="text-sm italic text-gray-300 whitespace-pre-wrap">{card.description_pt}</p>
                            </>
                        )}
                    </div>

                    <div className="flex gap-4 mt-auto">
                        <button 
                            onClick={onRetry}
                            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
                        >
                            <RetryIcon className="w-5 h-5" />
                            Retry Scan
                        </button>
                        <button 
                            onClick={handleAdd}
                            className="flex-[2] bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-lg shadow-purple-900/50"
                        >
                            <PlusIcon className="w-5 h-5" />
                            Add to Collection
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default CardResult;