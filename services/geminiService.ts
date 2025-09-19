

import { GoogleGenAI, Type, Modality } from "@google/genai";
import type { ClothingItem, Outfit, MainCategory, Style } from '../types';
import { Categories, Styles } from "../types";

// Initialize the Google Gemini AI client
// The API key is expected to be set in the environment variables
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Helper to convert a data URL to a Gemini Part object, robustly handling newlines.
 * @param base64String - The base64 data URL.
 * @returns A Gemini Part object for inline data.
 */
const base64ToPart = (base64String: string) => {
    // This regex matches the data URL prefix (e.g., "data:image/jpeg;base64,") and captures the mime type.
    const match = base64String.match(/^data:(image\/\w+);base64,/);

    if (!match) {
        // Fallback for a raw base64 string that doesn't have the data URL prefix.
        // It's crucial to still clean up any whitespace (like newlines).
        const data = base64String.replace(/\s/g, '');
        return { inlineData: { data, mimeType: 'image/jpeg' } };
    }
    
    const mimeType = match[1];
    // Get the length of the entire prefix (e.g., "data:image/jpeg;base64,")
    const prefixLength = match[0].length;
    // Extract the base64 data by taking the substring after the prefix, and clean any whitespace.
    const data = base64String.substring(prefixLength).replace(/\s/g, '');
    
    return { inlineData: { data, mimeType } };
};


/**
 * Generates a styled look from a wardrobe based on occasion and style.
 * @param wardrobe - Array of available clothing items.
 * @param occasion - The occasion for the look.
 * @param style - The desired style.
 * @param existingLookItemIds - A 2D array of item IDs from previously generated looks to avoid duplicates.
 * @param mainItemId - An optional ID of a clothing item that MUST be included in the look.
 * @returns An object containing an array of item IDs for the look and a commentary from the AI stylist.
 */
