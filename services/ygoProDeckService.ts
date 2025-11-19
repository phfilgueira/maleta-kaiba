import { Card, ArtworkInfo } from '../types';

const API_BASE_URL = 'https://db.ygoprodeck.com/api/v7/cardinfo.php';

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
  card_images: { id: number; image_url: string; image_url_small: string }[];
  card_sets?: { set_name: string; set_code: string; set_rarity: string }[];
}

export const searchCard = async ({ cardCode, collectionCode }: { cardCode: string, collectionCode: string }) => {
  let url = `${API_BASE_URL}?`;
  
  // Prioriza busca por nome se o código numérico falhar ou não existir, mas tenta ID primeiro
  if (cardCode && /^\d+$/.test(cardCode)) {
    url += `id=${cardCode}`;
  } else {
    // Se não temos ID, usamos busca fuzzy pelo nome (o parâmetro 'fname' faz busca parcial)
    // Nota: O App deve passar o nome se o cardCode falhar, mas aqui assumimos que o cardCode pode ser um nome se não for número
    // Para simplificar, se a identificação falhar em dar números, o app provavelmente passará algo.
    // Vamos assumir que o App lida com lógica de "Se código vazio, busque por nome" antes de chamar, 
    // ou que o parâmetro cardCode aqui pode ser usado para busca geral.
    
    // Na verdade, o app atual passa o que vem do Gemini. Se o Gemini der nome e não código, precisamos buscar por nome.
    // O serviço Gemini retorna { cardCode, collectionCode, name }.
    // O App chama searchCard({ cardCode, collectionCode }). 
    // Se cardCode for vazio, precisamos buscar pelo nome que não está sendo passado neste argumento no App.tsx atual.
    // FIX: Vamos fazer uma busca geral se o ID não for numérico válido.
    throw new Error("Card code required for precise lookup");
  }

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    const apiCard: ApiCardData = data.data[0];
    
    // Identificar raridade baseada no collectionCode
    let foundSet = null;
    let printWasFound = false;

    if (collectionCode && apiCard.card_sets) {
      foundSet = apiCard.card_sets.find(set => set.set_code === collectionCode);
      if (foundSet) printWasFound = true;
    }

    // Se não achou o set específico, pega o primeiro ou define padrão
    const rarity = foundSet ? foundSet.set_rarity : 'Common';

    const card: any = {
      name: apiCard.name,
      name_pt: null, // API não retorna PT por padrão facilmente sem config extra, mantendo null
      type: apiCard.type,
      race: apiCard.race,
      subType: apiCard.frameType,
      attribute: apiCard.attribute || null,
      level: apiCard.level || null,
      atk: apiCard.atk || null,
      def: apiCard.def || null,
      description: apiCard.desc,
      description_pt: null,
      imageUrl: apiCard.card_images[0].image_url,
      cardCode: String(apiCard.id),
      collectionCode: collectionCode || (apiCard.card_sets?.[0]?.set_code || 'Unknown'),
      rarity: rarity,
      quantity: 1,
      dateAdded: Date.now()
    };

    const artworks: ArtworkInfo[] = apiCard.card_images.map(img => ({
      id: img.id,
      imageUrl: img.image_url
    }));

    return {
      card,
      artworks,
      printWasFound
    };

  } catch (error) {
    console.error("YGO API Error:", error);
    throw error;
  }
};

export const getArtworksForCard = async (cardCode: string): Promise<ArtworkInfo[]> => {
   const url = `${API_BASE_URL}?id=${cardCode}`;
   try {
    const response = await fetch(url);
    const data = await response.json();
    if (data.data && data.data.length > 0) {
        return data.data[0].card_images.map((img: any) => ({
            id: img.id,
            imageUrl: img.image_url
        }));
    }
    return [];
   } catch (e) {
       return [];
   }
};