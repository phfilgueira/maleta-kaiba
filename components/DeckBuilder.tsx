import React, { useState, useMemo, useCallback } from 'react';
import { Deck, Card } from '../types';
import CollectionGrid from './CollectionGrid';
import { TrashIcon } from './icons';
import SearchAndFilter from './SearchAndFilter';

interface DeckBuilderProps {
  deckToEdit: Deck;
  collection: Card[];
  cardUsageMap: { [cardId: string]: number };
  onSave: (deck: Deck) => void;
  onCancel: () => void;
}

const isExtraDeckCard = (card: Card): boolean => {
    return ['Fusion', 'Synchro', 'Xyz', 'Link'].some(type => card.type.includes(type));
};

const DeckSection: React.FC<{
    title: string;
    cardIds: string[];
    collectionMap: Map<string, Card>;
    onRemove: (cardId: string) => void;
    min?: number;
    max: number;
}> = ({ title, cardIds, collectionMap, onRemove, min, max }) => {
    const count = cardIds.length;
    const countColor = (min !== undefined && count < min) || count > max ? 'text-red-400' : 'text-gray-300';

    const groupedCards = useMemo(() => {
        const groups: { [id: string]: { card: Card | undefined; count: number } } = {};
        for (const cardId of cardIds) {
            if (!groups[cardId]) {
                groups[cardId] = { card: collectionMap.get(cardId), count: 0 };
            }
            groups[cardId].count++;
        }
        return Object.entries(groups).sort(([, a], [, b]) => a.card!.name.localeCompare(b.card!.name));
    }, [cardIds, collectionMap]);


    return (
        <div>
            <h3 className="text-lg font-bold font-orbitron text-purple-300 flex justify-between items-center mb-2">
                <span>{title}</span>
                <span className={`text-sm font-sans ${countColor}`}>
                    {count} / {min !== undefined ? `${min}-` : ''}{max}
                </span>
            </h3>
            <div className="space-y-1 pr-2 max-h-64 overflow-y-auto custom-scrollbar">
                {groupedCards.map(([cardId, { card, count }]) =>
                    card ? (
                        <div key={cardId} className="flex items-center gap-2 p-1 bg-gray-700/50 rounded-md">
                            <img src={card.imageUrl} alt={card.name} className="w-8 h-auto rounded-sm flex-shrink-0" />
                            <p className="flex-grow text-sm truncate" title={card.name}>{card.name}</p>
                            <span className="text-xs font-bold text-purple-300 mr-2">x{count}</span>
                            <button onClick={() => onRemove(cardId)} className="p-1 text-red-400 hover:text-red-300 flex-shrink-0">
                                <TrashIcon className="w-4 h-4" />
                            </button>
                        </div>
                    ) : null
                )}
            </div>
        </div>
    );
};


