import React from 'react';
import type { View } from '../types';
import { ShirtIcon, SparklesIcon, BookmarkIcon } from './icons';

interface BottomNavProps {
  view: View;
  setView: (view: View) => void;
}

const NavItem: React.FC<{
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}> = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center gap-1 w-full transition-all duration-300 transform hover:scale-110 ${active ? 'text-primary' : 'text-secondary hover:text-primary'}`}
  >
    <div className={`transition-transform duration-300 ${active ? 'scale-110' : ''}`}>
      {icon}
    </div>
    <span className="text-xs font-semibold">{label}</span>
  </button>
);

export const BottomNav: React.FC<BottomNavProps> = ({ view, setView }) => {
  return (
    <footer className="fixed bottom-0 left-0 right-0 h-20 bg-surface/90 backdrop-blur-lg border-t border-border-color z-40">
      <nav className="h-full container mx-auto px-4 sm:px-6 md:px-8 flex justify-around items-center">
        <NavItem
          active={view === 'wardrobe' || view === 'add-items'}
          onClick={() => setView('wardrobe')}
          icon={<ShirtIcon className="w-6 h-6" />}
          label="Guarda-Roupa"
        />
        
        <button
          onClick={() => setView('stylist')}
          aria-label="Gerar Look"
          className="relative -top-6 flex flex-col items-center justify-center gap-1 transition-transform transform hover:scale-110 focus:outline-none"
        >
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white shadow-medium group-hover:bg-primary-hover">
              <SparklesIcon className="w-8 h-8" />
          </div>
          <span className="text-xs font-semibold text-primary">Gerar Look</span>
        </button>

        <NavItem
          active={view === 'saved-looks'}
          onClick={() => setView('saved-looks')}
          icon={<BookmarkIcon className="w-6 h-6" />}
          label="Looks Salvos"
        />
      </nav>
    </footer>
  );
};