import { Card, ArtworkInfo } from '../types';

const API_BASE_URL = 'https://db.ygoprodeck.com/api/v7/cardinfo.php';
const SETS_API_URL = 'https://db.ygoprodeck.com/api/v7/cardsets.php';

interface ApiCardData {
  id: number;
  name: string;
  type: string;
  frameType: string;
  desc: string;
  race: string;
  atk?: number;
  def?: number;
  level?: number;
  attribute?: string;
  typeline?: string[]; // Use typeline for accurate Effect detection
  card_images: { id: number; image_url: string; image_url_small: string }[];
  card_sets?: { set_name: string; set_code: string; set_rarity: string }[];
}

// Cache simples para as datas dos sets
let globalSetDatesCache: Record<string, string> | null = null;

const fetchGlobalSetDates = async (): Promise<Record<string, string>> => {
    if (globalSetDatesCache) return globalSetDatesCache;
    
    try {
        const response = await fetch(SETS_API_URL);
        const json = await response.json();
        const cache: Record<string, string> = {};
        
        if (Array.isArray(json)) {
            json.forEach((set: any) => {
                // Mapeia Nome do Set -> Data de Lançamento (tcg_date)
                if (set.set_name && set.tcg_date) {
                    cache[set.set_name] = set.tcg_date;
                }
            });
        }
        globalSetDatesCache = cache;
        return cache;
    } catch (e) {
        console.error("Failed to fetch global set dates", e);
        return {};
    }
};

