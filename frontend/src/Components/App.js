import React from 'react';

// Styles
import { AppStyled } from './App.styled';
import { ThemeProvider } from 'styled-components';
import GlobalStyles from '../styles/GlobalStyles.styled';
import themes from '../styles/themes.styled';

// Router
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import { AGENCY_SEARCH, ABOUT_SLUG } from 'Routes/slugs';

// Layout
import Header from 'Components/Header/Header';
import { LayoutStyled } from './Layout.styled';

// Routes
import About from 'Components/AboutPage/AboutPage';
import AgencySearch from 'Components/AgencySearch/AgencySearch';
import AgencyData from 'Components/AgencyData/AgencyData';

function App() {
  return (
    <ThemeProvider theme={themes.ForwardJusticeLight}>
      <GlobalStyles />
      <AppStyled>
        <BrowserRouter>
          <LayoutStyled>
            <Header />
            <Switch>
              <Route path={`${AGENCY_SEARCH}/:agencyId`}>
                <AgencyData />
              </Route>
              <Route path={AGENCY_SEARCH}>
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

// / = LandingPage --> click "get started"

// /data = with all the charts --> sidebar shows up with charts
//    /data/:chartId-type = specific chart, sidebar

// /about = about
