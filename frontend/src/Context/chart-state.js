import React, { createContext, useReducer, useContext } from 'react';

const Context = createContext();

export function ChartStateProvider({ reducer, initialState = {}, children }) {
  const value = useReducer(reducer, initialState);
  return <Context.Provider value={value} children={children} />;
}

export function useChartState(endpoints) {
  return useContext(Context);
}
