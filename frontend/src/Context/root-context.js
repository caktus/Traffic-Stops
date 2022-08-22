import React, { createContext, useReducer, useContext } from 'react';

const Context = createContext();

export function RootContextProvider({ reducer, initialState = {}, children }) {
  const value = useReducer(reducer, initialState);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useRootContext() {
  return useContext(Context);
}