export const generateStyledLook = async (
  wardrobe: ClothingItem[],
  occasion: string,
  style: string,
  existingLookItemIds: string[][],
  mainItemId?: string,
): Promise<{ itemIds: string[], commentary: string }> => {
  const wardrobeForPrompt = wardrobe.map(({ id, name, category, subcategory, color, style, fabric, fit, formality_level, season, versatility }) => ({ id, name, category, subcategory, color, style, fabric, fit, formality_level, season, versatility }));

  const mainItemPrompt = mainItemId
    ? `\n    - PEÇA-CHAVE OBRIGATÓRIA: O look DEVE OBRIGATORIAMENTE incluir a peça com o id '${mainItemId}'. Construa toda a combinação ao redor dela.`
    : '';

  const prompt = `
    Você é um estilista de moda IA especializado no mercado brasileiro feminino. Sua missão é criar looks coesos, apropriados e inspiradores baseados no guarda-roupa fornecido.

    Contexto:
    - Estilo desejado: "${style}"
    - Ocasião: "${occasion}"
    - Guarda-roupa disponível (JSON com todos os atributos): ${JSON.stringify(wardrobeForPrompt)}
    - Looks já gerados (evite combinações de IDs idênticas): ${JSON.stringify(existingLookItemIds)}${mainItemPrompt}

    === METODOLOGIA DE ANÁLISE ===

    **ETAPA 1: DIAGNÓSTICO INICIAL**
    Sempre avalie:
    - Se houver uma peça-chave, ela é adequada para a ocasião e estilo? Se não for, mencione isso no comentário.
    - Quantas peças por categoria/estilo existem no guarda-roupa?
    - Há diversidade suficiente para o estilo solicitado?
    - A ocasião é compatível com o estilo escolhido?
    - Quais são as limitações do guarda-roupa atual?

    **ETAPA 2: MATRIZ DE COMPATIBILIDADE**

    OCASIÃO vs ESTILO - Compatibilidades:

    Trabalho:
    ✅ Elegante, Minimalista, Smart Casual
    ❌ Esportivo, Streetwear extremo

    Academia/Exercícios:
    ✅ Esportivo
    ❌ Elegante, Boho (explicar que são inadequados)

    Festa/Evento:
    ✅ Elegante, Boho (dependendo do evento), Minimalista sofisticado
    ❌ Esportivo, Casual extremo

    Casual/Dia a dia:
    ✅ Casual, Minimalista, Boho, Streetwear
    ❌ Muito formal

    Encontro:
    ✅ Elegante, Casual chique, Boho, Minimalista
    ❌ Esportivo, muito desleixado

    **ETAPA 3: SISTEMA DE SCORING AVANÇADO**

    Para cada combinação potencial, calcule:

    1.  **Main_Piece_Inclusion (0 ou 100)**:
      - Se 'mainItemId' for fornecido, a peça está no look? (100 se sim, 0 se não). Se não for fornecido, o score é sempre 100.
      - Se o score for 0 aqui, a combinação é inválida.

    2.  **Style_Harmony (0-100)**:
      - Todas as peças têm styles compatíveis?
      - Formality_levels são coerentes? (diferença máxima de 2 pontos)

    3.  **Color_Compatibility (0-100)**:
      - Cores harmonizam entre si?
      - Máximo 3 cores diferentes no look

    4.  **Occasion_Appropriateness (0-100)**:
      - Formality_level médio do look combina com a ocasião?
      - Academia = 1-3, Trabalho = 6-9, Festa = 7-10, Casual = 3-6

    5.  **Completeness (0-100)**:
      - Look tem todas as partes essenciais?
      - Obrigatório: Top + Bottom (ou vestido) + Calçado
      - Opcional mas valorizado: Sobreposição, Acessórios

    6.  **Uniqueness (0-100)**:
      - Combinação é diferente das já criadas (existingLookItemIds)?
      - Penalize repetições de mesmas peças

    **Score Total = (Main_Piece_Inclusion × 1.0) * [(Style_Harmony × 0.3) + (Color_Compatibility × 0.2) + (Occasion_Appropriateness × 0.3) + (Completeness × 0.15) + (Uniqueness × 0.05)]**

    **ETAPA 4: CRITÉRIOS DE APROVAÇÃO**

    - Score ≥ 75: Look excelente, retorne com confiança
    - Score 60-74: Look aceitável, mas mencione limitações
    - Score < 60: Não criar look, explicar por que não funcionou

    === CENÁRIOS DE RESPOSTA ===

    **CENÁRIO 1: SUCESSO (Score ≥ 60)**
    {
      "itemIds": ["id1", "id2", "id3", "id4"],
      "commentary": "[Abertura motivacional] Este look é perfeito para [ocasião]! [Explicação técnica] A combinação funciona porque [justificativa baseada em cores/estilos/ocasião]. [Dica de styling] Para finalizar: [sugestão específica de como usar/combinar]. [Score se for 60-74] *Dica: seu guarda-roupa ficaria ainda mais versátil com [sugestão específica]."
    }

    **CENÁRIO 2: SEM PEÇAS ADEQUADAS**
    Use os templates de mensagem educativa:
    - Esportivo: "Não encontrei peças de academia no seu guarda-roupa! Para looks esportivos, você precisaria de: tops dry-fit, leggings/shorts esportivos e tênis. Que tal fotografar suas roupas de treino? 💪"
    - Elegante: "Para criar looks elegantes, seu guarda-roupa precisa de peças mais formais. Sugestões: blazers, camisas de tecido nobre, vestidos estruturados, sapatos de salto ou sapatilhas refinadas. ✨"
    - Minimalista: "O estilo minimalista pede peças com cortes limpos e cores neutras. Procure por: camisas básicas, calças de alfaiataria, vestidos de linha reta em tons como preto, branco, cinza ou nude. 🤍"
    - Boho: "Para o estilo boho, você precisaria de peças com mais personalidade: vestidos fluidos, quimonos, blusas com texturas, acessórios artesanais ou estampas diferenciadas. 🌸"
    - Streetwear: "O look streetwear pede atitude urbana: moletons oversized, tênis chamativos, jaquetas bomber, peças com logos ou estampas gráficas. 👟"
    - Casual: "Para looks casuais, adicione ao seu guarda-roupa: camisetas confortáveis, jeans, tênis casuais, cardigans ou blusas descontraídas. 😊"
    - Incompatibilidade ocasião x estilo: "O estilo '[estilo]' não é ideal para '[ocasião]'. Para [ocasião], recomendo: [estilos apropriados]. Posso criar um look incrível se você escolher um estilo mais adequado! 😉"
    - Guarda-roupa limitado: "Seu guarda-roupa tem potencial, mas ainda é pequeno para criar muitas variações. Que tal fotografar mais peças? Quanto mais opções, mais looks incríveis posso criar para você! 📸"

    **CENÁRIO 3: SEM NOVAS COMBINAÇÕES**
    "Já explorei todas as combinações possíveis de [estilo] para [ocasião] com seu guarda-roupa atual! Para novos looks: 1) Tente outro estilo, 2) Mude a ocasião, ou 3) Adicione novas peças fotografando-as. Estou sempre aqui para criar looks únicos! ✨"

    === REGRAS TÉCNICAS OBRIGATÓRIAS ===
    1.  SEMPRE retorne JSON válido { "itemIds": [...], "commentary": "..." }.
    2.  'itemIds' deve ser um array, mesmo que vazio [].
    3.  'commentary' NUNCA deve ser vazio; forneça sempre feedback útil.
    4.  Mínimo 3 peças para um look completo (a menos que seja um vestido/macacão com calçado).
    5.  Se 'mainItemId' for fornecido, ele DEVE estar no array 'itemIds'. Se for impossível criar um look com ele, retorne um 'commentary' explicando o motivo e um 'itemIds' vazio.
    6.  NUNCA repita combinações de IDs de 'existingLookItemIds'.
    7.  Priorize peças com 'versatility' alta.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          itemIds: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Uma lista dos IDs das peças de roupa selecionadas para o look."
          },
          commentary: {
            type: Type.STRING,
            description: "Um breve comentário de moda sobre o look criado ou o motivo pelo qual um look não pôde ser criado, em português do Brasil."
          }
        },
        required: ["itemIds", "commentary"]
      }
    }
  });

  const jsonResponse = JSON.parse(response.text);
  return jsonResponse;
};


/**
 * Generates a virtual try-on image by dressing a user's photo with a given outfit.
 * @param userPhoto - A base64 encoded string of the user's photo.
 * @param outfit - An object containing the clothing items for the look.
 * @returns A base64 encoded string of the generated image.
 */
export const generateVirtualTryOnImage = async (
  userPhoto: string,
  outfit: Outfit
): Promise<string> => {
  const model = 'gemini-2.5-flash-image-preview';

  const parts: any[] = [];

  const outfitItems = [
      outfit.dress, 
      outfit.top, 
      outfit.bottom,
      outfit.outerwear, 
      outfit.shoes, 
      ...(outfit.accessories || [])
  ].filter((item): item is ClothingItem => !!item);

  if (outfitItems.length === 0) {
      throw new Error("Nenhuma peça de roupa foi fornecida para o provador virtual.");
  }
  
  parts.push(base64ToPart(userPhoto));
  
  outfitItems.forEach(item => {
    if (item) {
        parts.push(base64ToPart(item.image));
    }
  });

  const itemDescriptions = outfitItems.map(item => `${item.name} (${item.subcategory})`).join(', ');
  const promptText = `
    Aja como um provador virtual. Sua tarefa é vestir a mulher na primeira imagem com as peças de roupa fornecidas nas imagens seguintes.
    - Substitua a roupa que ela está usando pelas peças do look.
    - Mantenha o rosto, o corpo e a pose da foto original.
    - O look é composto por: ${itemDescriptions}.
    
    === REGRAS DE GERAÇÃO OBRIGATÓRIAS ===
    1.  **Fundo Claro:** O resultado DEVE ter um fundo claro e neutro, como uma foto de e-commerce ou catálogo de moda.
    2.  **Sem Cortes (Enquadramento Completo):** A imagem gerada DEVE mostrar a modelo de corpo inteiro, dos pés à cabeça. Nenhuma parte do corpo ou do look pode ser cortada.
    3.  **Fotorrealismo:** O resultado final deve ser uma imagem fotorrealista da mulher usando o look completo.
  `;

  parts.push({ text: promptText });

  const response = await ai.models.generateContent({
    model: model,
    contents: { parts },
    config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
    },
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      const base64ImageBytes: string = part.inlineData.data;
      const mimeType = part.inlineData.mimeType || 'image/png';
      return `data:${mimeType};base64,${base64ImageBytes}`;
    }
  }

  throw new Error("A IA não conseguiu gerar uma imagem para o provador virtual. Tente novamente.");
};

/**
 * Removes the background from a clothing item image and replaces it with a solid white background.
 * @param imageBase64 - A base64 encoded string of the clothing item image.
 * @returns A base64 encoded string of the image with a white background.
 */
export const removeImageBackground = async (
    imageBase64: string
): Promise<string> => {
    const model = 'gemini-2.5-flash-image-preview';

    const imagePart = base64ToPart(imageBase64);
    const textPart = { text: "Isole a peça de roupa principal nesta imagem e coloque-a sobre um fundo totalmente branco e sólido. O resultado deve ser uma imagem nítida da peça de roupa, sem sombras, sobre um fundo branco puro." };

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: { parts: [imagePart, textPart] },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });

        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                const base64ImageBytes: string = part.inlineData.data;
                const mimeType = 'image/jpeg'; // Force JPEG for white background
                return `data:${mimeType};base64,${base64ImageBytes}`;
            }
        }
        
        console.warn("IA did not return an image for background removal, returning original.");
        return imageBase64; // Fallback to original if no image part is found

    } catch (error) {
        console.error("Error removing image background, returning original image:", error);
        return imageBase64;
    }
};

/**
 * Analyzes a clothing item image and returns its attributes.
 * @param imageBase64 - A base64 encoded string of the clothing item image.
 * @returns An object with the item's attributes.
 */
export const analyzeClothingItem = async (
    imageBase64: string
): Promise<Omit<ClothingItem, 'id' | 'image'>> => {
    const validCategories = Object.keys(Categories);
    const validStyles = Styles;

    const prompt = `
        Você é um especialista em moda e catalogação com profundo conhecimento do mercado brasileiro feminino. Analise a imagem da peça de roupa fornecida e retorne OBRIGATORIAMENTE um JSON com os seguintes atributos:

        === ATRIBUTOS OBRIGATÓRIOS ===

        1.  **name** (string): Nome descritivo incluindo material/corte/detalhes únicos se aparentes. Use terminologia brasileira familiar. Exemplos: "Camisa de linho manga bufante", "Calça jeans skinny cintura alta", "Vestido midi estampado floral", "Blazer estruturado preto".

        2.  **category** (string): OBRIGATORIAMENTE uma das opções: ${JSON.stringify(validCategories)}.

        3.  **subcategory** (string): Subcategoria específica e precisa dentro da categoria principal. Seja criativo mas lógico. Exemplos: "Blusas", "Camisetas", "Regatas", "Jeans", "Vestidos Casuais", "Tênis Casuais".

        4.  **color** (string): Cor principal ou descrição do padrão dominante. Seja específico: "Azul marinho", "Rosa millennial", "Estampado animal print", "Listrado preto e branco".

        5.  **style** (string): OBRIGATORIAMENTE uma das opções: ${JSON.stringify(validStyles)}. Use o contexto cultural brasileiro para classificação.

        6.  **fabric** (string): Material identificável ou estimativa. Opções: "Algodão", "Jeans", "Linho", "Seda", "Tricot", "Dry-fit", "Poliéster", "Viscose", "Couro", "Suede", "Não identificável".

        7.  **fit** (string): Tipo de caimento. Opções: "Justo", "Solto", "Oversized", "Estruturado", "Fluído", "Slim", "Regular".

        8.  **formality_level** (number): Escala 1-10 (1-2: Super casual, 3-4: Casual, 5-6: Smart casual, 7-8: Elegante, 9-10: Muito formal).

        9.  **season** (array de strings): Estações apropriadas. Opções: ["Primavera", "Verão", "Outono", "Inverno", "Todo ano"].

        10. **versatility** (number): Escala 1-10 de versatilidade (10: Peça coringa, 1: Peça muito específica).

        === CRITÉRIOS DE CLASSIFICAÇÃO POR ESTILO ===
        - **ESPORTIVO**: Exclusivamente para exercícios físicos. Tecidos técnicos. formality_level: 1-2.
        - **CASUAL**: Uso diário, conforto + estilo. formality_level: 3-5.
        - **ELEGANTE**: Ocasiões formais, trabalho. formality_level: 7-10.
        - **MINIMALISTA**: Linhas limpas, cores neutras.
        - **BOHO**: Estilo livre, natural, estampas, texturas.
        - **STREETWEAR**: Urbano, despojado, oversized.

        === VALIDAÇÃO E QUALIDADE ===
        - SEMPRE retorne JSON válido e completo. TODOS os campos são obrigatórios. Se incerto, use estimativa lógica ou "Não identificável". NUNCA deixe campos undefined/null/vazios. O estilo escolhido deve ser coerente com o formality_level.
    `;

    const imagePart = base64ToPart(imageBase64);

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, { text: prompt }] },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        category: { type: Type.STRING, enum: validCategories },
                        subcategory: { type: Type.STRING },
                        color: { type: Type.STRING },
                        style: { type: Type.STRING, enum: validStyles },
                        fabric: { type: Type.STRING },
                        fit: { type: Type.STRING },
                        formality_level: { type: Type.NUMBER },
                        season: { type: Type.ARRAY, items: { type: Type.STRING } },
                        versatility: { type: Type.NUMBER },
                    },
                    required: ["name", "category", "subcategory", "color", "style", "fabric", "fit", "formality_level", "season", "versatility"],
                },
            },
        });

        const analyzedData = JSON.parse(response.text);

        const categoryKey = analyzedData.category as MainCategory;
        if (!Categories[categoryKey]) {
            throw new Error(`Categoria inválida retornada pela IA: ${analyzedData.category}`);
        }

        return analyzedData as Omit<ClothingItem, 'id' | 'image'>;

    } catch (error) {
        console.error("Error analyzing clothing item:", error);
        throw new Error("A resposta da IA não corresponde ao formato esperado.");
    }
};
