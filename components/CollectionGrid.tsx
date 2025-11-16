import React from 'react';
import { Card } from '../types';
import CardImage from './CardImage';

interface CollectionGridProps {
  cards: Card[];
  onCardClick: (card: Card) => void;
  totalCollectionSize: number;
  gridColumns: number;
  mode?: 'view' | 'deck-building';
  onAddToDeck?: (card: Card) => void;
  cardUsageMap?: { [cardId: string]: number };
}

const CardItem: React.FC<{
    card: Card;
    onClick: () => void;
    isDeckBuilding: boolean;
    availableQty: number;
}> = ({ card, onClick, isDeckBuilding, availableQty }) => {
    const isAvailable = !isDeckBuilding || availableQty > 0;

    return (
        <button
            onClick={isAvailable ? onClick : undefined}
            className={`group relative aspect-[7/10] overflow-hidden rounded-lg shadow-lg transform transition-transform duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500 ring-offset-2 ring-offset-gray-900 text-left ${
                isAvailable ? 'hover:scale-105 hover:shadow-purple-500/50' : 'cursor-not-allowed'
            }`}
            aria-label={`View details for ${card.name}`}
            disabled={!isAvailable}
        >
            <CardImage
                imageUrl={card.imageUrl}
                rarity={card.rarity}
                alt={card.name}
            />
            {!isAvailable && <div className="absolute inset-0 bg-black/70 backdrop-grayscale-[0.8]"></div>}

            <div className={`absolute top-1 right-1 bg-purple-700 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-purple-300 z-10 ${!isAvailable ? 'opacity-50' : ''}`}>
                x{card.quantity}
            </div>

            {isDeckBuilding && (
                 <div className={`absolute top-1 left-1 text-white text-xs font-bold rounded-full px-2 py-1 flex items-center justify-center border-2 z-10 ${isAvailable ? 'bg-blue-600 border-blue-300' : 'bg-gray-600 border-gray-400 opacity-80'}`}>
                    Avail: {availableQty}
                </div>
            )}

            <div className={`absolute bottom-0 left-0 w-full p-2 bg-gradient-to-t from-black via-black/80 to-transparent z-10 ${!isAvailable ? 'opacity-50' : ''}`}>
                <h3 className="text-white text-sm font-bold truncate group-hover:whitespace-normal">{card.name}</h3>
                <p className="text-purple-300 text-xs truncate">{card.rarity}</p>
                <p className="text-gray-400 text-xs truncate">{card.collectionCode}</p>
            </div>
        </button>
    );
};


const CollectionGrid: React.FC<CollectionGridProps> = ({ cards, onCardClick, totalCollectionSize, gridColumns, mode = 'view', onAddToDeck, cardUsageMap }) => {
  if (cards.length === 0) {
    if (totalCollectionSize === 0) {
      return (
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold text-gray-400">Your collection is empty.</h2>
          <p className="text-gray-500 mt-2">Tap the camera button to start scanning your cards!</p>
        </div>
      );
    }
    return (
       <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-gray-400">No Cards Found</h2>
        <p className="text-gray-500 mt-2">No cards in your collection match the current search or filters.</p>
      </div>
    );
  }

  const columnClasses: { [key: number]: string } = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
  };
  const gridClass = columnClasses[gridColumns] || 'grid-cols-2';

  const isDeckBuilding = mode === 'deck-building';

  return (
    <div className={`grid ${gridClass} gap-4 p-4`}>
      {cards.map(card => {
        const usage = cardUsageMap?.[card.id] || 0;
        const availableQty = card.quantity - usage;

        return (
          <CardItem
            key={card.id}
            card={card}
            onClick={() => isDeckBuilding ? onAddToDeck?.(card) : onCardClick(card)}
            isDeckBuilding={isDeckBuilding}
            availableQty={availableQty}
          />
        );
      })}
    </div>
  );
};

export default CollectionGrid;
