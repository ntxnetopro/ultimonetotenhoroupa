
export const toBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });

export const urlToBase64 = async (url: string): Promise<string> => {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

export const compressImage = (base64Str: string, maxWidth: number = 800, quality: number = 0.7): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = base64Str;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let { width, height } = img;

            if (width > height) {
                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }
            } else {
                if (height > maxWidth) {
                    width = Math.round((width * maxWidth) / height);
                    height = maxWidth;
                }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                return reject(new Error('Could not get canvas context'));
            }
            ctx.drawImage(img, 0, 0, width, height);
            
            const mimeType = 'image/jpeg';
            const compressedBase64 = canvas.toDataURL(mimeType, quality);
            
            resolve(compressedBase64);
        };
        img.onerror = (error) => {
            console.error("Failed to load image for compression", error);
            // Fallback to original string if compression fails
            resolve(base64Str);
        };
    });
};

// === IndexedDB Service ===

const DB_NAME = 'VirtualClosetDB';
const DB_VERSION = 1;
const CLOTHING_STORE = 'clothingImages';
const LOOKS_STORE = 'lookImages';

let dbInstance: IDBDatabase | null = null;

const getDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      return resolve(dbInstance);
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('IndexedDB error:', request.error);
      reject('Error opening database.');
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(CLOTHING_STORE)) {
        db.createObjectStore(CLOTHING_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(LOOKS_STORE)) {
        db.createObjectStore(LOOKS_STORE, { keyPath: 'id' });
      }
    };
  });
};

type StorableObject = { id: string; image: string };

const saveData = async (storeName: string, data: StorableObject): Promise<void> => {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(data);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

const getData = async (storeName: string, id: string): Promise<string | undefined> => {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(id);
    request.onsuccess = () => {
      resolve(request.result?.image);
    };
    request.onerror = () => reject(request.error);
  });
};

const deleteData = async (storeName: string, id: string): Promise<void> => {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const db = {
  saveClothingItemImage: (id: string, image: string) => saveData(CLOTHING_STORE, { id, image }),
  getClothingItemImage: (id: string) => getData(CLOTHING_STORE, id),
  deleteClothingItemImage: (id: string) => deleteData(CLOTHING_STORE, id),
  saveLookImage: (id: string, image: string) => saveData(LOOKS_STORE, { id, image }),
  getLookImage: (id: string) => getData(LOOKS_STORE, id),
  deleteLookImage: (id: string) => deleteData(LOOKS_STORE, id),
};
