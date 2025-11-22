
import React, { createContext, useState, useContext, ReactNode } from 'react';
import { AppView } from '../types';

interface NavigationState {
  view: AppView;
}

interface NavigationContextType {
  navigation: NavigationState;
  navigateTo: (state: NavigationState) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [navigation, setNavigation] = useState<NavigationState>({ view: 'hierarchy' });

  const navigateTo = (state: NavigationState) => {
    setNavigation(state);
  };

  return (
    <NavigationContext.Provider value={{ navigation, navigateTo }}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};