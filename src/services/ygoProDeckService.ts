import { ArtworkInfo, Card } from '../types';

const API_BASE_URL = 'https://db.ygoprodeck.com/api/v7/cardinfo.php';

// --- API Response Interfaces ---
interface YgoProDeckCardImage {
    id: number;
    image_url: string;
}

interface YgoProDeckCardSet {
  set_name: string;
  set_code: string;
  set_rarity: string;
  set_rarity_code: string;
  set_price: string;
}

interface YgoProDeckCard {
  id: number;
  name: string;
  type: string;
  desc: string;
  atk?: number;
  def?: number;
  level?: number;
  race?: string;
  attribute?: string;
  card_images: YgoProDeckCardImage[];
  card_sets?: YgoProDeckCardSet[];
}

interface ApiResponse {
    data?: YgoProDeckCard[];
    error?: string;
}

// --- Data Mapping and Parsing ---

/**
 * Parses the combined 'type' string from the API (e.g., "Tuner Effect Monster")
 * into a main type ("Effect Monster") and a subtype ("Tuner").
 */
function parseCardType(type: string): { mainType: string; subType: string | null } {
    const subtypes = ['Tuner', 'Gemini', 'Spirit', 'Flip', 'Toon', 'Union'];
    let mainType = type;
    let foundSubType: string | null = null;

    for (const sub of subtypes) {
        if (mainType.includes(sub)) {
            foundSubType = sub;
            // Remove the subtype keyword and clean up whitespace
            mainType = mainType.replace(sub, '').replace('  ', ' ').trim();
            break; // Assume only one of these subtypes for simplicity
        }
    }
    return { mainType, subType: foundSubType };
}

/**
 * Maps the raw API response for a card to the application's Card data structure.
 * @param apiCard The card data from the YGOPRODeck API.
 * @param print The specific print information for the card.
 * @returns An object matching the structure needed for the CardResult view.
 */
function mapApiToCard(apiCard: YgoProDeckCard, print: YgoProDeckCardSet, apiCard_pt?: YgoProDeckCard): Omit<Card, 'id' | 'quantity' | 'dateAdded' | 'imageUrl'> {
    const { mainType, subType } = parseCardType(apiCard.type);

    return {
        name: apiCard.name,
        name_pt: apiCard_pt?.name || null,
        type: mainType,
        race: apiCard.race?.split('/')[0].trim() || null, // Handles cases like "Warrior / Link"
        subType: subType,
        attribute: apiCard.attribute || null,
        level: apiCard.level || null,
        atk: apiCard.atk ?? null,
        def: apiCard.def ?? null,
        description: apiCard.desc,
        description_pt: apiCard_pt?.desc || null,
        cardCode: String(apiCard.id).padStart(8, '0'),
        collectionCode: print.set_code,
        rarity: print.set_rarity,
    };
}


/**
 * Fetches card data from the YGOPRODeck API using a two-step process to ensure all artworks are found.
 * @param query An object containing the card's details. The search is performed using `cardCode`.
 * @returns A promise that resolves to the structured card data, all available artworks, and a flag indicating if the specific print was found.
 */
