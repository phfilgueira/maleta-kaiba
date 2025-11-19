import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AppView, Card, ArtworkInfo, Deck } from './types';
import CollectionGrid from './components/CollectionGrid';
import CameraView from './components/CameraView';
import CardResult from './components/CardResult';
import LoadingOverlay from './components/LoadingOverlay';
import CardDetailModal from './components/CardDetailModal';
import DecksView from './components/DecksView';
import DeckBuilder from './components/DeckBuilder';
import SortControl from './components/SortControl';
import ScanErrorDialog from './components/ScanErrorDialog';
import SearchAndFilter from './components/SearchAndFilter';
import ViewModeControl from './components/ViewModeControl';
import { CameraIcon, BookOpenIcon } from './components/icons';
import { identifyCard } from './services/geminiService';
import { searchCard, getArtworksForCard } from './services/ygoProDeckService';
import { RARITIES } from './constants';
import { saveArtworkPreference, getArtworkPreference } from './utils/artworkPreferences';

type IdentifiedCardInfo = Omit<Card, 'id' | 'quantity' | 'imageUrl' | 'dateAdded'>;

interface ResultData {
  card: IdentifiedCardInfo | null;
  artworks: ArtworkInfo[];
  selectedArtwork: ArtworkInfo | null;
  printWasFound: boolean;
}

const rarityOrderMap = RARITIES.reduce((acc, rarity, index) => {
    acc[rarity] = index;
    return acc;
}, {} as Record<string, number>);

type ActiveFilters = { [key: string]: string | number | undefined };

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2);

// Simple navigator component
const AppNavigator: React.FC<{
  currentView: 'collection' | 'decks';
  onNavigate: (view: 'collection' | 'decks') => void;
}> = ({ currentView, onNavigate }) => {
  const getButtonClass = (view: 'collection' | 'decks') => {
    const baseClass = "flex-1 py-3 text-center font-bold font-orbitron tracking-wider transition-all duration-300 flex items-center justify-center gap-2";
    if (currentView === view) {
      return `${baseClass} text-purple-300 border-b-2 border-purple-400 bg-purple-900/20`;
    }
    return `${baseClass} text-gray-500 border-b-2 border-transparent hover:bg-gray-700/50`;
  };

  return (
    <nav className="flex bg-gray-800/80 backdrop-blur-sm sticky top-[68px] z-20">
      <button onClick={() => onNavigate('collection')} className={getButtonClass('collection')}>
        <CameraIcon className="w-5 h-5" /> My Collection
      </button>
      <button onClick={() => onNavigate('decks')} className={getButtonClass('decks')}>
        <BookOpenIcon className="w-5 h-5" /> My Decks
      </button>
    </nav>
  );
};


