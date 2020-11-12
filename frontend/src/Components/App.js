import React from 'react';

// Styles
import { AppStyled } from './App.styled';
import { ThemeProvider } from 'styled-components';
import GlobalStyles from '../styles/GlobalStyles.styled';
import themes from '../styles/themes.styled';

// Router
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import { AGENCY_SEARCH_SLUG, ABOUT_SLUG } from 'Routes/slugs';

// Layout
import Header from 'Components/Header/Header';
import { LayoutStyled } from './Layout.styled';

// Meta
import AppMeta from 'Meta/AppMeta';
import IconDefs from 'img/icons/IconDefs';

// Routes
import About from 'Components/AboutPage/AboutPage';
import AgencySearch from 'Components/AgencySearch/AgencySearch';
import AgencyData from 'Components/AgencyData/AgencyData';

function App() {
  return (
    <ThemeProvider theme={themes.ForwardJusticeLight}>
      <AppMeta />
      <GlobalStyles />
      <AppStyled>
        <BrowserRouter>
          <LayoutStyled>
            <IconDefs />
            <Header />
            <Switch>
              <Route path={`${AGENCY_SEARCH_SLUG}/:agencyId`}>
                <AgencyData />
              </Route>
              <Route path={AGENCY_SEARCH_SLUG}>
                <AgencySearch />
              </Route>
              <Route exact path={ABOUT_SLUG}>
                <About />
              </Route>
            </Switch>
          </LayoutStyled>
        </BrowserRouter>
      </AppStyled>
    </ThemeProvider>
  );
}

export default App;
