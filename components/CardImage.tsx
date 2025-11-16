import React from 'react';
import { getRarityClass } from '../utils/rarity-helper';

interface CardImageProps {
  imageUrl: string;
  rarity: string;
  alt: string;
  className?: string;
}

const CardImage: React.FC<CardImageProps> = ({ imageUrl, rarity, alt, className = '' }) => {
  const rarityClass = getRarityClass(rarity);
  // Certain rarities need to style the image directly (e.g., to desaturate it)
  const imageSpecificClass = rarity === 'Ghost Rare' ? 'rarity-ghost-rare-img' : '';

  return (
    <div className={`card-image-wrapper ${rarityClass} ${className}`}>
      <img src={imageUrl} alt={alt} className={`relative z-0 w-full h-full object-cover ${imageSpecificClass}`} />
    </div>
  );
};

export default CardImage;
