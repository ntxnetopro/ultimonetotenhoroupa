import { useState, useEffect } from 'react';

export const useLocalStorage = <T,>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (!item) {
        return initialValue;
      }
      
      const parsedItem = JSON.parse(item);

      // Defensively check for and clear old data format that included images directly.
      // This prevents quota errors for users migrating from an older version of the app.
      if (Array.isArray(parsedItem) && parsedItem.length > 0 && parsedItem[0].image) {
          console.warn(`Old data format with images found in localStorage for key "${key}". Clearing it.`);
          window.localStorage.removeItem(key);
          return initialValue;
      }
      
      return parsedItem;
    } catch (error) {
      console.error(`Error reading or parsing localStorage key “${key}”, resetting to initial value.`, error);
      // If parsing fails, the data is likely corrupt or malformed. Clear it.
      window.localStorage.removeItem(key);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      const valueToStore =
        typeof storedValue === 'function'
          ? storedValue(storedValue)
          : storedValue;
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      // This catch block is important for the "quota exceeded" error on write.
      console.error(`Error setting localStorage key “${key}”. You may be out of space.`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
};
