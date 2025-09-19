import React from 'react';
import type { View } from '../types';
import { UserIcon } from './icons';

interface HeaderProps {
  view: View;
  setView: (view: View) => void;
}

export const Header: React.FC<HeaderProps> = ({ view, setView }) => {
  return (
    <header className="bg-surface/80 backdrop-blur-md shadow-subtle sticky top-0 z-40 border-b border-border-color/50">
      <nav className="container mx-auto px-4 sm:px-6 md:px-8 py-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
            <span className="font-extrabold text-xl text-primary">VirtualCloset AI</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={() => setView('profile')}
            aria-label="Ver Perfil"
            className={`p-2 rounded-full transition-colors duration-200 ${
              view === 'profile'
                ? 'bg-accent text-primary'
                : 'text-text-dark hover:bg-accent'
            }`}
          >
            <UserIcon className="w-6 h-6" />
          </button>
        </div>
      </nav>
    </header>
  );
};