const App: React.FC = () => {
  const [collection, setCollection] = useState<Card[]>(() => {
    try {
      const savedCollection = localStorage.getItem('yugioh-collection');
      if (savedCollection) {
        const parsed = JSON.parse(savedCollection) as Card[];
        return parsed.map((card, index) => ({
            ...card,
            dateAdded: card.dateAdded || Date.now() - (parsed.length - index) * 1000,
            race: card.race || null,
            subType: card.subType || null,
            name_pt: card.name_pt || null,
            description_pt: card.description_pt || null,
        }));
      }
      return [];
    } catch (error) {
      console.error("Failed to parse collection from localStorage", error);
      return [];
    }
  });
  
  const [decks, setDecks] = useState<Deck[]>(() => {
    try {
        const savedDecks = localStorage.getItem('yugioh-decks');
        return savedDecks ? JSON.parse(savedDecks) : [];
    } catch (error) {
        console.error("Failed to parse decks from localStorage", error);
        return [];
    }
  });

  const [view, setView] = useState<AppView>('collection');
  const [editingDeck, setEditingDeck] = useState<Deck | null>(null);
  const [resultData, setResultData] = useState<ResultData>({
    card: null,
    artworks: [],
    selectedArtwork: null,
    printWasFound: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [isManualEntry, setIsManualEntry] = useState(false);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [modalArtworks, setModalArtworks] = useState<ArtworkInfo[]>([]);
  const [sortOrder, setSortOrder] = useState('date-desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>({});
  const [gridColumns, setGridColumns] = useState<number>(() => {
    const savedColumns = localStorage.getItem('yugioh-grid-columns');
    return savedColumns ? parseInt(savedColumns, 10) : 2;
  });


  useEffect(() => {
    localStorage.setItem('yugioh-collection', JSON.stringify(collection));
  }, [collection]);
  
  useEffect(() => {
    localStorage.setItem('yugioh-decks', JSON.stringify(decks));
  }, [decks]);
  
  useEffect(() => {
    localStorage.setItem('yugioh-grid-columns', String(gridColumns));
  }, [gridColumns]);

  const totalCardCount = useMemo(() => {
    return collection.reduce((acc, card) => acc + card.quantity, 0);
  }, [collection]);

  const uniqueCardNameCount = useMemo(() => {
    const cardNames = new Set(collection.map(card => card.name));
    return cardNames.size;
  }, [collection]);
  
  const cardUsageMap = useMemo(() => {
    const usage: { [cardId: string]: number } = {};
    decks.forEach(deck => {
        deck.mainDeck.forEach(cardId => { usage[cardId] = (usage[cardId] || 0) + 1; });
        deck.extraDeck.forEach(cardId => { usage[cardId] = (usage[cardId] || 0) + 1; });
        deck.sideDeck.forEach(cardId => { usage[cardId] = (usage[cardId] || 0) + 1; });
    });
    return usage;
  }, [decks]);

  const determineDefaultArtwork = useCallback((availableArtworks: ArtworkInfo[], collectionCode: string): ArtworkInfo => {
    if (availableArtworks.length === 0) {
        throw new Error("Cannot determine artwork without available options.");
    }
    
    const preferredArtworkId = getArtworkPreference(collectionCode);
    if (preferredArtworkId) {
        const preferredArtwork = availableArtworks.find(art => art.id === preferredArtworkId);
        if (preferredArtwork) {
            return preferredArtwork;
        }
    }

    return availableArtworks[0];
  }, []);

  const processAndSetCardResult = useCallback(async (searchPromise: Promise<{card: IdentifiedCardInfo, artworks: ArtworkInfo[], printWasFound: boolean}>) => {
    try {
        const { card, artworks, printWasFound } = await searchPromise;
        
        if (artworks.length === 0) {
            throw new Error(`Could not find official artwork for "${card.name}". The card data might be incorrect.`);
        }
        
        const defaultArtwork = determineDefaultArtwork(artworks, card.collectionCode);
        
        setResultData({
            card,
            artworks,
            selectedArtwork: defaultArtwork,
            printWasFound,
        });
        setView('result');
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
        setScanError(errorMessage);
        throw e;
    } finally {
        setIsLoading(false);
    }
  }, [determineDefaultArtwork]);

  const handleCardCapture = useCallback(async (imageData: string) => {
    setView('collection');
    setIsLoading(true);
    setScanError(null);
    const searchPromise = identifyCard(imageData).then(({ cardCode, collectionCode }) => 
        searchCard({ cardCode, collectionCode })
    );
    processAndSetCardResult(searchPromise).catch(() => {});
  }, [processAndSetCardResult]);

  const handleManualSearch = useCallback(async (cardCode: string, collectionCode: string) => {
    setIsLoading(true);
    setScanError(null);
    const searchPromise = searchCard({ cardCode, collectionCode });
    return processAndSetCardResult(searchPromise).then(() => {
        setIsManualEntry(false);
    });
  }, [processAndSetCardResult]);

  const handleArtworkSelect = (artwork: ArtworkInfo) => {
    setResultData(prev => ({ ...prev, selectedArtwork: artwork }));
  };

  const addCardToCollection = (details: { rarity: string; quantity: number; collectionCode: string }) => {
    if (!resultData.card || !resultData.selectedArtwork) return;
    saveArtworkPreference(details.collectionCode, resultData.selectedArtwork.id);
    const newCardId = `${details.collectionCode}-${details.rarity}-${resultData.selectedArtwork.id}`;

    setCollection(prev => {
        const existingCardIndex = prev.findIndex(c => c.id === newCardId);

        if (existingCardIndex > -1) {
            const updatedCollection = [...prev];
            const existingCard = updatedCollection[existingCardIndex];
            existingCard.quantity += details.quantity;
            return updatedCollection;
        } else {
            const newCard: Card = {
              ...resultData.card,
              id: newCardId,
              collectionCode: details.collectionCode,
              rarity: details.rarity,
              quantity: details.quantity,
              imageUrl: resultData.selectedArtwork.imageUrl,
              dateAdded: Date.now(),
            };
            return [...prev, newCard];
        }
    });
    resetScan();
  };

  const resetScan = () => {
    setView('collection');
    setResultData({ card: null, artworks: [], selectedArtwork: null, printWasFound: true });
  };
  
  const startScan = () => {
    setScanError(null);
    setIsManualEntry(false);
    setView('scanning');
  };

  const handleStartManualEntry = () => {
    setView('collection');
    setIsManualEntry(true);
  };

  const handleSelectCard = (card: Card) => {
    setSelectedCard(card);
    setModalArtworks([]);
    getArtworksForCard(card.cardCode)
        .then(artworks => {
            setSelectedCard(currentSelected => {
                if (currentSelected && currentSelected.id === card.id) {
                    setModalArtworks(artworks);
                }
                return currentSelected;
            });
        })
        .catch(console.error);
  };

  const handleCloseModal = () => {
    setSelectedCard(null);
    setModalArtworks([]);
  };

  const handleUpdateQuantity = (cardId: string, newQuantity: number): boolean => {
    const finalQuantity = Math.max(0, newQuantity);
    
    if (finalQuantity < (cardUsageMap[cardId] || 0)) {
        alert(`Cannot reduce quantity. This card is currently used in ${cardUsageMap[cardId]} of your decks.`);
        return false;
    }

    if (finalQuantity === 0) {
        setCollection(prev => prev.filter(c => c.id !== cardId));
        setSelectedCard(null);
    } else {
        setCollection(prev => 
            prev.map(c => 
                c.id === cardId ? { ...c, quantity: finalQuantity } : c
            )
        );
        setSelectedCard(prev => 
            prev && prev.id === cardId ? { ...prev, quantity: finalQuantity } : prev
        );
    }
    return true;
  };

  const handleUpdateArtwork = (cardToUpdate: Card, newArtwork: ArtworkInfo) => {
    const newCardId = `${cardToUpdate.collectionCode}-${cardToUpdate.rarity}-${newArtwork.id}`;

    if (cardToUpdate.id === newCardId) return;
    saveArtworkPreference(cardToUpdate.collectionCode, newArtwork.id);

    setCollection(prev => {
        const collectionWithoutOldCard = prev.filter(c => c.id !== cardToUpdate.id);
        const existingTargetCardIndex = collectionWithoutOldCard.findIndex(c => c.id === newCardId);

        let finalCollection: Card[];
        let updatedCardForModal: Card;

        if (existingTargetCardIndex > -1) {
            const newCollection = [...collectionWithoutOldCard];
            const targetCard = newCollection[existingTargetCardIndex];
            targetCard.quantity += cardToUpdate.quantity;
            updatedCardForModal = targetCard;
            finalCollection = newCollection;
        } else {
            const newCard: Card = {
                ...cardToUpdate,
                id: newCardId,
                imageUrl: newArtwork.imageUrl,
            };
            updatedCardForModal = newCard;
            finalCollection = [...collectionWithoutOldCard, newCard];
        }
        setSelectedCard(updatedCardForModal);
        return finalCollection;
    });
  };

  const handleFilterChange = (filterType: keyof ActiveFilters, value: string) => {
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
  
  // --- Deck Handlers ---
  const handleCreateNewDeck = () => {
    const newDeck: Deck = {
      id: generateId(),
      name: 'New Deck',
      mainDeck: [], extraDeck: [], sideDeck: [],
      dateCreated: Date.now(), dateUpdated: Date.now(),
    };
    setEditingDeck(newDeck);
    setView('deck-editor');
  };

  const handleEditDeck = (deck: Deck) => {
    setEditingDeck(deck);
    setView('deck-editor');
  };

  const handleDeleteDeck = (deckId: string) => {
    setDecks(prev => prev.filter(d => d.id !== deckId));
  };
  
  const handleSaveDeck = (deckToSave: Deck) => {
    deckToSave.dateUpdated = Date.now();
    setDecks(prev => {
        const existingIndex = prev.findIndex(d => d.id === deckToSave.id);
        if (existingIndex > -1) {
            const updatedDecks = [...prev];
            updatedDecks[existingIndex] = deckToSave;
            return updatedDecks;
        }
        return [...prev, deckToSave];
    });
    setEditingDeck(null);
    setView('decks');
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
                default: return false;
            }
        }
        return true;
    });
  }, [collection, searchQuery, activeFilters]);

  const sortedCollection = useMemo(() => {
    const [sortBy, sortDir] = sortOrder.split('-');
    return [...filteredCollection].sort((a, b) => {
        let comparison = 0;
        switch (sortBy) {
            case 'name': comparison = a.name.localeCompare(b.name); break;
            case 'rarity': comparison = (rarityOrderMap[a.rarity] ?? 99) - (rarityOrderMap[b.rarity] ?? 99); break;
            case 'collection': comparison = a.collectionCode.localeCompare(b.collectionCode); break;
            case 'date': comparison = a.dateAdded - b.dateAdded; break;
            default: return 0;
        }
        return sortDir === 'asc' ? comparison : -comparison;
    });
  }, [filteredCollection, sortOrder]);


  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800/50 backdrop-blur-sm sticky top-0 z-20 shadow-lg shadow-purple-900/20">
        <div className="container mx-auto px-4 py-3">
          <h1 className="text-2xl font-bold text-center text-purple-300 font-orbitron tracking-wider">
            Yu-Gi-Oh! Card Collector
          </h1>
           <p className="text-center text-gray-400 text-sm mt-1 font-orbitron">
                Total: <span className="text-purple-300 font-bold">{totalCardCount}</span> | Unique: <span className="text-purple-300 font-bold">{uniqueCardNameCount}</span> | Prints: <span className="text-purple-300 font-bold">{collection.length}</span>
            </p>
        </div>
      </header>
      
      {(view === 'collection' || view === 'decks') && (
        <AppNavigator 
          currentView={view} 
          onNavigate={(v) => {
            setView(v);
            handleClearFilters();
          }} 
        />
      )}

      {view === 'collection' && (
          <SearchAndFilter
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            filters={activeFilters}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
          />
        )}

      <main className="container mx-auto pb-24">
        {view === 'collection' && (
          <>
            {collection.length > 0 && (
              <div className="p-4 flex items-center justify-between">
                <ViewModeControl value={gridColumns} onChange={setGridColumns} />
                <SortControl value={sortOrder} onChange={setSortOrder} />
              </div>
            )}
            <CollectionGrid 
              cards={sortedCollection} 
              onCardClick={handleSelectCard}
              totalCollectionSize={collection.length}
              gridColumns={gridColumns}
            />
          </>
        )}
        {view === 'decks' && (
            <DecksView 
                decks={decks}
                collection={collection}
                onCreate={handleCreateNewDeck}
                onEdit={handleEditDeck}
                onDelete={handleDeleteDeck}
            />
        )}
      </main>
      
      {view === 'deck-editor' && editingDeck && (
        <DeckBuilder
            deckToEdit={editingDeck}
            collection={collection}
            cardUsageMap={cardUsageMap}
            onSave={handleSaveDeck}
            onCancel={() => { setEditingDeck(null); setView('decks'); }}
        />
      )}

      {view === 'scanning' && (
        <CameraView onCapture={handleCardCapture} onCancel={resetScan} onManualEntry={handleStartManualEntry} />
      )}
      
      {view === 'result' && resultData.card && resultData.selectedArtwork && (
        <CardResult 
            key={resultData.card.cardCode} card={resultData.card} onAdd={addCardToCollection} onRetry={startScan}
            availableArtworks={resultData.artworks} selectedArtwork={resultData.selectedArtwork}
            onArtworkSelect={handleArtworkSelect} printWasFound={resultData.printWasFound}
        />
      )}

      {selectedCard && (
          <CardDetailModal
              card={selectedCard}
              onClose={handleCloseModal}
              onUpdateQuantity={handleUpdateQuantity}
              availableArtworks={modalArtworks}
              onUpdateArtwork={(newArtwork) => handleUpdateArtwork(selectedCard, newArtwork)}
              decks={decks}
          />
      )}

      {isLoading && <LoadingOverlay />}

      {(scanError || isManualEntry) && (
        <ScanErrorDialog message={scanError || ''} onRetry={startScan} onManual={handleManualSearch}
          onClose={() => { setScanError(null); setIsManualEntry(false); }}
        />
      )}

      {!isLoading && (view === 'collection' || view === 'decks') && (
        <div className="fixed bottom-0 left-0 w-full flex justify-center p-4 z-20">
           <button
            onClick={startScan}
            className="bg-purple-600 text-white rounded-full p-4 shadow-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-purple-500 transform transition-transform hover:scale-110"
            aria-label="Scan new card"
          >
            <CameraIcon className="h-8 w-8" />
          </button>
        </div>
      )}
    </div>
  );
};

export default App;