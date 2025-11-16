import React from 'react';
import { ArtworkInfo } from '../types';

interface ArtworkSelectorProps {
  artworks: ArtworkInfo[];
  selected: ArtworkInfo;
  onSelect: (artwork: ArtworkInfo) => void;
}

const ArtworkSelector: React.FC<ArtworkSelectorProps> = ({ artworks, selected, onSelect }) => {
  // Only show the selector if there is more than one artwork to choose from.
  if (artworks.length <= 1) {
    return null;
  }
  return (
    <div className="mt-4">
        <p className="text-sm text-purple-300 font-orbitron mb-2">
            Alternate Artworks
        </p>
        <div className="flex gap-2 flex-wrap">
            {artworks.map((art) => (
                <button
                    key={art.id}
                    onClick={() => onSelect(art)}
                    className={`w-16 h-16 rounded-md overflow-hidden border-2 transition-colors ${
                        selected.id === art.id ? 'border-yellow-400' : 'border-transparent hover:border-purple-500'
                    }`}
                    aria-label={`Select artwork ${art.id}`}
                >
                    <img src={art.imageUrl} alt="Alternate artwork" className="w-full h-full object-cover" />
                </button>
            ))}
        </div>
    </div>
  );
};

export default ArtworkSelector;