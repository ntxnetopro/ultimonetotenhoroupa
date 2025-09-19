

import React, { useState, useEffect } from 'react';
import type { ClothingItem, SavedLook, Outfit, StylistRequest } from '../types';
import { generateStyledLook, generateVirtualTryOnImage } from '../services/geminiService';
import { Spinner } from './Spinner';
import { SparklesIcon, BookmarkIcon, BriefcaseIcon, PartyPopperIcon, DumbbellIcon, ShirtIcon } from './icons';
import { MODEL_PHOTO_BASE64 } from '../assets/modelPhoto';

interface PersonalStylistViewProps {
  wardrobe: ClothingItem[];
  onSaveLook: (look: Omit<SavedLook, 'id'>) => void;
  initialRequest: StylistRequest | null;
  onRequestConsumed: () => void;
}

interface GeneratedLook {
    items: ClothingItem[];
    commentary: string;
    image: string;
}

const outfitFromItems = (items: ClothingItem[]): Outfit => {
    const outfit: Outfit = { accessories: [] };
    for (const item of items) {
        switch (item.category) {
            case "Parte de Cima":
                outfit.top = item;
                break;
            case "Parte de Baixo":
                outfit.bottom = item;
                break;
            case "Vestidos e Macacões":
                outfit.dress = item;
                break;
            case "Sobreposição":
                outfit.outerwear = item;
                break;
            case "Calçados":
                outfit.shoes = item;
                break;
            case "Acessórios":
                outfit.accessories?.push(item);
                break;
        }
    }
    return outfit;
};

