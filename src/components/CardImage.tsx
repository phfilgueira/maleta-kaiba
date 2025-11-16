import React from 'react';

interface CardImageProps {
  imageUrl: string;
  rarity: string;
  alt: string;
  className?: string;
}

const CardImage: React.FC<CardImageProps> = ({ imageUrl, alt, className = '' }) => {
  // Os efeitos de raridade foram removidos. O div wrapper é mantido para aplicar classes de layout.
  return (
    <div className={className}>
      <img src={imageUrl} alt={alt} className="w-full h-full object-cover" />
    </div>
  );
};

export default CardImage;
