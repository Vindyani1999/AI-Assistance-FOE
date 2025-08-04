import React, { createContext, useContext, useState, ReactNode } from 'react';

interface GlobalLoaderContextType {
  loading: boolean;
  showLoader: () => void;
  hideLoader: () => void;
}

const GlobalLoaderContext = createContext<GlobalLoaderContextType | undefined>(undefined);

export const useGlobalLoader = () => {
  const context = useContext(GlobalLoaderContext);
  if (!context) {
    throw new Error('useGlobalLoader must be used within a GlobalLoaderProvider');
  }
  return context;
};

export const GlobalLoaderProvider = ({ children }: { children: ReactNode }) => {
  const [loading, setLoading] = useState(false);

  const showLoader = () => setLoading(true);
  const hideLoader = () => setLoading(false);

  return (
    <GlobalLoaderContext.Provider value={{ loading, showLoader, hideLoader }}>
      {children}
    </GlobalLoaderContext.Provider>
  );
};
