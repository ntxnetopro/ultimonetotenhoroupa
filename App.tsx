
import React, { useState, useEffect } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import type { ClothingItem, View, SavedLook, StylistRequest } from './types';
import { Header } from './components/Header';
import { WelcomeView } from './components/WelcomeView';
import { WardrobeView } from './components/WardrobeView';
import { AddItemsView } from './components/AddItemsView';
import { PersonalStylistView } from './components/PersonalStylistView';
import { SavedLooksView } from './components/SavedLooksView';
import { ProfileView } from './components/ProfileView';
import { ItemDetailView } from './components/ItemDetailView';
import { BottomNav } from './components/BottomNav';
import { ShirtIcon } from './components/icons';
import { db } from './utils/fileUtils';
import { Spinner } from './components/Spinner';

type ClothingItemData = Omit<ClothingItem, 'image'>;
type SavedLookData = Omit<SavedLook, 'image'>;


const EmptyStatePrompt: React.FC<{
  icon: React.ReactNode;
  title: string;
  message: string;
  actionText: string;
  onAction: () => void;
}> = ({ icon, title, message, actionText, onAction }) => {
  return (
    <div className="text-center py-20 bg-surface rounded-2xl shadow-subtle animate-fade-in">
      {icon}
      <h3 className="mt-4 text-xl font-medium text-text-dark">{title}</h3>
      <p className="mt-2 text-text-dark/70 max-w-md mx-auto">{message}</p>
      <button
        onClick={onAction}
        className="mt-6 group flex items-center justify-center mx-auto px-6 py-3 bg-primary text-white font-semibold rounded-xl text-lg hover:bg-primary-hover transition-transform transform hover:scale-105 duration-300 shadow-lg"
      >
        {actionText}
      </button>
    </div>
  );
};


