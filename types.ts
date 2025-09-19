
export const Categories = {
  "Parte de Cima": [
    "Camisetas", "Camisas", "Blusas", "Regatas", "Croppeds", "Jaquetas", "Casacos", "Suéteres", "Cardigãs"
  ],
  "Parte de Baixo": [
    "Calças Jeans", "Calças Alfaiataria", "Leggings", "Calças de Moletom", "Shorts", "Bermudas", "Saias"
  ],
  "Vestidos e Macacões": [
    "Vestidos Curtos", "Vestidos Midi", "Vestidos Longos", "Macacões", "Macaquinhos"
  ],
  "Sobreposição": [
    "Blazers", "Coletes", "Kimonos", "Trench Coats", "Sobretudos"
  ],
  "Calçados": [
    "Tênis", "Sapatos Sociais", "Botas", "Sandálias", "Sapatilhas", "Chinelos"
  ],
  "Acessórios": [
    "Bolsas", "Cintos", "Chapéus", "Bonés", "Lenços", "Echarpes", "Óculos"
  ],
  "Moda Íntima e Praia": [
    "Lingerie", "Pijamas", "Biquínios", "Maiôs"
  ],
  "Esportivo": [
    "Roupas de Academia", "Roupas de Banho Esportivas", "Tênis Esportivos"
  ]
};

export type MainCategory = keyof typeof Categories;

export const Styles = [
  'Casual', 'Elegante', 'Boho', 'Streetwear', 'Minimalista', 'Esportivo'
];
export type Style = typeof Styles[number];


export interface ClothingItem {
  id: string;
  name: string;
  category: MainCategory;
  subcategory: string;
  color: string;
  image: string; // base64 string
  style: Style;
  fabric: string;
  fit: string;
  formality_level: number;
  season: string[];
  versatility: number;
}

export interface Outfit {
  top?: ClothingItem;
  bottom?: ClothingItem;
  dress?: ClothingItem;
  outerwear?: ClothingItem;
  shoes?: ClothingItem;
  accessories?: ClothingItem[];
}

export interface SavedLook {
    id: string;
    image: string;
    commentary: string;
    itemIds: string[];
    occasion: string;
    style: string;
}

export interface StylistRequest {
  mainPieceId: string;
  occasion: string;
  style: string;
  numLooks: number;
}


export type View = 'welcome' | 'wardrobe' | 'add-items' | 'stylist' | 'saved-looks' | 'profile' | 'item-detail';
