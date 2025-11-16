export const RARITIES = [
  'Common',
  'Rare',
  'Super Rare',
  'Ultra Rare',
  'Secret Rare',
  'Ultimate Rare',
  'Ghost Rare',
  'Gold Rare',
  'Prismatic Secret Rare',
  "Collector's Rare",
  'Quarter Century Secret Rare',
  'Starfoil Rare',
  'Mosaic Rare',
  'Shatterfoil Rare',
  'Short Print',
  'Parallel Rare',
  'Other' // Fallback
];

export const CARD_MAIN_TYPES = ['Monster', 'Spell', 'Trap'] as const;

export const MONSTER_ATTRIBUTES = ['DARK', 'DIVINE', 'EARTH', 'FIRE', 'LIGHT', 'WATER', 'WIND'] as const;

export const MONSTER_TYPES = [
    'Aqua', 'Beast', 'Beast-Warrior', 'Creator-God', 'Cyberse', 'Dinosaur', 'Divine-Beast', 
    'Dragon', 'Fairy', 'Fiend', 'Fish', 'Insect', 'Machine', 'Plant', 'Psychic', 'Pyro', 
    'Reptile', 'Rock', 'Sea Serpent', 'Spellcaster', 'Thunder', 'Warrior', 'Winged Beast', 'Wyrm', 'Zombie'
] as const;

export const MONSTER_SUB_TYPES = ['Tuner', 'Gemini', 'Spirit', 'Flip', 'Toon', 'Union'] as const;

export const SPELL_TYPES = ['Normal', 'Field', 'Equip', 'Continuous', 'Quick-Play', 'Ritual'] as const;

export const TRAP_TYPES = ['Normal', 'Continuous', 'Counter'] as const;