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

  const showLoader = React.useCallback(() => setLoading(true), []);
  const hideLoader = React.useCallback(() => setLoading(false), []);
  const value = React.useMemo(() => ({ loading, showLoader, hideLoader }), [loading, showLoader, hideLoader]);

  return (
    <GlobalLoaderContext.Provider value={value}>
      {children}
    </GlobalLoaderContext.Provider>
  );
};
