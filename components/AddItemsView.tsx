
import React, { useState } from 'react';
import type { ClothingItem, MainCategory, Style } from '../types';
import { Categories, Styles } from '../types';
import { FileUpload } from './FileUpload';
import { analyzeClothingItem, removeImageBackground } from '../services/geminiService';
import { toBase64, compressImage } from '../utils/fileUtils';
import { Spinner } from './Spinner';
import { XIcon, UploadIcon } from './icons';


interface AnalyzedItem extends Omit<ClothingItem, 'id'> {
  tempId: number;
  status: 'pending' | 'analyzing' | 'done' | 'error';
  errorMessage?: string;
}

interface AddItemsViewProps {
  onAddItems: (items: Omit<ClothingItem, 'id'>[]) => void;
  onCancel: () => void;
}

const ItemForm: React.FC<{
  item: AnalyzedItem;
  onUpdate: (tempId: number, field: keyof Omit<AnalyzedItem, 'tempId' | 'status' | 'errorMessage'>, value: any) => void;
  onRemove: (tempId: number) => void;
}> = ({ item, onUpdate, onRemove }) => {
  
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCategory = e.target.value as MainCategory;
    onUpdate(item.tempId, 'category', newCategory);
    onUpdate(item.tempId, 'subcategory', ''); 
  };
  
  const currentSubcategories = item.category in Categories ? Categories[item.category as MainCategory] : [];
  const subcategoryOptions = !currentSubcategories.includes(item.subcategory)
    ? [item.subcategory, ...currentSubcategories]
    : currentSubcategories;


  return (
    <div className="bg-subtle-bg p-4 rounded-xl space-y-4 border border-border-color/50 relative">
      <button onClick={() => onRemove(item.tempId)} className="absolute -top-2 -right-2 bg-primary text-white rounded-full p-1 hover:bg-primary-hover">
        <XIcon className="w-4 h-4" />
      </button>
      <div className="flex gap-4">
        <img src={item.image} alt={item.name} className="w-24 h-24 object-cover rounded-lg bg-white" />
        <div className="flex-grow space-y-2">
            <input
                type="text"
                value={item.name}
                onChange={(e) => onUpdate(item.tempId, 'name', e.target.value)}
                placeholder="Nome da Peça"
                className="w-full p-2 border border-border-color rounded-md"
            />
            <input
                type="text"
                value={item.color}
                onChange={(e) => onUpdate(item.tempId, 'color', e.target.value)}
                placeholder="Cor"
                className="w-full p-2 border border-border-color rounded-md"
            />
        </div>
      </div>
       <div className="grid grid-cols-2 gap-4">
            <select
                value={item.category}
                onChange={handleCategoryChange}
                className="w-full p-2 border border-border-color rounded-md bg-white"
            >
                <option value="" disabled>Categoria...</option>
                {Object.keys(Categories).map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            <select
                value={item.subcategory}
                onChange={(e) => onUpdate(item.tempId, 'subcategory', e.target.value)}
                disabled={!item.category}
                className="w-full p-2 border border-border-color rounded-md bg-white disabled:bg-gray-100"
            >
                <option value="" disabled>Subcategoria...</option>
                {subcategoryOptions.map(sub => <option key={sub} value={sub}>{sub}</option>)}
            </select>
            <select
                value={item.style}
                onChange={(e) => onUpdate(item.tempId, 'style', e.target.value)}
                className="w-full p-2 border border-border-color rounded-md bg-white"
            >
                <option value="" disabled>Estilo...</option>
                {Styles.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
             <select
                value={item.fit}
                onChange={(e) => onUpdate(item.tempId, 'fit', e.target.value)}
                className="w-full p-2 border border-border-color rounded-md bg-white"
            >
                <option value="" disabled>Caimento...</option>
                {["Justo", "Solto", "Oversized", "Estruturado", "Fluído", "Slim", "Regular"].map(f => <option key={f} value={f}>{f}</option>)}
            </select>
       </div>
       <div className="grid grid-cols-2 gap-4">
            <input
                type="text"
                value={item.fabric}
                onChange={(e) => onUpdate(item.tempId, 'fabric', e.target.value)}
                placeholder="Tecido"
                className="w-full p-2 border border-border-color rounded-md"
            />
             <input
                type="text"
                value={Array.isArray(item.season) ? item.season.join(', ') : ''}
                onChange={(e) => onUpdate(item.tempId, 'season', e.target.value.split(',').map(s => s.trim()))}
                placeholder="Estações (ex: Verão, Outono)"
                className="w-full p-2 border border-border-color rounded-md"
            />
       </div>
       <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col">
                <label className="text-xs text-text-dark/70 mb-1">Formalidade (1-10)</label>
                <select
                    value={item.formality_level}
                    onChange={(e) => onUpdate(item.tempId, 'formality_level', Number(e.target.value))}
                    className="w-full p-2 border border-border-color rounded-md bg-white"
                >
                     <option value={0} disabled>Nível...</option>
                    {[...Array(10).keys()].map(i => <option key={i+1} value={i+1}>{i+1}</option>)}
                </select>
            </div>
            <div className="flex flex-col">
                <label className="text-xs text-text-dark/70 mb-1">Versatilidade (1-10)</label>
                <select
                    value={item.versatility}
                    onChange={(e) => onUpdate(item.tempId, 'versatility', Number(e.target.value))}
                    className="w-full p-2 border border-border-color rounded-md bg-white"
                >
                     <option value={0} disabled>Nível...</option>
                    {[...Array(10).keys()].map(i => <option key={i+1} value={i+1}>{i+1}</option>)}
                </select>
            </div>
       </div>
    </div>
  );
};


export const AddItemsView: React.FC<AddItemsViewProps> = ({ onAddItems, onCancel }) => {
  const [itemsToSave, setItemsToSave] = useState<AnalyzedItem[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisMessage, setAnalysisMessage] = useState('');
  
  const handleFilesUpload = async (files: FileList) => {
    if (files.length > 80) {
      alert('Você pode enviar no máximo 80 peças de uma vez.');
      return;
    }
    
    setIsAnalyzing(true);
    setAnalysisMessage('Preparando imagens...');
    setItemsToSave([]);

    const fileArray = Array.from(files);
    
    const initialItems: AnalyzedItem[] = fileArray.map((_, index) => ({
      tempId: Date.now() + index,
      name: '', category: '' as MainCategory, subcategory: '', color: '', image: '', style: '' as Style,
      fabric: '', fit: '', formality_level: 0, season: [], versatility: 0,
      status: 'pending',
    }));
    setItemsToSave(initialItems);

    await Promise.all(fileArray.map(async (file, index) => {
      try {
        const base64 = await toBase64(file);
        const compressedBase64 = await compressImage(base64, 600);
        
        setItemsToSave(prev => prev.map(item => item.tempId === initialItems[index].tempId ? {...item, status: 'analyzing'} : item));
        
        setAnalysisMessage(`Removendo fundo da imagem ${index + 1} de ${fileArray.length}...`);
        const noBgBase64 = await removeImageBackground(compressedBase64);

        setItemsToSave(prev => prev.map(item => item.tempId === initialItems[index].tempId ? {...item, image: noBgBase64} : item));

        setAnalysisMessage(`Analisando peça ${index + 1} de ${fileArray.length}...`);
        const analysis = await analyzeClothingItem(noBgBase64);

        setItemsToSave(prev => prev.map(item =>
          item.tempId === initialItems[index].tempId
            ? { ...item, ...analysis, status: 'done' }
            : item
        ));
      } catch (error) {
        console.error("Failed to process item:", error);
        setItemsToSave(prev => prev.map(item =>
          item.tempId === initialItems[index].tempId
            ? { ...item, status: 'error', errorMessage: 'Processamento falhou' }
            : item
        ));
      }
    }));
    
    setIsAnalyzing(false);
    setAnalysisMessage('');
  };
  
  const handleUpdateItem = (tempId: number, field: keyof Omit<AnalyzedItem, 'tempId' | 'status' | 'errorMessage'>, value: any) => {
      setItemsToSave(prev => prev.map(item => item.tempId === tempId ? {...item, [field]: value} : item));
  };
  
  const handleRemoveItem = (tempId: number) => {
      setItemsToSave(prev => prev.filter(item => item.tempId !== tempId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = itemsToSave.filter(item => 
        item.name && item.category && item.subcategory && item.color && item.image && item.style &&
        item.fabric && item.fit && item.formality_level > 0 && Array.isArray(item.season) && item.season.length > 0 && item.versatility > 0
    );
    onAddItems(validItems);
  };

  const isFormValid = itemsToSave.length > 0 && itemsToSave.every(item => 
    item.name && item.category && item.subcategory && item.color && item.image && item.style &&
    item.fabric && item.fit && item.formality_level > 0 && Array.isArray(item.season) && item.season.length > 0 && item.versatility > 0
  );

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold text-text-dark mb-6">Adicionar Novas Peças</h2>

      {itemsToSave.length === 0 && !isAnalyzing && (
        <div className="bg-surface p-8 rounded-2xl shadow-medium">
          <FileUpload onFilesUpload={handleFilesUpload} multiple={true}>
            <div className="w-full min-h-[16rem] border-2 border-dashed border-accent rounded-lg flex flex-col items-center justify-center text-secondary hover:bg-subtle-bg transition-colors p-6 text-center cursor-pointer">
                <UploadIcon className="w-12 h-12 text-accent mb-3" />
                <p className="text-lg font-semibold text-text-dark">Arraste até 80 imagens ou clique</p>
                <p className="text-sm text-text-dark/70 mb-4">para começar a adicionar suas peças.</p>

                <div className="text-xs text-text-dark/70 text-left max-w-sm mx-auto bg-accent/10 p-3 rounded-lg">
                    <p className="font-bold text-primary/80 mb-1 text-center">Dicas para fotos perfeitas:</p>
                    <ul className="list-disc list-inside space-y-0.5">
                        <li>Estique a peça sobre uma superfície plana (cama, chão).</li>
                        <li>Use um fundo de cor sólida que contraste com a roupa.</li>
                        <li>Garanta boa iluminação, sem sombras fortes.</li>
                        <li>Fotografe a peça inteira, sem cortar partes.</li>
                    </ul>
                </div>
            </div>
          </FileUpload>
        </div>
      )}
      
      {isAnalyzing && (
         <div className="bg-surface p-8 rounded-2xl shadow-medium text-center">
            <Spinner />
            <p className="mt-4 font-semibold text-primary">{analysisMessage || 'Analisando suas peças com IA...'}</p>
            <p className="text-text-dark/70">Aguarde um momento.</p>
         </div>
      )}

      {itemsToSave.length > 0 && !isAnalyzing && (
         <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
                 {itemsToSave.map(item => (
                    <ItemForm key={item.tempId} item={item} onUpdate={handleUpdateItem} onRemove={handleRemoveItem}/>
                 ))}
            </div>
            
            <div className="sticky bottom-24 bg-surface/80 backdrop-blur-md p-4 rounded-xl shadow-medium flex gap-4">
              <button
                type="button"
                onClick={onCancel}
                className="w-full py-3 px-6 bg-surface text-text-dark font-semibold rounded-lg border border-border-color hover:bg-subtle-bg transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!isFormValid || isAnalyzing}
                className="w-full py-3 px-6 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-primary-hover transition-all disabled:bg-secondary/50 disabled:cursor-not-allowed"
              >
                Salvar {itemsToSave.length} Peça{itemsToSave.length > 1 ? 's' : ''}
              </button>
            </div>
         </form>
      )}
    </div>
  );
};
