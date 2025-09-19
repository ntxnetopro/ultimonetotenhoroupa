import React from 'react';
import { ArrowRightIcon } from './icons';

interface WelcomeViewProps {
    onGetStarted: () => void;
}

export const WelcomeView: React.FC<WelcomeViewProps> = ({ onGetStarted }) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
            <div className="bg-surface p-8 sm:p-12 rounded-2xl shadow-medium max-w-2xl">
                <h1 className="text-4xl sm:text-5xl font-extrabold text-primary mb-4">
                    Bem-vinda ao seu Guarda-Roupa Virtual!
                </h1>
                <p className="text-lg text-text-dark/80 mb-8">
                    Catalogue suas peças, crie looks incríveis e veja como ficam em você usando o poder da Inteligência Artificial.
                </p>
                <button
                    onClick={onGetStarted}
                    className="group flex items-center justify-center px-8 py-4 bg-primary text-white font-semibold rounded-xl text-lg hover:bg-primary-hover transition-transform transform hover:scale-105 duration-300 shadow-lg"
                >
                    Começar a organizar
                    <ArrowRightIcon className="w-6 h-6 ml-3 transition-transform duration-300 group-hover:translate-x-1" />
                </button>
            </div>
        </div>
    );
};