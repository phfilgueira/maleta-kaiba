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
import SettingsModal from './components/SettingsModal';
import { CameraIcon, BookOpenIcon, CogIcon } from './components/icons';
//import { identifyCard } from './services/geminiService';
import { searchCard, getArtworksForCard } from './services/ygoProDeckService';
import { RARITIES } from './constants';
import { saveArtworkPreference, getArtworkPreference } from './utils/artworkPreferences';

type IdentifiedCardInfo = Omit<Card, 'id' | 'quantity' | 'imageUrl' | 'dateAdded'>;

interface ResultData {
  card: IdentifiedCardInfo | null;
  artworks: ArtworkInfo[];
  selectedArtwork: ArtworkInfo | null;
  printWasFound: boolean;
  sets: { name: string; code: string; rarity: string; releaseDate?: string | null }[];
}

const rarityOrderMap = RARITIES.reduce((acc, rarity, index) => {
    acc[rarity] = index;
    return acc;
}, {} as Record<string, number>);

type ActiveFilters = { [key: string]: string | number | undefined };

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2);

// Helper function to sanitize and migrate collection data
const processLoadedCollection = (rawCollection: any[]): Card[] => {
    if (!Array.isArray(rawCollection)) return [];
    
    return rawCollection
        .filter(item => item !== null && typeof item === 'object')
        .map((card: any, index: number, arr: any[]) => {
            // MIGRATION LOGIC: Ensure tags exist and clean up old fields
            let tags = card.typeTags || [];
            
            // Legacy Migration: Add missing tags from old race/subType fields if tags are empty
            if (!tags.length) {
                if (card.race) tags.push(card.race);
                if (card.subType) tags.push(card.subType);
            }

            // ENRICHMENT LOGIC: Always run to ensure tags are populated based on type string
            if (card.type && typeof card.type === 'string') {
                const typeStr = card.type;
                if (typeStr.includes('Synchro') && !tags.includes('Synchro')) tags.push('Synchro');
                if (typeStr.includes('Tuner') && !tags.includes('Tuner')) tags.push('Tuner');
                if (typeStr.includes('Fusion') && !tags.includes('Fusion')) tags.push('Fusion');
                if (typeStr.includes('Xyz') && !tags.includes('Xyz')) tags.push('Xyz');
                if (typeStr.includes('Link') && !tags.includes('Link')) tags.push('Link');
                if (typeStr.includes('Ritual') && !tags.includes('Ritual')) tags.push('Ritual');
                if (typeStr.includes('Pendulum') && !tags.includes('Pendulum')) tags.push('Pendulum');
                if (typeStr.includes('Toon') && !tags.includes('Toon')) tags.push('Toon');
                if (typeStr.includes('Spirit') && !tags.includes('Spirit')) tags.push('Spirit');
                if (typeStr.includes('Gemini') && !tags.includes('Gemini')) tags.push('Gemini');
                if (typeStr.includes('Union') && !tags.includes('Union')) tags.push('Union');
                
                // Add Effect tag if implied by subtypes (Gemini, Spirit, Toon, Union are almost always Effect)
                // BUT only if not explicitly Normal
                if (!typeStr.includes('Normal')) {
                        if ((typeStr.includes('Toon') || typeStr.includes('Spirit') || typeStr.includes('Gemini') || typeStr.includes('Union')) && !tags.includes('Effect')) {
                        tags.push('Effect');
                    }
                }
            }

            // CRITICAL FIX FOR NORMAL MONSTERS (e.g., Magicalibra, Blue-Eyes)
            // If the type string explicitly contains "Normal", it MUST have "Normal" tag and be Non-Effect.
            if (card.type && typeof card.type === 'string' && card.type.includes('Normal')) {
                    tags = tags.filter((t: string) => t !== 'Effect'); // FORCE REMOVE EFFECT
                    if (!tags.includes('Non-Effect')) {
                        tags.push('Non-Effect');
                    }
                    // Add Normal tag if missing
                    if (!tags.includes('Normal')) {
                        tags.push('Normal');
                    }
            } 
            // Generic Non-Effect cleanup
            else if (tags.includes('Non-Effect')) {
                    tags = tags.filter((t: string) => t !== 'Effect'); 
            }
            
            // --- FIX DISPLAY TYPE FOR LEGACY DATA ---
            // Reconstruct logic, but also aggressively clean 'Tuner' and 'Effect' from the existing type string
            let displayType = card.type;
            const isGenericMonster = displayType === 'Monster' || displayType === 'Effect Monster' || displayType === 'Normal Monster';
            
            // If generic, try to make it specific from tags
            if (isGenericMonster || (tags.length > 0 && !displayType.includes('Spell') && !displayType.includes('Trap'))) {
                    if (tags.includes('Link')) displayType = 'Link Monster';
                    else if (tags.includes('Pendulum') && tags.includes('Normal')) displayType = 'Pendulum Normal Monster';
                    else if (tags.includes('Pendulum')) displayType = 'Pendulum Monster';
                    else if (tags.includes('Xyz')) displayType = 'XYZ Monster';
                    else if (tags.includes('Synchro')) displayType = 'Synchro Monster';
                    else if (tags.includes('Fusion')) displayType = 'Fusion Monster';
                    else if (tags.includes('Ritual')) displayType = 'Ritual Monster';
                    else if (tags.includes('Toon')) displayType = 'Toon Monster';
                    else if (tags.includes('Gemini')) displayType = 'Gemini Monster';
                    else if (tags.includes('Spirit')) displayType = 'Spirit Monster';
                    else if (tags.includes('Union')) displayType = 'Union Monster';
                    else if (tags.includes('Normal')) displayType = 'Normal Monster';
                    // If just Effect, we might default to Monster later via cleaning
            }

            // AGGRESSIVE CLEANING: Remove 'Tuner' AND 'Effect' from the display string
            // e.g. "Synchro Tuner Effect Monster" -> "Synchro Monster"
            // e.g. "Effect Monster" -> "Monster"
            if (typeof displayType === 'string') {
                displayType = displayType
                    .replace(/Tuner/g, '')
                    .replace(/Effect/g, '')
                    .replace(/\s+/g, ' ')
                    .trim();
            }

            return {
                ...card,
                type: displayType, // Updated detailed type
                typeTags: tags,
                // Ensure optional fields are null, not undefined
                dateAdded: card.dateAdded || Date.now() - (arr.length - index) * 1000,
                name_pt: card.name_pt || null,
                description_pt: card.description_pt || null,
                collectionName: card.collectionName || null,
                releaseDate: card.releaseDate || null,
            } as Card;
        });
};

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
        const parsed = JSON.parse(savedCollection);
        return processLoadedCollection(parsed);
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
    sets: []
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
  const [showSettings, setShowSettings] = useState(false);


  useEffect(() => {
    try {
        localStorage.setItem('yugioh-collection', JSON.stringify(collection));
    } catch (e) {
        console.error("Storage Quota Exceeded or Error Saving Collection:", e);
        // Only alert if the collection is substantial to avoid annoyance
        if (collection.length > 10) {
            alert("Warning: Failed to save collection to local storage. You may be out of space.");
        }
    }
  }, [collection]);
  
  useEffect(() => {
    try {
        localStorage.setItem('yugioh-decks', JSON.stringify(decks));
    } catch (e) {
        console.error("Storage Error Saving Decks:", e);
    }
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

  const processAndSetCardResult = useCallback(async (searchPromise: Promise<{card: IdentifiedCardInfo, artworks: ArtworkInfo[], printWasFound: boolean, sets: any[]}>) => {
    try {
        const { card, artworks, printWasFound, sets } = await searchPromise;
        
        if (artworks.length === 0) {
            throw new Error(`Could not find official artwork for "${card.name}". The card data might be incorrect.`);
        }
        
        const defaultArtwork = determineDefaultArtwork(artworks, card.collectionCode);
        
        setResultData({
            card,
            artworks,
            selectedArtwork: defaultArtwork,
            printWasFound,
            sets
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

  const addCardToCollection = (details: { rarity: string; quantity: number; collectionCode: string, collectionName?: string, releaseDate?: string | null }) => {
    if (!resultData.card || !resultData.selectedArtwork) return;
    saveArtworkPreference(details.collectionCode, resultData.selectedArtwork.id);
    const newCardId = `${details.collectionCode}-${details.rarity}-${resultData.selectedArtwork.id}`;

    // Get collection name if passed from CardResult, otherwise try to find it in sets
    let collName = details.collectionName;
    let relDate = details.releaseDate;

    if ((!collName || !relDate) && resultData.sets) {
       const matchingSet = resultData.sets.find(s => s.code === details.collectionCode);
       if (matchingSet) {
           if (!collName) collName = matchingSet.name;
           if (!relDate) relDate = matchingSet.releaseDate;
       }
    }

    setCollection(prev => {
        const existingCardIndex = prev.findIndex(c => c.id === newCardId);

        if (existingCardIndex > -1) {
            const updatedCollection = [...prev];
            const existingCard = updatedCollection[existingCardIndex];
            existingCard.quantity += details.quantity;
            if (collName && !existingCard.collectionName) existingCard.collectionName = collName;
            if (relDate && !existingCard.releaseDate) existingCard.releaseDate = relDate;
            return updatedCollection;
        } else {
            const newCard: Card = {
              ...resultData.card!,
              id: newCardId,
              collectionCode: details.collectionCode,
              collectionName: collName || null,
              releaseDate: relDate || null,
              rarity: details.rarity,
              quantity: details.quantity,
              imageUrl: resultData.selectedArtwork!.imageUrl,
              dateAdded: Date.now(),
            };
            return [...prev, newCard];
        }
    });
    resetScan();
  };

  const resetScan = () => {
    setView('collection');
    setResultData({ card: null, artworks: [], selectedArtwork: null, printWasFound: true, sets: [] });
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

  // --- Data Management Handlers ---
  const handleExportData = () => {
    const data = {
        collection: JSON.parse(localStorage.getItem('yugioh-collection') || '[]'),
        decks: JSON.parse(localStorage.getItem('yugioh-decks') || '[]'),
        artworkPrefs: JSON.parse(localStorage.getItem('yugioh-artwork-prefs') || '{}'),
        timestamp: new Date().toISOString(),
        version: 1
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `yugioh-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportData = (file: File) => {
    const reader = new FileReader();
    
    reader.onerror = () => {
        alert("Error reading file. Please try again.");
    };

    reader.onload = (e) => {
        const content = e.target?.result as string;
        try {
            const data = JSON.parse(content);
            
            let collectionData: any[] = [];
            let decksData: any[] = [];
            let artworkPrefsData: any = {};

            // Handle different data structures for robustness
            if (Array.isArray(data)) {
                // Assuming it's just a raw collection array
                collectionData = data;
            } else if (data && typeof data === 'object') {
                if (Array.isArray(data.collection)) {
                    collectionData = data.collection;
                    decksData = Array.isArray(data.decks) ? data.decks : [];
                    artworkPrefsData = data.artworkPrefs || {};
                } else if (data.cards && Array.isArray(data.cards)) {
                    // Handle potential alternative naming
                    collectionData = data.cards;
                } else {
                     throw new Error("Invalid file format: Could not find collection data.");
                }
            } else {
                 throw new Error("Invalid file format: File is not a valid JSON object or array.");
            }

            // Process Data
            const sanitizedCollection = processLoadedCollection(collectionData);
            
            // Validate Decks logic to ensure they don't crash the app
            const sanitizedDecks = decksData.map((d: any) => ({
                ...d,
                mainDeck: Array.isArray(d.mainDeck) ? d.mainDeck : [],
                extraDeck: Array.isArray(d.extraDeck) ? d.extraDeck : [],
                sideDeck: Array.isArray(d.sideDeck) ? d.sideDeck : [],
            })).filter((d: any) => d.id && d.name);

            // Update State
            setCollection(sanitizedCollection);
            setDecks(sanitizedDecks);

            // Update Artwork Prefs
            if (artworkPrefsData && Object.keys(artworkPrefsData).length > 0) {
                try {
                    localStorage.setItem('yugioh-artwork-prefs', JSON.stringify(artworkPrefsData));
                } catch(e) { console.error("Pref save fail", e); }
            }
            
            const totalCards = sanitizedCollection.reduce((acc: number, c: any) => acc + (c.quantity || 1), 0);
            
            alert(`Restore Successful!\n\n• ${sanitizedCollection.length} Unique Cards\n• ${totalCards} Total Copies\n• ${sanitizedDecks.length} Decks`);
            setShowSettings(false);
            
        } catch (err) {
            console.error(err);
            const msg = err instanceof Error ? err.message : "Unknown error";
            alert(`Failed to import data: ${msg}`);
        }
    };
    reader.readAsText(file);
  };


  const filteredCollection = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return collection.filter(card => {
        const matchesQuery = query === '' || card.name.toLowerCase().includes(query) || (card.name_pt && card.name_pt.toLowerCase().includes(query)) || card.description.toLowerCase().includes(query) || (card.description_pt && card.description_pt.toLowerCase().includes(query));
        if (!matchesQuery) return false;
        
        for (const key in activeFilters) {
            const filterValue = activeFilters[key]; if (!filterValue) continue;
            switch(key) {
                case 'mainType': 
                    // Use includes check so "Synchro Monster" matches "Monster"
                    if (!card.type.includes(filterValue as string)) return false; 
                    break;
                case 'attribute': 
                    if (card.attribute !== filterValue) return false; 
                    break;
                case 'race': 
                    // 'race' filter now checks typeTags
                    if (!card.typeTags.includes(filterValue as string)) return false; 
                    break;
                case 'subType': 
                    // 'subType' filter now checks typeTags
                    if (!card.typeTags.includes(filterValue as string)) return false; 
                    break;
                case 'level': 
                    if (card.level !== parseInt(filterValue as string, 10)) return false; 
                    break;
                case 'spellType': 
                case 'trapType':
                    // Spell/Trap specific types are now also in Tags (e.g. Continuous, Field)
                    if (!card.typeTags.includes(filterValue as string)) return false; 
                    break;
                case 'rarity': 
                    if (card.rarity !== filterValue) return false; 
                    break;
                case 'releaseDate':
                    // If card has no date, it doesn't match a date filter (safest assumption)
                    if (!card.releaseDate) return false;
                    // String comparison works for ISO dates (YYYY-MM-DD): "2000-01-01" < "2024-01-01"
                    if (card.releaseDate > (filterValue as string)) return false;
                    break;
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
        <div className="container mx-auto px-4 py-3 flex justify-between items-center relative">
          <div className="w-full">
              <h1 className="text-2xl font-bold text-center text-purple-300 font-orbitron tracking-wider">
                Yu-Gi-Oh! Card Collector
              </h1>
              <p className="text-center text-gray-400 text-sm mt-1 font-orbitron">
                    Total: <span className="text-purple-300 font-bold">{totalCardCount}</span> | Unique: <span className="text-purple-300 font-bold">{uniqueCardNameCount}</span> | Prints: <span className="text-purple-300 font-bold">{collection.length}</span>
                </p>
          </div>
          
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-3">
             <button
                onClick={() => setShowSettings(true)}
                className="text-gray-400 hover:text-white transition-colors p-2"
                aria-label="Settings"
             >
                <CogIcon className="w-6 h-6" />
             </button>
          </div>

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
              <div className="px-4 pt-4 pb-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <ViewModeControl value={gridColumns} onChange={setGridColumns} />
                <div className="w-full sm:w-auto">
                  <SortControl value={sortOrder} onChange={setSortOrder} />
                </div>
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
            key={resultData.card.cardCode} 
            card={resultData.card} 
            onAdd={addCardToCollection} 
            onRetry={startScan}
            availableArtworks={resultData.artworks} 
            selectedArtwork={resultData.selectedArtwork}
            onArtworkSelect={handleArtworkSelect} 
            printWasFound={resultData.printWasFound}
            validSets={resultData.sets}
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
      
      {showSettings && (
        <SettingsModal 
            onClose={() => setShowSettings(false)}
            onExport={handleExportData}
            onImport={handleImportData}
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