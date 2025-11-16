const PREFERENCES_KEY = 'yugioh-artwork-prefs';

type ArtworkPreferences = {
  [collectionCode: string]: number; // e.g., { "LOB-001": 46986414 }
};

/**
 * Retrieves the stored artwork preferences from localStorage.
 * @returns An object containing the artwork preferences.
 */
const getPreferences = (): ArtworkPreferences => {
  try {
    const prefs = localStorage.getItem(PREFERENCES_KEY);
    return prefs ? JSON.parse(prefs) : {};
  } catch (error) {
    console.error("Failed to parse artwork preferences from localStorage", error);
    return {};
  }
};

/**
 * Saves a user's artwork choice for a specific collection code.
 * @param collectionCode The unique code for the card's print (e.g., "SDK-001").
 * @param artworkId The ID of the selected artwork image.
 */
export const saveArtworkPreference = (collectionCode: string, artworkId: number): void => {
  if (!collectionCode) return;
  const prefs = getPreferences();
  prefs[collectionCode] = artworkId;
  localStorage.setItem(PREFERENCES_KEY, JSON.stringify(prefs));
};

/**
 * Retrieves the user's preferred artwork ID for a given collection code.
 * @param collectionCode The unique code for the card's print.
 * @returns The preferred artwork ID, or null if no preference is saved.
 */
export const getArtworkPreference = (collectionCode: string): number | null => {
  if (!collectionCode) return null;
  const prefs = getPreferences();
  return prefs[collectionCode] || null;
};
