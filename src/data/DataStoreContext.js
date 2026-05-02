import React, { createContext, useContext } from 'react';
import { dataStore } from './DataStore';

export const DataContext = createContext(dataStore);

export const DataProvider = ({ children }) => (
  <DataContext.Provider value={dataStore}>{children}</DataContext.Provider>
);

export const useStore = () => useContext(DataContext);

export const useDataStore = () => useContext(DataContext);