const OccasionButton: React.FC<{
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    isActive: boolean;
}> = ({ icon, label, onClick, isActive }) => (
    <button onClick={onClick} className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border-2 transition-colors w-full ${isActive ? 'bg-accent border-primary' : 'bg-surface border-border-color hover:border-primary/50'}`}>
        {icon}
        <span className="text-sm font-semibold text-text-dark">{label}</span>
    </button>
);

const loadingMessages = [
    "Analisando seu estilo e peças...",
    "Combinando as melhores opções...",
    "Consultando nossa IA de moda...",
    "Criando o primeiro look...",
    "Gerando a visualização do look...",
    "Ajustando os detalhes finais...",
    "Preparando mais uma opção para você...",
];

export const PersonalStylistView: React.FC<PersonalStylistViewProps> = ({ wardrobe, onSaveLook, initialRequest, onRequestConsumed }) => {
  const [occasion, setOccasion] = useState('Casual');
  const [style, setStyle] = useState('Minimalista / Elegante');
  const [numLooks, setNumLooks] = useState(1);
  
  const [generatedLooks, setGeneratedLooks] = useState<GeneratedLook[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [educationalMessage, setEducationalMessage] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [existingLookItemIds, setExistingLookItemIds] = useState<string[][]>([]);

  const handleGenerateLook = async (mainPieceId?: string) => {
    setIsLoading(true);
    setError(null);
    setEducationalMessage(null);
    setGeneratedLooks([]);
    
    let messageInterval: NodeJS.Timeout | undefined;
    let foundEducationalMessage = false;

    try {
        setLoadingMessage(loadingMessages[0]);
        let messageIndex = 0;
        messageInterval = setInterval(() => {
            messageIndex = (messageIndex + 1) % loadingMessages.length;
            setLoadingMessage(loadingMessages[messageIndex]);
        }, 3000);

        let currentExistingIds = [...existingLookItemIds];
        const newLooks: GeneratedLook[] = [];
        const looksToGenerate = mainPieceId ? numLooks : numLooks;

        for (let i = 0; i < looksToGenerate; i++) {
            setLoadingMessage(`Criando look ${i + 1} de ${looksToGenerate}...`);
            const lookData = await generateStyledLook(wardrobe, occasion, style, currentExistingIds, mainPieceId);
            
            if (lookData.itemIds && lookData.itemIds.length > 0) {
                const lookItems = lookData.itemIds
                    .map(id => wardrobe.find(item => item.id === id))
                    .filter((item): item is ClothingItem => !!item);
                
                if (lookItems.length === lookData.itemIds.length) {
                    setLoadingMessage(`Gerando visualização para o look ${i + 1}...`);
                    const outfit = outfitFromItems(lookItems);
                    const generatedImage = await generateVirtualTryOnImage(MODEL_PHOTO_BASE64, outfit);
                    
                    newLooks.push({ items: lookItems, commentary: lookData.commentary, image: generatedImage });
                    currentExistingIds.push(lookData.itemIds.sort());
                }
            } else {
                const educationalText = lookData.commentary || "Não foi possível gerar um look. Tente adicionar mais peças ou mudar o estilo/ocasião.";
                if (i === 0) {
                    setEducationalMessage(educationalText);
                    foundEducationalMessage = true;
                }
                break; 
            }
        }
        
        if (newLooks.length > 0) {
            setGeneratedLooks(newLooks);
            setExistingLookItemIds(currentExistingIds);
        } else if (!error && !foundEducationalMessage) {
             setError("Não foi possível gerar novos looks com os critérios selecionados. Tente novamente.");
        }

    } catch (e) {
      setError(e instanceof Error ? e.message : "Ocorreu um erro ao gerar o look. Tente novamente.");
    } finally {
      setIsLoading(false);
      if (messageInterval) clearInterval(messageInterval);
      setLoadingMessage('');
    }
  };
  
  useEffect(() => {
    if (initialRequest) {
      setOccasion(initialRequest.occasion);
      setStyle(initialRequest.style);
      setNumLooks(initialRequest.numLooks);
      // Use a timeout to ensure state updates are processed before triggering generation
      setTimeout(() => handleGenerateLook(initialRequest.mainPieceId), 0);
      onRequestConsumed();
    }
  }, [initialRequest]);


  const handleShowConfig = () => {
    setGeneratedLooks([]);
    setError(null);
    setEducationalMessage(null);
    setExistingLookItemIds([]);
  };

  const handleSaveLook = (lookToSave: GeneratedLook) => {
    if (!lookToSave || lookToSave.items.length === 0) return;

    onSaveLook({
      image: lookToSave.image,
      commentary: lookToSave.commentary,
      itemIds: lookToSave.items.map(item => item.id),
      occasion: occasion,
      style: style,
    });
  };
  
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="text-center p-8 bg-surface rounded-2xl shadow-subtle">
          <Spinner />
          <p className="mt-4 font-semibold text-primary">{loadingMessage || 'Aguarde, nossa IA está trabalhando...'}</p>
        </div>
      );
    }
    
    if (error) {
       return (
          <div className="text-center p-8 bg-red-50 text-red-700 rounded-2xl shadow-subtle">
              <h3 className="font-bold text-lg">Oops! Algo deu errado.</h3>
              <p className="mt-2">{error}</p>
               <button onClick={handleShowConfig} className="mt-6 group flex items-center justify-center mx-auto px-6 py-3 bg-primary text-white font-semibold rounded-xl text-lg hover:bg-primary-hover transition-transform transform hover:scale-105 duration-300 shadow-lg">
                Tentar Novamente
              </button>
          </div>
       );
    }
    
    if (educationalMessage) {
        return (
            <div className="text-center p-8 bg-surface rounded-2xl shadow-subtle border-2 border-accent animate-fade-in">
                <ShirtIcon className="w-24 h-24 mx-auto text-accent" />
                <h3 className="mt-4 text-xl font-bold text-primary">Que tal expandir seu guarda-roupa?</h3>
                <p className="mt-2 text-text-dark/80 max-w-lg mx-auto">{educationalMessage}</p>
                <button onClick={handleShowConfig} className="mt-6 group flex items-center justify-center mx-auto px-6 py-3 bg-primary text-white font-semibold rounded-xl text-lg hover:bg-primary-hover transition-transform transform hover:scale-105 duration-300 shadow-lg">
                    Tentar Novamente
                </button>
            </div>
        );
    }

    if (generatedLooks.length > 0) {
      return (
        <div className="space-y-8">
            <h2 className="text-2xl font-bold text-text-dark text-center">Looks Sugeridos pela IA</h2>
             {generatedLooks.map((look, index) => (
                <div 
                    key={index} 
                    className="bg-surface p-6 rounded-2xl shadow-medium animate-fade-in grid grid-cols-1 md:grid-cols-2 gap-6 items-start"
                >
                  <div>
                    <img src={look.image} alt={`Look gerado por IA ${index + 1}`} className="w-full object-cover rounded-xl shadow-subtle mb-4" />
                     <button onClick={() => handleSaveLook(look)} className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-secondary text-white font-semibold rounded-lg hover:bg-secondary/80 transition shadow-md">
                        <BookmarkIcon className="w-5 h-5"/>
                        Salvar Look {index + 1}
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* FIX: Made the look title more descriptive by including the style. */}
                    <h3 className="text-xl font-bold text-text-dark">Look {style} {index + 1}</h3>
                    <div className="p-4 rounded-xl bg-subtle-bg">
                        <h4 className="text-base font-bold text-text-dark flex items-center gap-2"><SparklesIcon className="w-5 h-5 text-primary" /> Dica da Estilista</h4>
                        <p className="mt-2 text-sm text-text-dark/80 italic">"{look.commentary}"</p>
                    </div>

                    <div>
                        <h4 className="text-base font-bold text-text-dark mb-3">Peças do Look</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {look.items.map(item => (
                                <div key={item.id} className="text-center">
                                    <img src={item.image} alt={item.name} className="w-full h-32 object-cover rounded-lg shadow-subtle" />
                                    <p className="mt-2 text-xs font-medium text-text-dark/90 truncate">{item.name}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                  </div>
                </div>
            ))}
            <div className="flex justify-center pt-4">
                <button onClick={handleShowConfig} className="w-full max-w-md flex items-center justify-center gap-2 py-3 px-6 bg-primary text-white font-bold rounded-xl text-lg hover:bg-primary-hover transition-transform transform hover:scale-105 duration-300 shadow-lg">
                    <SparklesIcon className="w-6 h-6"/>
                    Criar Outro Look
                </button>
            </div>
        </div>
      );
    }
    
    // Default: Show config panel
    return (
       <div className="bg-surface p-6 rounded-2xl shadow-md space-y-6">
          <div>
              <label className="block text-lg font-semibold text-text-dark mb-3">Qual é a ocasião?</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <OccasionButton icon={<BriefcaseIcon className="w-8 h-8 text-secondary"/>} label="Trabalho" onClick={() => setOccasion('Trabalho')} isActive={occasion === 'Trabalho'} />
                  <OccasionButton icon={<PartyPopperIcon className="w-8 h-8 text-secondary"/>} label="Festa" onClick={() => setOccasion('Festa')} isActive={occasion === 'Festa'} />
                  <OccasionButton icon={<DumbbellIcon className="w-8 h-8 text-secondary"/>} label="Esporte" onClick={() => setOccasion('Esporte')} isActive={occasion === 'Esporte'} />
                  <OccasionButton icon={<SparklesIcon className="w-8 h-8 text-secondary"/>} label="Casual" onClick={() => setOccasion('Casual')} isActive={occasion === 'Casual'} />
              </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label htmlFor="style-select" className="block text-lg font-semibold text-text-dark mb-3">Qual é o seu estilo?</label>
                <select id="style-select" value={style} onChange={e => setStyle(e.target.value)} className="w-full p-3 border border-border-color rounded-md bg-white focus:ring-2 focus:ring-primary/50 focus:border-primary transition">
                    <option>Minimalista / Elegante</option>
                    <option>Maximalista / Fashion</option>
                    <option>Casual / Básico</option>
                    <option>Boho / Hippie Chic</option>
                    <option>Streetwear / Urbano</option>
                    <option>Esportivo</option>
                </select>
            </div>
             <div>
                <label htmlFor="num-looks-select" className="block text-lg font-semibold text-text-dark mb-3">Quantos looks deseja gerar?</label>
                <select 
                    id="num-looks-select" 
                    value={numLooks} 
                    onChange={e => setNumLooks(Number(e.target.value))} 
                    className="w-full p-3 border border-border-color rounded-md bg-white focus:ring-2 focus:ring-primary/50 focus:border-primary transition"
                >
                    <option value={1}>1</option>
                    <option value={2}>2</option>
                    <option value={3}>3</option>
                    <option value={4}>4</option>
                    <option value={5}>5</option>
                </select>
            </div>
          </div>
          <button onClick={() => handleGenerateLook()} disabled={isLoading} className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-primary text-white font-bold rounded-xl text-lg hover:bg-primary-hover transition-transform transform hover:scale-105 duration-300 shadow-lg disabled:bg-secondary/50 disabled:cursor-wait">
              <SparklesIcon className="w-6 h-6"/>
              Gerar Look
          </button>
      </div>
    );
  };

  return (
    <div className="animate-fade-in max-w-5xl mx-auto space-y-8">
      <h2 className="text-3xl font-bold text-text-dark mb-2 text-center">Estilista Pessoal IA</h2>
      <p className="text-center text-text-dark/70 -mt-6 mb-8 max-w-2xl mx-auto">Descreva a ocasião, seu estilo, e deixe nossa Inteligência Artificial montar e visualizar looks incríveis para você.</p>
      
      {renderContent()}
    </div>
  );
};