export async function searchCard(
  query: { cardCode: string; collectionCode?: string }
): Promise<{ 
    card: Omit<Card, 'id' | 'quantity' | 'dateAdded' | 'imageUrl'>; 
    artworks: ArtworkInfo[];
    printWasFound: boolean;
}> {
    const { cardCode, collectionCode: scannedCollectionCode } = query;

    if (!cardCode || cardCode.trim() === '' || !/^\d+$/.test(cardCode.trim())) {
        throw new Error(`The scanned card code "${cardCode}" is not a valid number. The AI may have misread it. Please try scanning again.`);
    }
    
    // Step 1: Fetch the primary card data using the scanned code. Using 'id' as it appears more reliable.
    const initialUrl = `${API_BASE_URL}?id=${encodeURIComponent(cardCode.trim())}`;
    const initialResponse = await fetch(initialUrl);

    if (!initialResponse.ok) {
        if (initialResponse.status === 400) {
            try {
                const errorResponse: ApiResponse = await initialResponse.json();
                if (errorResponse.error) {
                    throw new Error(errorResponse.error); 
                }
            } catch (e) {
                 if (e instanceof Error && e.message.includes("No card matching")) {
                    throw e;
                }
            }
        }
        throw new Error(`The card database could not be reached. Status: ${initialResponse.status}`);
    }

    const initialApiResponse: ApiResponse = await initialResponse.json();

    if (initialApiResponse.error || !initialApiResponse.data || initialApiResponse.data.length === 0) {
        throw new Error(`Could not find any card matching the code "${cardCode}". Please check the code and try again.`);
    }

    const primaryApiCard = initialApiResponse.data[0];
    const cardName = primaryApiCard.name;

    // Fetch Portuguese data with a fallback to searching by name
    let ptApiCard: YgoProDeckCard | undefined;
    try {
        // First, try by ID, as it's more specific
        let ptUrl = `${API_BASE_URL}?id=${encodeURIComponent(cardCode.trim())}&language=pt`;
        let ptResponse = await fetch(ptUrl);
        if (ptResponse.ok) {
            const ptApiResponse: ApiResponse = await ptResponse.json();
            if (ptApiResponse.data && ptApiResponse.data.length > 0) {
                ptApiCard = ptApiResponse.data[0];
            }
        }

        // If not found by ID, try by name as a fallback.
        if (!ptApiCard) {
            console.warn(`Portuguese data not found for ID ${cardCode}. Falling back to search by name: "${cardName}".`);
            ptUrl = `${API_BASE_URL}?name=${encodeURIComponent(cardName)}&language=pt`;
            ptResponse = await fetch(ptUrl);
            if (ptResponse.ok) {
                const ptApiResponse: ApiResponse = await ptResponse.json();
                if (ptApiResponse.data && ptApiResponse.data.length > 0) {
                   // Find the card that matches our original ID to be precise
                   const matchingPtCard = ptApiResponse.data.find(c => String(c.id) === cardCode.trim());
                   ptApiCard = matchingPtCard || ptApiResponse.data[0];
                }
            }
        }
    } catch (e) {
        console.warn("Could not fetch Portuguese card data.", e);
    }


    // Step 2: Fetch all cards with the same name to gather all unique artworks.
    const allArtworksMap = new Map<number, ArtworkInfo>();
    
    // Add artworks from the primary card first to maintain a sensible order
    primaryApiCard.card_images.forEach(img => {
        if (!allArtworksMap.has(img.id)) {
            allArtworksMap.set(img.id, { id: img.id, imageUrl: img.image_url });
        }
    });

    try {
        const nameUrl = `${API_BASE_URL}?name=${encodeURIComponent(cardName)}`;
        const nameResponse = await fetch(nameUrl);
        if (nameResponse.ok) {
            const nameApiResponse: ApiResponse = await nameResponse.json();
            if (nameApiResponse.data) {
                const matchingCards = nameApiResponse.data.filter(c => c.name === cardName);
                matchingCards.forEach(cardVariant => {
                    cardVariant.card_images.forEach(img => {
                        if (!allArtworksMap.has(img.id)) {
                            allArtworksMap.set(img.id, { id: img.id, imageUrl: img.image_url });
                        }
                    });
                });
            }
        }
    } catch (e) {
        console.warn("Could not fetch additional artworks by name, proceeding with primary artworks.", e);
    }
    
    const artworks = Array.from(allArtworksMap.values());

    // Step 3: Determine the card's specific print info using the initial card data.
    let print: YgoProDeckCardSet | undefined;
    let printWasFound: boolean;

    if (scannedCollectionCode) {
        print = primaryApiCard.card_sets?.find(p => p.set_code.toUpperCase() === scannedCollectionCode.toUpperCase());
    }
    
    printWasFound = !!print;

    if (!print) {
        print = primaryApiCard.card_sets?.[0];
    }

    if (!print) {
        print = {
            set_code: scannedCollectionCode || 'N/A',
            set_rarity: 'Common',
            set_name: 'Unknown Set',
            set_rarity_code: '(C)',
            set_price: '0',
        };
        printWasFound = false;
    }
    
    const cardResult = mapApiToCard(primaryApiCard, print, ptApiCard);

    if (!printWasFound && scannedCollectionCode) {
        cardResult.collectionCode = scannedCollectionCode;
    }

    return { card: cardResult, artworks, printWasFound };
}

/**
 * Fetches all available artworks for a card from the YGOPRODeck API using its card code.
 * @param cardCode The 8-digit code of the card.
 * @returns A promise that resolves to an array of ArtworkInfo objects.
 */
export async function getArtworksForCard(cardCode: string): Promise<ArtworkInfo[]> {
    if (!cardCode || !/^\d+$/.test(cardCode.trim())) {
        console.warn("getArtworksForCard received an invalid card code:", cardCode);
        return [];
    }

    // Step 1: Fetch primary card data to get the card name.
    const initialUrl = `${API_BASE_URL}?id=${encodeURIComponent(cardCode.trim())}`;
    const initialResponse = await fetch(initialUrl);

    if (!initialResponse.ok) {
        throw new Error(`The card database could not be reached while fetching artworks. Status: ${initialResponse.status}`);
    }
    const initialApiResponse: ApiResponse = await initialResponse.json();

    if (initialApiResponse.error || !initialApiResponse.data || initialApiResponse.data.length === 0) {
        return [];
    }
    
    const primaryApiCard = initialApiResponse.data[0];
    const cardName = primaryApiCard.name;
    const allArtworksMap = new Map<number, ArtworkInfo>();

    primaryApiCard.card_images.forEach(img => {
        if (!allArtworksMap.has(img.id)) {
            allArtworksMap.set(img.id, { id: img.id, imageUrl: img.image_url });
        }
    });

    // Step 2: Fetch by name to get all artworks from all card versions.
    try {
        const nameUrl = `${API_BASE_URL}?name=${encodeURIComponent(cardName)}`;
        const nameResponse = await fetch(nameUrl);
        if (nameResponse.ok) {
            const nameApiResponse: ApiResponse = await nameResponse.json();
            if (nameApiResponse.data) {
                const matchingCards = nameApiResponse.data.filter(c => c.name === cardName);
                matchingCards.forEach(cardVariant => {
                    cardVariant.card_images.forEach(img => {
                        if (!allArtworksMap.has(img.id)) {
                            allArtworksMap.set(img.id, { id: img.id, imageUrl: img.image_url });
                        }
                    });
                });
            }
        }
    } catch (e) {
        console.warn("Could not fetch additional artworks by name.", e);
    }

    return Array.from(allArtworksMap.values());
}