export const searchCard = async ({ cardCode, collectionCode }: { cardCode: string, collectionCode: string }) => {
  // 1. Construir parâmetro de busca inicial (preferência por ID)
  let queryParams = '';
  
  if (cardCode && /^\d+$/.test(cardCode)) {
    queryParams = `id=${cardCode}`;
  } else if (cardCode && cardCode.length > 0) {
    // Se não for número, tentamos busca exata pelo nome
    queryParams = `name=${encodeURIComponent(cardCode)}`;
  } else {
    throw new Error("Card code or name required for lookup");
  }

  try {
    // Carregar datas dos sets em paralelo ou lazy load
    const setDatesPromise = fetchGlobalSetDates();

    // 2. Buscar dados em INGLÊS (Padrão e mais completo)
    const enResponse = await fetch(`${API_BASE_URL}?${queryParams}`);
    const enJson = await enResponse.json();

    if (enJson.error) {
      // Se falhar busca exata por nome, tenta busca "fuzzy" (parcial)
      if (!queryParams.includes('id=')) {
         const fuzzyUrl = `${API_BASE_URL}?fname=${encodeURIComponent(cardCode)}`;
         const fuzzyResponse = await fetch(fuzzyUrl);
         const fuzzyJson = await fuzzyResponse.json();
         if (fuzzyJson.error) throw new Error("Card not found.");
         enJson.data = fuzzyJson.data;
      } else {
         throw new Error(enJson.error);
      }
    }

    // A API retorna um array. Pegamos o primeiro resultado que geralmente é a carta correta.
    let enCard: ApiCardData = enJson.data[0];
    
    // --- LÓGICA DE CORREÇÃO DE ARTWORKS E SETS ---
    // A busca por ID às vezes retorna uma lista limitada de imagens ou sets.
    // A busca por NOME retorna o objeto "mestre" que contém TODAS as artes e TODOS os prints.
    // Vamos SEMPRE tentar pegar a lista mestre pelo nome para garantir que temos todas as opções.
    if (enCard.name) {
        try {
            const masterUrl = `${API_BASE_URL}?name=${encodeURIComponent(enCard.name)}`;
            const masterResponse = await fetch(masterUrl);
            const masterJson = await masterResponse.json();
            
            if (!masterJson.error && masterJson.data && masterJson.data.length > 0) {
                const masterEntry = masterJson.data[0];
                
                // CRUCIAL: Substituímos incondicionalmente a lista de imagens e sets pela versão "Master" (Por Nome).
                if (masterEntry.card_images && masterEntry.card_images.length > 0) {
                    enCard.card_images = masterEntry.card_images;
                }
                
                // Mesmo para os sets, a lista por nome costuma ser mais completa historicamente
                if (masterEntry.card_sets && masterEntry.card_sets.length > 0) {
                    enCard.card_sets = masterEntry.card_sets;
                }
                
                // Use master typeline if available
                if (masterEntry.typeline) {
                    enCard.typeline = masterEntry.typeline;
                }

                // Use master frameType if available (often more accurate)
                if (masterEntry.frameType) {
                    enCard.frameType = masterEntry.frameType;
                }
            }
        } catch (ignored) {
            console.warn("Failed to fetch master data, sticking with ID-based results", ignored);
        }
    }

    // 3. Buscar dados em PORTUGUÊS usando o ID que acabamos de confirmar
    let ptCard: ApiCardData | null = null;
    try {
        // Tentativa 1: Busca direta pelo ID
        const ptResponse = await fetch(`${API_BASE_URL}?id=${enCard.id}&language=pt`);
        const ptJson = await ptResponse.json();
        if (!ptJson.error && ptJson.data && ptJson.data.length > 0) {
            ptCard = ptJson.data[0];
        } else {
            // Tentativa 2 (Fallback): Busca pelo nome se o ID falhar (comum em cartas novas/promos)
            const ptNameResponse = await fetch(`${API_BASE_URL}?name=${encodeURIComponent(enCard.name)}&language=pt`);
            const ptNameJson = await ptNameResponse.json();
            if (!ptNameJson.error && ptNameJson.data && ptNameJson.data.length > 0) {
                ptCard = ptNameJson.data[0];
            }
        }
    } catch (ptError) {
        console.warn("Portuguese translation not available for this card", ptError);
    }

    // Aguardar o carregamento das datas dos sets
    const setDates = await setDatesPromise;

    // 4. Processar Raridade e Set
    let foundSet = null;
    let printWasFound = false;

    if (collectionCode && enCard.card_sets) {
      const cleanCollectionCode = collectionCode.replace(/[^a-zA-Z0-9-]/g, '').toUpperCase();
      foundSet = enCard.card_sets.find(set => {
         const dbSetClean = set.set_code.replace(/[^a-zA-Z0-9-]/g, '').toUpperCase();
         if (dbSetClean === cleanCollectionCode) return true;
         
         const dbParts = dbSetClean.split('-');
         const userParts = cleanCollectionCode.split('-');
         if (dbParts.length >= 2 && userParts.length >= 2) {
             return dbParts[0] === userParts[0] && dbParts[1].replace(/\D/g,'') === userParts[1].replace(/\D/g,'');
         }
         return false;
      });
      
      if (foundSet) printWasFound = true;
    }

    const rarity = foundSet ? foundSet.set_rarity : 'Common';

    // 5. Process Types and Tags
    
    // Build Tags Array (e.g., [Dragon, Synchro, Tuner, Effect])
    const typeTags: string[] = [];

    // Add 'Race' (e.g., Dragon, Warrior, Continuous, Field)
    if (enCard.race && !typeTags.includes(enCard.race)) {
        typeTags.push(enCard.race);
    }

    // Add info from 'Type' string
    const subTypes = [
        'Synchro', 'Tuner', 'Fusion', 'Ritual', 'Xyz', 'Link', 
        'Pendulum', 'Gemini', 'Spirit', 'Toon', 'Union', 'Flip', 'Normal'
    ];
    
    subTypes.forEach(subtype => {
        if (enCard.type.includes(subtype) && !typeTags.includes(subtype)) {
            typeTags.push(subtype);
        }
    });

    // --- EFFECT vs NON-EFFECT LOGIC ---
    // We use frameType as the authoritative source for Normal/Effect status when possible
    if (enCard.type.includes('Monster')) {
        let isEffect = false;
        let isNonEffect = false;
        
        // FRAME TYPE CHECK (Authoritative)
        // normal, normal_pendulum -> Non-Effect
        // effect, effect_pendulum, fusion, synchro, etc -> Effect (usually)
        
        // PRIORIDADE ABSOLUTA: Se a API diz que a moldura é normal ou o tipo é Normal, É NORMAL.
        if (enCard.frameType === 'normal' || enCard.frameType === 'normal_pendulum' || enCard.type.includes('Normal')) {
            isNonEffect = true;
            isEffect = false;
            if (!typeTags.includes('Normal')) {
                typeTags.push('Normal');
            }
        } else {
            // It's likely an effect monster, but let's double check exceptions
            
            // Strategy: Check Typeline
            if (enCard.typeline) {
                const typelineStr = Array.isArray(enCard.typeline) ? enCard.typeline.join(' ') : String(enCard.typeline);
                if (typelineStr.includes('Effect')) {
                    isEffect = true;
                } else if (
                    ['Toon', 'Spirit', 'Gemini', 'Union', 'Flip'].some(t => typelineStr.includes(t))
                ) {
                    isEffect = true;
                } else {
                    isNonEffect = true;
                }
            } else {
                // Fallback to Type String heuristics
                if (enCard.type.includes('Effect') || 
                    enCard.type.includes('Toon') || 
                    enCard.type.includes('Spirit') || 
                    enCard.type.includes('Gemini') || 
                    enCard.type.includes('Union') || 
                    enCard.type.includes('Flip') ||
                    enCard.frameType === 'effect' || 
                    enCard.frameType === 'effect_pendulum'
                    ) {
                    isEffect = true;
                } else {
                     isNonEffect = true;
                }
            }
        }

        if (isEffect && !typeTags.includes('Effect')) {
            typeTags.push('Effect');
        }
        if (isNonEffect && !typeTags.includes('Non-Effect')) {
            typeTags.push('Non-Effect');
        }
        
        // Final cleanup: Ensure mutually exclusive
        if (typeTags.includes('Non-Effect') && typeTags.includes('Effect')) {
            // If explicitly marked Non-Effect (e.g. via frameType normal), remove Effect
            if (isNonEffect) {
                 const idx = typeTags.indexOf('Effect');
                 if (idx > -1) typeTags.splice(idx, 1);
            }
        }
    }

    // Clean Type String: Remove 'Tuner' and 'Effect' from the main type string
    // e.g. "Synchro Tuner Effect Monster" -> "Synchro Monster"
    const cleanType = enCard.type
        .replace(/Tuner/g, '')
        .replace(/Effect/g, '')
        .replace(/\s+/g, ' ')
        .trim();

    // 6. Montar Objeto Final Mesclado
    const card: any = {
      name: enCard.name,
      name_pt: ptCard ? ptCard.name : null, 
      type: cleanType, // Cleaned type string
      typeTags: typeTags, 
      attribute: enCard.attribute || null,
      level: enCard.level ?? null,
      atk: enCard.atk ?? null,
      def: enCard.def ?? null,
      description: enCard.desc,
      description_pt: ptCard ? ptCard.desc : null,
      imageUrl: enCard.card_images[0].image_url, 
      cardCode: String(enCard.id),
      collectionCode: collectionCode || (enCard.card_sets?.[0]?.set_code || 'Unknown'),
      rarity: rarity,
      quantity: 1,
      dateAdded: Date.now()
    };

    // Mapear imagens
    const artworks: ArtworkInfo[] = enCard.card_images.map(img => ({
      id: img.id,
      imageUrl: img.image_url,
      smallImageUrl: img.image_url_small
    }));
    
    // Mapear Sets Válidos COM DATA
    const sets = enCard.card_sets?.map(s => ({
        name: s.set_name,
        code: s.set_code,
        rarity: s.set_rarity,
        releaseDate: setDates[s.set_name] || null
    })) || [];

    return {
      card,
      artworks,
      printWasFound,
      sets
    };

  } catch (error) {
    console.error("YGO API Error:", error);
    throw error;
  }
};