export default function App() {
  const [view, setView] = useState<View>('welcome');
  const [wardrobeData, setWardrobeData] = useLocalStorage<ClothingItemData[]>('wardrobe', []);
  const [savedLooksData, setSavedLooksData] = useLocalStorage<SavedLookData[]>('savedLooks', []);

  const [wardrobe, setWardrobe] = useState<ClothingItem[]>([]);
  const [savedLooks, setSavedLooks] = useState<SavedLook[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<ClothingItem | null>(null);
  const [stylistRequest, setStylistRequest] = useState<StylistRequest | null>(null);


  useEffect(() => {
    const loadData = async () => {
      setIsDataLoading(true);
      try {
        const loadedWardrobe = await Promise.all(
          wardrobeData.map(async (itemData) => {
            const image = await db.getClothingItemImage(itemData.id);
            return { ...itemData, image: image || '' };
          })
        );
        const loadedLooks = await Promise.all(
          savedLooksData.map(async (lookData) => {
            const image = await db.getLookImage(lookData.id);
            return { ...lookData, image: image || '' };
          })
        );

        setWardrobe(loadedWardrobe.filter(item => item.image));
        setSavedLooks(loadedLooks.filter(look => look.image));
      } catch (error) {
        console.error("Failed to load data from IndexedDB", error);
        // In a real app, you might want to show an error message to the user
      } finally {
        setIsDataLoading(false);
      }
    };

    loadData();
  }, [wardrobeData, savedLooksData]);


  const handleAddItems = async (newItems: Omit<ClothingItem, 'id'>[]) => {
    const itemsToSave: ClothingItem[] = newItems.map((item, index) => ({
      ...item,
      id: `item-${Date.now()}-${index}`
    }));
    
    await Promise.all(itemsToSave.map(item => db.saveClothingItemImage(item.id, item.image)));
    
    const itemsData = itemsToSave.map(({ image, ...data }) => data);
    setWardrobeData(prev => [...itemsData, ...prev]);
    
    setView('wardrobe');
  };

  const handleUpdateItem = (updatedItem: ClothingItem) => {
    const { image, ...itemData } = updatedItem;
    setWardrobeData(prev => prev.map(item => item.id === itemData.id ? itemData : item));
    setSelectedItem(updatedItem); // Update selected item state to reflect changes
    alert('Peça atualizada com sucesso!');
  };

  const handleDeleteItem = async (id: string) => {
    await db.deleteClothingItemImage(id);
    setWardrobeData(prev => prev.filter(item => item.id !== id));
    if (selectedItem && selectedItem.id === id) {
      setSelectedItem(null);
      setView('wardrobe');
    }
  };
  
  const handleSelectItem = (item: ClothingItem) => {
    setSelectedItem(item);
    setView('item-detail');
  };

  const handleSaveLook = async (look: Omit<SavedLook, 'id'>) => {
    const newLook: SavedLook = {
      ...look,
      id: `look-${Date.now()}`
    };
    
    await db.saveLookImage(newLook.id, newLook.image);
    
    const { image, ...lookData } = newLook;
    setSavedLooksData(prev => [lookData, ...prev]);

    alert('Look salvo com sucesso!');
  };

  const handleDeleteLook = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este look?')) {
      await db.deleteLookImage(id);
      setSavedLooksData(prev => prev.filter(look => look.id !== id));
    }
  };

  const handleGenerateLookWithPiece = (request: StylistRequest) => {
    setStylistRequest(request);
    setView('stylist');
  };


  const renderView = () => {
     if (isDataLoading && view !== 'welcome') {
      return (
        <div className="flex justify-center items-center py-20">
          <div className="text-center">
            <Spinner />
            <p className="mt-4 font-semibold text-primary">Carregando seu guarda-roupa...</p>
          </div>
        </div>
      );
    }
    
    if ((view === 'stylist' || view === 'saved-looks') && wardrobe.length === 0) {
      return (
        <EmptyStatePrompt
          icon={<ShirtIcon className="w-24 h-24 mx-auto text-accent" />}
          title="Seu guarda-roupa está vazio!"
          message="Você precisa adicionar algumas peças ao seu guarda-roupa antes de poder criar ou ver seus looks."
          actionText="Adicionar Peças"
          onAction={() => setView('add-items')}
        />
      );
    }

    if (view === 'stylist' && wardrobe.length > 0 && wardrobe.length < 3) {
      return (
        <EmptyStatePrompt
          icon={<ShirtIcon className="w-24 h-24 mx-auto text-accent" />}
          title="Quase lá!"
          message={`Você precisa de pelo menos 3 peças para a IA criar looks. Você tem ${wardrobe.length}.`}
          actionText="Adicionar Mais Peças"
          onAction={() => setView('add-items')}
        />
      );
    }

    switch (view) {
      case 'wardrobe':
        return <WardrobeView wardrobe={wardrobe} onSelectItem={handleSelectItem} setView={setView} />;
      case 'add-items':
        return <AddItemsView onAddItems={handleAddItems} onCancel={() => setView('wardrobe')} />;
      case 'stylist':
        return <PersonalStylistView wardrobe={wardrobe} onSaveLook={handleSaveLook} initialRequest={stylistRequest} onRequestConsumed={() => setStylistRequest(null)} />;
      case 'saved-looks':
        return <SavedLooksView looks={savedLooks} wardrobe={wardrobe} onDeleteLook={handleDeleteLook} />;
      case 'profile':
        return <ProfileView />;
      case 'item-detail':
        if (!selectedItem) {
          setView('wardrobe'); // Fallback if no item is selected
          return null;
        }
        return <ItemDetailView item={selectedItem} onUpdate={handleUpdateItem} onDelete={handleDeleteItem} onGenerateLooks={handleGenerateLookWithPiece} onClose={() => setView('wardrobe')} />;
      case 'welcome':
      default:
        return <WelcomeView onGetStarted={() => setView('wardrobe')} />;
    }
  };

  return (
    <div className="bg-background min-h-screen font-sans">
      {view !== 'welcome' && <Header view={view} setView={setView} />}
      <main className="container mx-auto px-4 sm:px-6 md:px-8 pt-20 pb-28">
        {renderView()}
      </main>
      {view !== 'welcome' && <BottomNav view={view} setView={setView} />}
    </div>
  );
}
