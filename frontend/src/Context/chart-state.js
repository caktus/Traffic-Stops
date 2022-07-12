import React, { createContext, useReducer, useContext } from 'react';
import useYearSet from '../Hooks/useYearSet';

const Context = createContext();

export function ChartStateProvider({ reducer, initialState = {}, children }) {
  const [yearRange, yearSet] = useYearSet();
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <Context.Provider value={[{ ...state, yearRange, yearSet }, dispatch]} children={children} />
  );
}

export function useChartState(endpoints) {
  return useContext(Context);
}
