import React, { createContext, useContext, useState } from 'react';

const Context = createContext();

export function RootContextProvider({ children }) {
  const [showHeaderSearch, setShowHeaderSearch] = useState(false);
  const context = { showHeaderSearch, setShowHeaderSearch };
  return <Context.Provider value={context} children={children} />;
}

export function useRootContext(endpoints) {
  return useContext(Context);
}
