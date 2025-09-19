import React from 'react';
import { UserIcon } from './icons';

const CreditPlanCard: React.FC<{
  title: string;
  credits: number;
  price: string;
  popular?: boolean;
}> = ({ title, credits, price, popular }) => (
  <div className={`relative border-2 p-6 rounded-2xl text-center flex flex-col ${popular ? 'border-primary bg-subtle-bg' : 'border-border-color bg-surface'}`}>
    {popular && (
      <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full">
        MAIS POPULAR
      </div>
    )}
    <h3 className="text-xl font-bold text-primary">{title}</h3>
    <p className="text-4xl font-extrabold text-text-dark my-4">{credits}</p>
    <p className="text-text-dark/80 mb-6">créditos</p>
    <p className="text-2xl font-semibold text-text-dark mb-6">{price}</p>
    <button className="mt-auto w-full px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-colors shadow-md">
      Comprar
    </button>
  </div>
);

export const ProfileView: React.FC = () => {
  return (
    <div className="animate-fade-in max-w-4xl mx-auto space-y-8">
      <h2 className="text-3xl font-bold text-text-dark text-center">Meu Perfil</h2>

      <div className="bg-surface p-6 rounded-2xl shadow-subtle flex items-center gap-4">
        <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center">
          <UserIcon className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-text-dark">Ana Clara</h3>
          <p className="text-text-dark/70">ana.clara@email.com</p>
        </div>
      </div>

      <div className="bg-surface p-6 rounded-2xl shadow-subtle text-center">
        <h3 className="text-lg font-semibold text-text-dark/80 mb-2">Seus Créditos</h3>
        <p className="text-6xl font-extrabold text-primary">5</p>
        <p className="text-text-dark/70 mt-1">1 crédito = 1 look gerado pela IA</p>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-text-dark text-center mb-6">Comprar Créditos</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <CreditPlanCard title="Básico" credits={10} price="R$ 19,90" />
          <CreditPlanCard title="Essencial" credits={25} price="R$ 39,90" popular />
          <CreditPlanCard title="Profissional" credits={50} price="R$ 69,90" />
        </div>
      </div>
    </div>
  );
};