import React from 'react';

// Styles
import { AppStyled } from './App.styled';
import { ThemeProvider } from 'styled-components';
import GlobalStyles from '../styles/StyledComponents/GlobalStyles.styled';
import defaultTheme from '../styles/themes.styled';

// Router
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import {
  AGENCY_LIST_SLUG,
  ABOUT_SLUG,
  FIND_A_STOP_SLUG,
  HOME_SLUG,
  RESOURCES_SLUG,
} from '../Routes/slugs';

// Layout
import Layout from './Layout';

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
import Header from './Header/Header';
import Resources from './ResourcePage/ResourcePage';
// eslint-disable-next-line import/no-named-as-default,import/no-named-as-default-member
import FindAStopResults from './FindAStopResults/FindAStopResults';
import DepartmentSearch from './Elements/DepartmentSearch';
import * as S from './HomePage/HomePage.styled';

// New Charts
import {
  ArcElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from 'chart.js';

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function App() {
  const [showCompare, setShowCompare] = React.useState(false);
  const [agencyId, setAgencyId] = React.useState(null);

  const toggleShowCompare = () => {
    if (!showCompare === false) {
      setAgencyId(null);
    }
    setShowCompare(!showCompare);
  };

  const updateAgencyId = (department) => {
    const departmentId = department !== undefined ? department.id : null;
    setAgencyId(departmentId);
  };

  return (
    <ThemeProvider theme={defaultTheme}>
      <AppMeta />
      <GlobalStyles />
      <AppStyled>
        <BrowserRouter>
          <RootContextProvider reducer={rootReducer} initialState={initialRootState}>
            <Layout>
              <IconDefs />
              <Header />
              <Switch>
                <Route path={`${AGENCY_LIST_SLUG}/:agencyId`}>
                  <div style={{ display: 'flex', height: '100%' }}>
                    <ChartStateProvider reducer={chartReducer} initialState={initialChartState}>
                      <AgencyData showCompare={showCompare} toggleShowCompare={toggleShowCompare} />
                    </ChartStateProvider>
                    {showCompare && agencyId && (
                      <ChartStateProvider reducer={chartReducer} initialState={initialChartState}>
                        <AgencyData
                          agencyId={agencyId}
                          sidebarClosed
                          showCompare={showCompare}
                          toggleShowCompare={updateAgencyId}
                        />
                      </ChartStateProvider>
                    )}
                    {showCompare && !agencyId && (
                      <div style={{ width: '50%', padding: 20 }}>
                        <S.SubHeading>Search for Additional Departments to Compare</S.SubHeading>
                        <DepartmentSearch
                          onChange={(d) => updateAgencyId(d)}
                          placeholder="Search for a police or sheriff's department..."
                        />
                      </div>
                    )}
                  </div>
                </Route>
                <Route path={AGENCY_LIST_SLUG}>
                  <AgencyList />
                </Route>
                <Route
                  path={FIND_A_STOP_SLUG}
                  render={(props) =>
                    props.location.search ? <FindAStopResults /> : <FindAStopPage />
                  }
                />
                <Route exact path={ABOUT_SLUG}>
                  <About />
                </Route>
                <Route exact path={RESOURCES_SLUG}>
                  <Resources />
                </Route>
                <Route path={HOME_SLUG}>
                  <HomePage />
                </Route>
              </Switch>
            </Layout>
          </RootContextProvider>
        </BrowserRouter>
      </AppStyled>
    </ThemeProvider>
  );
}

export default App;
