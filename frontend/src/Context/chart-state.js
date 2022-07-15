import React, { createContext, useReducer, useContext } from 'react';
import useYearSet from '../Hooks/useYearSet';

const Context = createContext();

export function ChartStateProvider({ reducer, initialState = {}, children }) {
  const [yearRange, yearSet] = useYearSet();
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    // eslint-disable-next-line react/no-children-prop,react/jsx-no-constructed-context-values
    <Context.Provider value={[{ ...state, yearRange, yearSet }, dispatch]} children={children} />
  );
}

export function useChartState() {
  return useContext(Context);
}
