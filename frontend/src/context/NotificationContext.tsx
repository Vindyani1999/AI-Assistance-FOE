import React, { createContext, useContext, useState, useCallback } from 'react';
import NotificationPopup, { NotificationType } from '../components/NotificationPopup';

interface NotificationState {
  open: boolean;
  type: NotificationType;
  title: string;
  description?: string;
  autoHideDuration?: number;
}

interface NotificationContextProps {
  notify: (
    type: NotificationType,
    title: string,
    description?: string,
    autoHideDuration?: number
  ) => void;
}

const NotificationContext = createContext<NotificationContextProps | undefined>(undefined);

export const useNotification = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotification must be used within NotificationProvider');
  return ctx;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<NotificationState>({
    open: false,
    type: 'info',
    title: '',
    description: '',
    autoHideDuration: 4000,
  });

  const notify = useCallback((type: NotificationType, title: string, description?: string, autoHideDuration = 4000) => {
    setState({ open: true, type, title, description, autoHideDuration });
  }, []);

  const handleClose = useCallback(() => {
    setState((prev) => ({ ...prev, open: false }));
  }, []);

  return (
    <NotificationContext.Provider value={{ notify }}>
      {children}
      <NotificationPopup
        open={state.open}
        type={state.type}
        title={state.title}
        description={state.description}
        onClose={handleClose}
        // autoHideDuration={state.autoHideDuration}
      />
    </NotificationContext.Provider>
  );
};
