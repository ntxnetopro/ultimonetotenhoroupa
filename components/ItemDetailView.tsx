
import React, { useState, useEffect } from 'react';
import type { ClothingItem, MainCategory, Style, StylistRequest } from '../types';
import { Categories, Styles } from '../types';
import { SparklesIcon, TrashIcon } from './icons';
import { Modal } from './Modal';

interface ItemDetailViewProps {
  item: ClothingItem;
  onUpdate: (item: ClothingItem) => void;
  onDelete: (id: string) => void;
  onGenerateLooks: (request: StylistRequest) => void;
  onClose: () => void;
}

export const ItemDetailView: React.FC<ItemDetailViewProps> = ({ item, onUpdate, onDelete, onGenerateLooks, onClose }) => {
  const [formData, setFormData] = useState<ClothingItem>(item);
  const [occasion, setOccasion] = useState('Casual');
  const [style, setStyle] = useState('Minimalista / Elegante');
  const [numLooks, setNumLooks] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Ensure form data is updated if the selected item prop changes
  useEffect(() => {
    setFormData(item);
  }, [item]);

  const handleChange = (field: keyof Omit<ClothingItem, 'id' | 'image'>, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCategory = e.target.value as MainCategory;
    setFormData(prev => ({
        ...prev,
        category: newCategory,
        subcategory: '' // Reset subcategory when category changes
    }));
  };
  
  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(formData);
  };

  const handleDelete = () => {
    if (window.confirm(`Tem certeza que deseja excluir "${item.name}"?`)) {
      onDelete(item.id);
    }
  };
  
  const handleGenerate = () => {
    setIsModalOpen(false); // Close modal before navigating
    onGenerateLooks({
      mainPieceId: item.id,
      occasion,
      style,
      numLooks,
    });
  };

  const currentSubcategories = formData.category in Categories ? Categories[formData.category as MainCategory] : [];
  const subcategoryOptions = !currentSubcategories.includes(formData.subcategory)
    ? [formData.subcategory, ...currentSubcategories]
    : currentSubcategories;


  return (
    <div className="animate-fade-in max-w-4xl mx-auto space-y-8">
      <button onClick={onClose} className="flex items-center gap-2 text-primary font-semibold hover:underline mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" /></svg>
        Voltar para o Guarda-Roupa
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column: Image and Look Generator Trigger */}
        <div className="space-y-6">
            <div className="relative">
                <img src={item.image} alt={item.name} className="w-full object-cover rounded-2xl shadow-medium bg-white" />
                 <button 
                    onClick={() => setIsModalOpen(true)}
                    className="absolute bottom-4 right-4 bg-primary text-white text-sm font-semibold px-4 py-2 rounded-lg shadow-md hover:bg-primary-hover transition-transform transform hover:scale-105 flex items-center gap-2"
                >
                    <SparklesIcon className="w-5 h-5"/>
                    Gerar look com essa peça
                </button>
            </div>
        </div>

        {/* Right Column: Details Form */}
        <div className="bg-surface p-6 rounded-2xl shadow-subtle">
           <form onSubmit={handleUpdate} className="space-y-4">
                <div>
                    <label className="block text-sm font-semibold text-text-dark mb-1">Nome</label>
                    <input type="text" value={formData.name} onChange={(e) => handleChange('name', e.target.value)} className="w-full p-2 border border-border-color rounded-md" />
                </div>
                 <div>
                    <label className="block text-sm font-semibold text-text-dark mb-1">Cor</label>
                    <input type="text" value={formData.color} onChange={(e) => handleChange('color', e.target.value)} className="w-full p-2 border border-border-color rounded-md" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-text-dark mb-1">Categoria</label>
                        <select value={formData.category} onChange={handleCategoryChange} className="w-full p-2 border border-border-color rounded-md bg-white">
                             {Object.keys(Categories).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-semibold text-text-dark mb-1">Subcategoria</label>
                        <select value={formData.subcategory} onChange={(e) => handleChange('subcategory', e.target.value)} disabled={!formData.category} className="w-full p-2 border border-border-color rounded-md bg-white disabled:bg-gray-100">
                             <option value="" disabled>Selecione...</option>
                             {subcategoryOptions.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                        </select>
                    </div>
                </div>
                 <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-sm font-semibold text-text-dark mb-1">Estilo</label>
                        <select value={formData.style} onChange={(e) => handleChange('style', e.target.value as Style)} className="w-full p-2 border border-border-color rounded-md bg-white">
                            {Styles.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-text-dark mb-1">Caimento</label>
                        <select value={formData.fit} onChange={(e) => handleChange('fit', e.target.value)} className="w-full p-2 border border-border-color rounded-md bg-white">
                             {["Justo", "Solto", "Oversized", "Estruturado", "Fluído", "Slim", "Regular"].map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-text-dark mb-1">Tecido</label>
                        <input type="text" value={formData.fabric} onChange={(e) => handleChange('fabric', e.target.value)} className="w-full p-2 border border-border-color rounded-md" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-text-dark mb-1">Estações</label>
                        <input type="text" value={Array.isArray(formData.season) ? formData.season.join(', ') : ''} onChange={(e) => handleChange('season', e.target.value.split(',').map(s => s.trim()))} className="w-full p-2 border border-border-color rounded-md" />
                    </div>
                </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-text-dark mb-1">Formalidade (1-10)</label>
                        <select value={formData.formality_level} onChange={(e) => handleChange('formality_level', Number(e.target.value))} className="w-full p-2 border border-border-color rounded-md bg-white">
                            {[...Array(10).keys()].map(i => <option key={i+1} value={i+1}>{i+1}</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-semibold text-text-dark mb-1">Versatilidade (1-10)</label>
                        <select value={formData.versatility} onChange={(e) => handleChange('versatility', Number(e.target.value))} className="w-full p-2 border border-border-color rounded-md bg-white">
                             {[...Array(10).keys()].map(i => <option key={i+1} value={i+1}>{i+1}</option>)}
                        </select>
                    </div>
                </div>

                <div className="pt-4 space-y-3">
                     <button type="submit" className="w-full py-3 px-6 bg-secondary text-white font-semibold rounded-lg hover:bg-secondary/80 transition shadow-md">
                        Salvar Alterações
                    </button>
                    <button type="button" onClick={handleDelete} className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-transparent text-primary font-semibold rounded-lg border-2 border-primary/50 hover:bg-primary hover:text-white transition">
                       <TrashIcon className="w-5 h-5"/> Excluir Peça
                    </button>
                </div>
           </form>
        </div>
      </div>
      
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Criar Look com esta Peça"
      >
        <div className="space-y-4">
            <div>
                <label htmlFor="occasion-select" className="block text-sm font-semibold text-text-dark mb-2">Ocasião</label>
                <select id="occasion-select" value={occasion} onChange={e => setOccasion(e.target.value)} className="w-full p-2 border border-border-color rounded-md bg-white">
                    <option>Casual</option>
                    <option>Trabalho</option>
                    <option>Festa</option>
                    <option>Esporte</option>
                </select>
            </div>
                <div>
                <label htmlFor="style-select-gen" className="block text-sm font-semibold text-text-dark mb-2">Estilo</label>
                <select id="style-select-gen" value={style} onChange={e => setStyle(e.target.value)} className="w-full p-2 border border-border-color rounded-md bg-white">
                    <option>Minimalista / Elegante</option>
                    <option>Maximalista / Fashion</option>
                    <option>Casual / Básico</option>
                    <option>Boho / Hippie Chic</option>
                    <option>Streetwear / Urbano</option>
                    <option>Esportivo</option>
                </select>
            </div>
                <div>
                <label htmlFor="num-looks-select" className="block text-sm font-semibold text-text-dark mb-2">Nº de Looks</label>
                <select id="num-looks-select" value={numLooks} onChange={e => setNumLooks(Number(e.target.value))} className="w-full p-2 border border-border-color rounded-md bg-white">
                    {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
            </div>
            <button onClick={handleGenerate} className="w-full py-3 px-6 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-primary-hover transition">
                Gerar Look
            </button>
        </div>
      </Modal>
    </div>
  );
};