export const getArtworksForCard = async (cardCode: string): Promise<ArtworkInfo[]> => {
   try {
    const idUrl = `${API_BASE_URL}?id=${cardCode}`;
    const idResp = await fetch(idUrl);
    const idJson = await idResp.json();
    
    if (idJson.error || !idJson.data || idJson.data.length === 0) return [];
    
    const cardName = idJson.data[0].name;
    const nameUrl = `${API_BASE_URL}?name=${encodeURIComponent(cardName)}`;
    const nameResp = await fetch(nameUrl);
    const nameJson = await nameResp.json();

    if (nameJson.data && nameJson.data.length > 0) {
        return nameJson.data[0].card_images.map((img: any) => ({
            id: img.id,
            imageUrl: img.image_url,
            smallImageUrl: img.image_url_small
        }));
    }
    
    return idJson.data[0].card_images.map((img: any) => ({
        id: img.id,
        imageUrl: img.image_url,
        smallImageUrl: img.image_url_small
    }));

   } catch (e) {
       console.error("Error fetching artworks:", e);
       return [];
   }
};

export const getCardSets = async (cardCode: string) => {
    try {
        const response = await fetch(`${API_BASE_URL}?id=${cardCode}`);
        const json = await response.json();
        
        if (!json.data || json.data.length === 0 || !json.data[0].card_sets) {
             if (json.data && json.data[0] && json.data[0].name) {
                const nameUrl = `${API_BASE_URL}?name=${encodeURIComponent(json.data[0].name)}`;
                const nameResp = await fetch(nameUrl);
                const nameJson = await nameResp.json();
                if (nameJson.data && nameJson.data.length > 0 && nameJson.data[0].card_sets) {
                     return nameJson.data[0].card_sets;
                }
             }
             return [];
        }

        return json.data[0].card_sets;
    } catch (e) {
        console.error("Error fetching card sets", e);
        return [];
    }
};