// Mock implementation of @react-native-async-storage/async-storage for browser compatibility

const AsyncStorage = {
  getItem: async (key) => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(key);
    }
    return null;
  },
  
  setItem: async (key, value) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, value);
    }
  },
  
  removeItem: async (key) => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(key);
    }
  },
  
  clear: async () => {
    if (typeof window !== 'undefined') {
      localStorage.clear();
    }
  },
  
  getAllKeys: async () => {
    if (typeof window !== 'undefined') {
      return Object.keys(localStorage);
    }
    return [];
  },
  
  multiGet: async (keys) => {
    if (typeof window !== 'undefined') {
      return keys.map(key => [key, localStorage.getItem(key)]);
    }
    return [];
  },
  
  multiSet: async (keyValuePairs) => {
    if (typeof window !== 'undefined') {
      keyValuePairs.forEach(([key, value]) => {
        localStorage.setItem(key, value);
      });
    }
  },
  
  multiRemove: async (keys) => {
    if (typeof window !== 'undefined') {
      keys.forEach(key => {
        localStorage.removeItem(key);
      });
    }
  }
};

export default AsyncStorage;