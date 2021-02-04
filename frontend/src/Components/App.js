import React from 'react';

// Styles
import { AppStyled } from './App.styled';
import { ThemeProvider } from 'styled-components';
import GlobalStyles from '../styles/StyledComponents/GlobalStyles.styled';
import defaultTheme from '../styles/themes.styled';

// Router
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import { AGENCY_LIST_SLUG, ABOUT_SLUG, FIND_A_STOP_SLUG } from 'Routes/slugs';

// Layout
import Header from 'Components/Header/Header';
import { LayoutStyled } from './Layout.styled';

// Meta
import AppMeta from 'Meta/AppMeta';
import IconDefs from 'img/icons/IconDefs';
// Context
import { RootContextProvider } from 'Context/root-context';
import rootReducer, { initialState as initialRootState } from 'Context/root-reducer';
import { ChartStateProvider } from 'Context/chart-state';
import chartReducer, { initialState as initialChartState } from 'Context/chart-reducer';

// Routes
import About from 'Components/AboutPage/AboutPage';
import AgencyList from 'Components/AgencyList/AgencyList';
import AgencyData from 'Components/AgencyData/AgencyData';
import FindAStopPage from 'Components/FindAStopPage/FindAStopPage';
import FindAStopResults from 'Components/FindAStopPage/FindAStopResults';

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
              <Switch>
                <Route path={`${AGENCY_LIST_SLUG}/:agencyId`}>
                  <ChartStateProvider reducer={chartReducer} initialState={initialChartState}>
                    <AgencyData />
                  </ChartStateProvider>
                </Route>
                <Route path={AGENCY_LIST_SLUG}>
                  <AgencyList />
                </Route>
                <Route
                  path={FIND_A_STOP_SLUG}
                  render={(props) =>
                    props.location.search ? <FindAStopResults /> : <FindAStopPage />
                  }
                ></Route>
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
