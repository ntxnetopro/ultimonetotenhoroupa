
import React, { useState, useMemo } from 'react';
import type { ClothingItem, View, MainCategory } from '../types';
import { Categories, Styles } from '../types';
import { ClothingItemCard } from './ClothingItemCard';
import { PlusIcon, ShirtIcon } from './icons';

interface WardrobeViewProps {
  wardrobe: ClothingItem[];
  onSelectItem: (item: ClothingItem) => void;
  setView: (view: View) => void;
}

export const WardrobeView: React.FC<WardrobeViewProps> = ({ wardrobe, onSelectItem, setView }) => {
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [subcategoryFilter, setSubcategoryFilter] = useState<string>('all');
  const [styleFilter, setStyleFilter] = useState<string>('all');

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCategoryFilter(e.target.value);
    setSubcategoryFilter('all'); // Reset subcategory when main category changes
  };

  const filteredWardrobe = useMemo(() => {
    return wardrobe.filter(item => {
      const categoryMatch = categoryFilter === 'all' || item.category === categoryFilter;
      const subcategoryMatch = subcategoryFilter === 'all' || item.subcategory === subcategoryFilter;
      const styleMatch = styleFilter === 'all' || item.style === styleFilter;
      return categoryMatch && subcategoryMatch && styleMatch;
    });
  }, [wardrobe, categoryFilter, subcategoryFilter, styleFilter]);

  const subcategoriesForFilter = categoryFilter !== 'all' ? Categories[categoryFilter as MainCategory] : [];

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-3xl font-bold text-text-dark">Meu Guarda-Roupa</h2>
      </div>

      {wardrobe.length > 0 && (
        <div className="mb-6 bg-surface p-4 rounded-xl shadow-subtle flex flex-col sm:flex-row items-center gap-4 flex-wrap">
            <span className="font-semibold text-text-dark/80 flex-shrink-0">Filtrar por:</span>
            <div className="w-full sm:w-auto flex-grow">
                <select 
                    value={categoryFilter}
                    onChange={handleCategoryChange}
                    className="w-full p-2 border border-border-color rounded-md focus:ring-2 focus:ring-primary/50 focus:border-primary transition"
                >
                    <option value="all">Todas as Categorias</option>
                    {Object.keys(Categories).map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>
            </div>
            <div className="w-full sm:w-auto flex-grow">
                <select
                    value={subcategoryFilter}
                    onChange={(e) => setSubcategoryFilter(e.target.value)}
                    disabled={categoryFilter === 'all'}
                    className="w-full p-2 border border-border-color rounded-md focus:ring-2 focus:ring-primary/50 focus:border-primary transition disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                    <option value="all">Todas as Subcategorias</option>
                    {subcategoriesForFilter.map(sub => (
                        <option key={sub} value={sub}>{sub}</option>
                    ))}
                </select>
            </div>
             <div className="w-full sm:w-auto flex-grow">
                <select 
                    value={styleFilter}
                    onChange={(e) => setStyleFilter(e.target.value)}
                    className="w-full p-2 border border-border-color rounded-md focus:ring-2 focus:ring-primary/50 focus:border-primary transition"
                >
                    <option value="all">Todos os Estilos</option>
                    {Styles.map(style => (
                        <option key={style} value={style}>{style}</option>
                    ))}
                </select>
            </div>
        </div>
      )}

      {wardrobe.length === 0 ? (
        <div className="text-center py-20 bg-surface rounded-2xl shadow-subtle">
            <ShirtIcon className="w-24 h-24 mx-auto text-accent"/>
          <h3 className="mt-4 text-xl font-medium text-text-dark">Seu guarda-roupa está vazio!</h3>
          <p className="mt-2 text-text-dark/70">Clique no botão de '+' para começar a catalogar suas roupas.</p>
        </div>
      ) : filteredWardrobe.length === 0 ? (
        <div className="text-center py-20 bg-surface rounded-2xl shadow-subtle">
            <ShirtIcon className="w-24 h-24 mx-auto text-accent"/>
          <h3 className="mt-4 text-xl font-medium text-text-dark">Nenhuma peça encontrada</h3>
          <p className="mt-2 text-text-dark/70">Tente ajustar seus filtros para encontrar o que procura.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {filteredWardrobe.map(item => (
            <ClothingItemCard key={item.id} item={item} onClick={() => onSelectItem(item)} />
          ))}
        </div>
      )}

      <div className="fixed bottom-24 right-4 z-40">
        <button
          onClick={() => setView('add-items')}
          className="flex items-center justify-center w-16 h-16 bg-primary text-white rounded-full shadow-medium hover:bg-primary-hover transition-transform transform hover:scale-110"
          aria-label="Adicionar Peças"
        >
          <PlusIcon className="w-8 h-8" />
        </button>
      </div>
    </div>
  );
};
