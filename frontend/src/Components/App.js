import React from 'react';

// Styles
import { AppStyled } from './App.styled';
import { ThemeProvider } from 'styled-components';
import GlobalStyles from '../styles/StyledComponents/GlobalStyles.styled';
import defaultTheme from '../styles/themes.styled';

// Router
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AGENCY_LIST_SLUG, ABOUT_SLUG, FIND_A_STOP_SLUG, HOME_SLUG } from '../Routes/slugs';

// Layout
import { LayoutStyled } from './Layout.styled';

// Meta
import AppMeta from '../Meta/AppMeta';
import IconDefs from '../img/icons/IconDefs';
// Context
import { RootContextProvider } from '../Context/root-context';
import rootReducer, { initialState as initialRootState } from '../Context/root-reducer';
import { ChartStateProvider } from '../Context/chart-state';
import chartReducer, { initialState as initialChartState } from '../Context/chart-reducer';

// Routes
import About from './AboutPage/AboutPage';
import AgencyList from './AgencyList/AgencyList';
import AgencyData from './AgencyData/AgencyData';
import HomePage from './HomePage/HomePage';
import FindAStopPage from './FindAStopPage/FindAStopPage';
import FindAStopResults from './FindAStopPage/FindAStopResults';
import Header from "./Header/Header";

function App() {
  return (
    <ThemeProvider theme={defaultTheme}>
      <AppMeta />
      <GlobalStyles />
      <AppStyled>
        <BrowserRouter>
          <RootContextProvider reducer={rootReducer} initialState={initialRootState}>
            <LayoutStyled>
              <IconDefs />
              <Header />
              <Routes>
                <Route path={`${AGENCY_LIST_SLUG}/:agencyId`}
                   element={
                     <ChartStateProvider reducer={chartReducer} initialState={initialChartState}>
                       <AgencyData/>
                     </ChartStateProvider>
                   }
                />
                <Route path={AGENCY_LIST_SLUG}
                  element={<AgencyList />}
                  />
                  {/* TODO: Figure out how to show stop results using v6 react-router-dom */}
                {/*<Route*/}
                {/*  path={FIND_A_STOP_SLUG}*/}
                {/*  element={<FindAStopResults />}*/}
                {/*/>*/}
                <Route
                  path={FIND_A_STOP_SLUG}
                  element={<FindAStopPage />}
                />
                <Route exact path={ABOUT_SLUG} element={<About />} />
                <Route path={HOME_SLUG} element={<HomePage />} />
              </Routes>
            </LayoutStyled>
          </RootContextProvider>
        </BrowserRouter>
      </AppStyled>
    </ThemeProvider>
  );
}

export default App;