const DeckBuilder: React.FC<DeckBuilderProps> = ({ deckToEdit, collection, cardUsageMap: totalUsageMap, onSave, onCancel }) => {
    const [editedDeck, setEditedDeck] = useState<Deck>(deckToEdit);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilters, setActiveFilters] = useState<{ [key: string]: string | number | undefined }>({});

    const collectionMap = useMemo(() => new Map(collection.map(c => [c.id, c])), [collection]);

    const usageInOriginalDeck = useMemo(() => {
        const usage: { [key: string]: number } = {};
        [...deckToEdit.mainDeck, ...deckToEdit.extraDeck, ...deckToEdit.sideDeck].forEach(cardId => {
            usage[cardId] = (usage[cardId] || 0) + 1;
        });
        return usage;
    }, [deckToEdit]);

    const usageInEditedDeck = useMemo(() => {
        const usage: { [key: string]: number } = {};
        [...editedDeck.mainDeck, ...editedDeck.extraDeck, ...editedDeck.sideDeck].forEach(cardId => {
            usage[cardId] = (usage[cardId] || 0) + 1;
        });
        return usage;
    }, [editedDeck]);
    
    const collectionGridUsageMap = useMemo(() => {
        const usageMap: { [key: string]: number } = {};
        for (const card of collection) {
            const totalUsage = totalUsageMap[card.id] || 0;
            const originalUsage = usageInOriginalDeck[card.id] || 0;
            const otherDecksUsage = totalUsage - originalUsage;
            const currentDeckUsage = usageInEditedDeck[card.id] || 0;
            usageMap[card.id] = otherDecksUsage + currentDeckUsage;
        }
        return usageMap;
    }, [collection, totalUsageMap, usageInOriginalDeck, usageInEditedDeck]);

    const addCardToDeck = useCallback((card: Card) => {
        const currentCopies = usageInEditedDeck[card.id] || 0;
        if (currentCopies >= 3) {
            // TODO: Add user feedback for max copies reached
            return;
        }

        if (isExtraDeckCard(card)) {
            if (editedDeck.extraDeck.length < 15) {
                setEditedDeck(prev => ({ ...prev, extraDeck: [...prev.extraDeck, card.id] }));
            }
        } else {
             if (editedDeck.mainDeck.length < 60) {
                setEditedDeck(prev => ({ ...prev, mainDeck: [...prev.mainDeck, card.id] }));
            }
        }
    }, [editedDeck.extraDeck.length, editedDeck.mainDeck.length, usageInEditedDeck]);
    
    const removeCardFromDeck = (cardId: string, deckKey: 'mainDeck' | 'extraDeck' | 'sideDeck') => {
        setEditedDeck(prev => {
            const newDeckList = [...prev[deckKey]];
            const indexToRemove = newDeckList.lastIndexOf(cardId);
            if (indexToRemove > -1) {
                newDeckList.splice(indexToRemove, 1);
            }
            return { ...prev, [deckKey]: newDeckList };
        });
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEditedDeck(prev => ({ ...prev, name: e.target.value }));
    };
    
    const handleFilterChange = (filterType: string, value: string) => {
      setActiveFilters(prev => {
          const newFilters = { ...prev };
          if (value === '') {
              delete newFilters[filterType];
          } else {
              newFilters[filterType] = value;
          }
          if (filterType === 'mainType') {
              delete newFilters.attribute; delete newFilters.race; delete newFilters.subType;
              delete newFilters.level; delete newFilters.spellType; delete newFilters.trapType;
          }
          return newFilters;
      });
    };

    const handleClearFilters = () => {
        setActiveFilters({});
        setSearchQuery('');
    };

    const filteredCollection = useMemo(() => {
      const query = searchQuery.toLowerCase();
      return collection.filter(card => {
          const matchesQuery = query === '' || card.name.toLowerCase().includes(query) || (card.name_pt && card.name_pt.toLowerCase().includes(query)) || card.description.toLowerCase().includes(query) || (card.description_pt && card.description_pt.toLowerCase().includes(query));
          if (!matchesQuery) return false;
          for (const key in activeFilters) {
              const filterValue = activeFilters[key]; if (!filterValue) continue;
              switch(key) {
                  case 'mainType': if (!card.type.includes(filterValue as string)) return false; break;
                  case 'attribute': if (card.attribute !== filterValue) return false; break;
                  case 'race': if (card.race !== filterValue) return false; break;
                  case 'subType': if (card.subType !== filterValue) return false; break;
                  case 'level': if (card.level !== parseInt(filterValue as string, 10)) return false; break;
                  case 'spellType': if (!card.type.includes('Spell') || !card.type.startsWith(filterValue as string)) return false; break;
                  case 'trapType': if (!card.type.includes('Trap') || !card.type.startsWith(filterValue as string)) return false; break;
                  default: return true;
              }
          }
          return true;
      });
    }, [collection, searchQuery, activeFilters]);

    return (
        <div className="fixed inset-0 bg-gray-900 z-30 flex flex-col animate-fade-in">
            <header className="bg-gray-800/80 backdrop-blur-sm p-4 flex-shrink-0 z-10 flex items-center justify-between gap-4 border-b border-gray-700">
                <input
                    type="text"
                    value={editedDeck.name}
                    onChange={handleNameChange}
                    className="text-2xl font-bold bg-transparent text-yellow-300 font-orbitron tracking-wider focus:outline-none focus:ring-2 focus:ring-purple-500 rounded-md px-2 py-1 -ml-2 w-1/2"
                    placeholder="Deck Name"
                />
                <div className="flex gap-4">
                    <button onClick={onCancel} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">Cancel</button>
                    <button onClick={() => onSave(editedDeck)} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">Save Deck</button>
                </div>
            </header>

            <div className="flex-grow flex overflow-hidden">
                {/* Collection View */}
                <div className="w-2/3 flex flex-col border-r border-gray-700">
                    <div className="flex-shrink-0">
                      <SearchAndFilter
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        filters={activeFilters}
                        onFilterChange={handleFilterChange as any}
                        onClearFilters={handleClearFilters}
                      />
                    </div>
                    <div className="flex-grow overflow-y-auto mt-4 pr-2 custom-scrollbar">
                        <CollectionGrid
                            cards={filteredCollection}
                            totalCollectionSize={collection.length}
                            gridColumns={2}
                            mode="deck-building"
                            onAddToDeck={addCardToDeck}
                            cardUsageMap={collectionGridUsageMap}
                        />
                    </div>
                </div>

                {/* Deck List */}
                <aside className="w-1/3 p-4 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
                    <DeckSection
                        title="Main Deck"
                        cardIds={editedDeck.mainDeck}
                        collectionMap={collectionMap}
                        onRemove={(cardId) => removeCardFromDeck(cardId, 'mainDeck')}
                        min={40} max={60}
                    />
                    <DeckSection
                        title="Extra Deck"
                        cardIds={editedDeck.extraDeck}
                        collectionMap={collectionMap}
                        onRemove={(cardId) => removeCardFromDeck(cardId, 'extraDeck')}
                        max={15}
                    />
                    <DeckSection
                        title="Side Deck"
                        cardIds={editedDeck.sideDeck}
                        collectionMap={collectionMap}
                        onRemove={(cardId) => removeCardFromDeck(cardId, 'sideDeck')}
                        max={15}
                    />
                </aside>
            </div>
        </div>
    );
};

export default DeckBuilder;