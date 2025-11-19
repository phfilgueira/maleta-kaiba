export const getRarityClass = (rarity: string): string => {
  const normalized = rarity.toLowerCase().replace(/[\s']/g, '-');
  return `rarity-${normalized}`;
};