
import React from 'react';
import type { ClothingItem } from '../types';
import { ColorSwatchIcon, StarIcon, SparklesIcon } from './icons';

interface ClothingItemCardProps {
  item: ClothingItem;
  onClick: () => void;
}

export const ClothingItemCard: React.FC<ClothingItemCardProps> = ({ item, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className="group relative bg-surface rounded-xl overflow-hidden shadow-subtle hover:shadow-medium transition-shadow duration-300 flex flex-col cursor-pointer"
    >
       <div className="relative">
        <img src={item.image} alt={item.name} className="w-full h-48 object-cover" />
         <div className="absolute top-2 left-2 bg-secondary text-white text-xs px-2 py-1 rounded-full">{item.category}</div>
      </div>
      <div className="p-3 flex flex-col flex-grow">
        <h4 className="font-semibold text-text-dark truncate flex-grow mb-1">{item.name}</h4>
         <div className="flex justify-between items-center text-xs text-text-dark/70 mb-2">
            <p className="truncate">{item.subcategory}</p>
            {item.style && (
                <div className="flex items-center gap-1 font-medium text-primary flex-shrink-0 ml-2">
                    <StarIcon className="w-3 h-3"/>
                    <span className="truncate">{item.style}</span>
                </div>
            )}
        </div>
        <div className="space-y-2 text-xs text-text-dark/80 mt-auto">
            <div className="flex justify-between items-center">
                <span className="font-medium text-text-dark/60">Caimento:</span>
                <span className="font-semibold text-text-dark truncate">{item.fit}</span>
            </div>
            <div className="flex justify-between items-center">
                <span className="font-medium text-text-dark/60">Versatilidade:</span>
                <div className="flex items-center gap-1 font-semibold text-primary">
                    <SparklesIcon className="w-3 h-3" />
                    <span>{item.versatility}/10</span>
                </div>
            </div>
             <div className="flex items-center pt-1 border-t border-border-color/50 mt-2">
                <ColorSwatchIcon className="w-4 h-4 mr-1.5 text-secondary flex-shrink-0" />
                <span className="truncate">{item.color}</span>
            </div>
        </div>
      </div>
    </div>
  );
};
