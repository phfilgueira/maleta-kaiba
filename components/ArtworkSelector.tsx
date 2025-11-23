import React from 'react';
import { ArtworkInfo } from '../types';
import { CheckCircleIcon } from './icons';

interface ArtworkSelectorProps {
  artworks: ArtworkInfo[];
  selected: ArtworkInfo;
  onSelect: (artwork: ArtworkInfo) => void;
}

const ArtworkSelector: React.FC<ArtworkSelectorProps> = ({ artworks, selected, onSelect }) => {
  // Only render if there are multiple artworks to choose from.
  if (!artworks || artworks.length <= 1) {
    return null;
  }

  return (
    <div className="mt-4 w-full bg-gray-900/40 p-3 rounded-xl border border-gray-700/50 backdrop-blur-sm shadow-inner">
        <div className="flex justify-between items-center mb-3 px-1">
            <p className="text-xs text-purple-300 font-orbitron tracking-wider flex items-center gap-2 uppercase font-bold">
                Select Artwork Version
            </p>
            <span className="text-[10px] text-gray-900 font-bold font-mono bg-purple-400 px-2 py-0.5 rounded-full shadow-sm">
                {artworks.length} VARIANTS
            </span>
        </div>
        
        <div className="flex gap-3 overflow-x-auto pb-2 w-full px-1 custom-scrollbar snap-x scroll-smooth">
            {artworks.map((art) => {
                const isSelected = selected.id === art.id;
                return (
                    <button
                        key={art.id}
                        type="button"
                        onClick={() => onSelect(art)}
                        className={`flex-shrink-0 relative w-16 h-24 rounded-lg transition-all duration-200 group snap-center overflow-hidden border-2 ${
                            isSelected 
                                ? 'border-yellow-400 scale-105 z-10 shadow-lg shadow-yellow-900/50' 
                                : 'border-gray-700 opacity-70 hover:opacity-100 hover:border-gray-500'
                        }`}
                        aria-label={`Select artwork ID ${art.id}`}
                        aria-pressed={isSelected}
                    >
                        <img 
                            src={art.smallImageUrl || art.imageUrl} 
                            alt=""
                            className="w-full h-full object-cover" 
                            loading="lazy"
                        />
                        {isSelected && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[1px]">
                                <div className="bg-gray-900 rounded-full text-yellow-400 shadow-md p-0.5">
                                    <CheckCircleIcon className="w-5 h-5" />
                                </div>
                            </div>
                        )}
                    </button>
                );
            })}
        </div>
    </div>
  );
};

export default ArtworkSelector;