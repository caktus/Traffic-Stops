import React from 'react';

// Styles
import { AppStyled } from './App.styled';
import { ThemeProvider } from 'styled-components';
import GlobalStyles from '../styles/GlobalStyles.styled';
import defaultTheme from '../styles/themes.styled';

// Router
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import { AGENCY_LIST_SLUG, ABOUT_SLUG, FIND_A_STOP_SLUG } from 'Routes/slugs';

// Layout
import Header from 'Components/Header/Header';
import { LayoutStyled } from './Layout.styled';

// Context
import { RootContextProvider } from 'Context/root-context';
import rootReducer, { initialState } from 'Context/root-reducer';

// Routes
import About from 'Components/AboutPage/AboutPage';
import AgencyList from 'Components/AgencyList/AgencyList';
import AgencyData from 'Components/AgencyData/AgencyData';
import FindAStopPage from 'Components/FindAStopPage/FindAStopPage';

function App() {
  return (
    <ThemeProvider theme={defaultTheme}>
      <GlobalStyles />
      <AppStyled>
        <BrowserRouter>
          <RootContextProvider reducer={rootReducer} initialState={initialState}>
            <LayoutStyled>
              <Header />
              <Switch>
                <Route path={`${AGENCY_LIST_SLUG}/:agencyId`}>
                  <AgencyData />
                </Route>
                <Route path={AGENCY_LIST_SLUG}>
                  <AgencyList />
                </Route>
                <Route path={FIND_A_STOP_SLUG}>
                  <FindAStopPage />
                </Route>
                <Route exact path={ABOUT_SLUG}>
                  <About />
                </Route>
              </Switch>
            </LayoutStyled>
          </RootContextProvider>
        </BrowserRouter>
      </AppStyled>
    </ThemeProvider>
  );
}

export default App;
