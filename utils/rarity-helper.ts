/**
 * Converts a card rarity string into a CSS-friendly class name.
 * Example: "Ultra Rare" becomes "rarity-ultra-rare".
 * @param rarity The rarity string from the card data.
 * @returns A formatted string for use as a CSS class.
 */
export const getRarityClass = (rarity: string): string => {
  if (!rarity) return '';
  return `rarity-${rarity
    .toLowerCase()
    .replace(/ /g, '-')
    .replace(/'/g, '')
    .replace(/\./g, '')}`;
};
