export const saveArtworkPreference = (collectionCode: string, artworkId: number) => {
  try {
    const prefs = JSON.parse(localStorage.getItem('yugioh-artwork-prefs') || '{}');
    prefs[collectionCode] = artworkId;
    localStorage.setItem('yugioh-artwork-prefs', JSON.stringify(prefs));
  } catch (e) {
    console.error("Failed to save artwork pref", e);
  }
};

export const getArtworkPreference = (collectionCode: string): number | null => {
  try {
    const prefs = JSON.parse(localStorage.getItem('yugioh-artwork-prefs') || '{}');
    return prefs[collectionCode] || null;
  } catch (e) {
    return null;
  }
};