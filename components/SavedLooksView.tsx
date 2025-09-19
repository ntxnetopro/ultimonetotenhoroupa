import React from 'react';
import type { SavedLook, ClothingItem } from '../types';
import { SparklesIcon, TrashIcon, BookmarkIcon, CalendarIcon, StarIcon } from './icons';

interface SavedLooksViewProps {
  looks: SavedLook[];
  wardrobe: ClothingItem[];
  onDeleteLook: (id: string) => void;
}

export const SavedLooksView: React.FC<SavedLooksViewProps> = ({ looks, wardrobe, onDeleteLook }) => {
  return (
    <div className="animate-fade-in">
      <h2 className="text-3xl font-bold text-text-dark mb-6">Meus Looks Salvos</h2>

      {looks.length === 0 ? (
        <div className="text-center py-20 bg-surface rounded-2xl shadow-subtle">
          <BookmarkIcon className="w-24 h-24 mx-auto text-accent" />
          <h3 className="mt-4 text-xl font-medium text-text-dark">Você ainda não salvou nenhum look.</h3>
          <p className="mt-2 text-text-dark/70">Vá para a "Estilista IA" para criar e salvar suas combinações favoritas!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {looks.map(look => {
            const lookItems = look.itemIds
              .map(id => wardrobe.find(item => item.id === id))
              .filter((item): item is ClothingItem => !!item);
            
            return (
              <div key={look.id} className="bg-surface p-6 rounded-2xl shadow-medium relative group">
                <img src={look.image} alt="Look salvo" className="w-full object-contain rounded-xl mb-6" />

                <div className="flex flex-wrap gap-3 mb-4">
                    {look.occasion && (
                        <div className="flex items-center gap-2 bg-accent/50 text-primary font-semibold px-3 py-1.5 rounded-full text-sm">
                            <CalendarIcon className="w-5 h-5"/>
                            <span>{look.occasion}</span>
                        </div>
                    )}
                    {look.style && (
                        <div className="flex items-center gap-2 bg-accent/50 text-primary font-semibold px-3 py-1.5 rounded-full text-sm">
                            <StarIcon className="w-5 h-5"/>
                            <span>{look.style}</span>
                        </div>
                    )}
                </div>
                
                <div className="p-4 rounded-xl bg-subtle-bg mb-6">
                  <h3 className="text-base font-bold text-text-dark flex items-center gap-2"><SparklesIcon className="w-5 h-5 text-primary" /> Dica da Estilista</h3>
                  <p className="mt-2 text-sm text-text-dark/80 italic">"{look.commentary}"</p>
                </div>

                <div>
                  <h3 className="text-base font-bold text-text-dark mb-3">Peças Utilizadas</h3>
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
                    {lookItems.map(item => (
                      <div key={item.id} className="text-center">
                        <img src={item.image} alt={item.name} className="w-full h-24 object-cover rounded-lg shadow-subtle" />
                        <p className="mt-2 text-xs font-medium text-text-dark/90 truncate">{item.name}</p>
                      </div>
                    ))}
                  </div>
                </div>
                
                <button
                  onClick={() => onDeleteLook(look.id)}
                  className="absolute top-4 right-4 p-2 bg-surface/80 text-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-primary hover:text-white"
                  aria-label="Excluir look"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};