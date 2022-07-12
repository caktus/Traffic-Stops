import React, { useEffect } from 'react';
import * as S from './HomePage.styled';
import { useTheme } from 'styled-components';

// Routing
import { useNavigate } from 'react-router-dom';

// Assets
import SplashImage from '../../img/nc-copwatch-transparent--tayetheartist.png';

// Contants
import { AGENCY_LIST_SLUG, FIND_A_STOP_SLUG } from '../../Routes/slugs';

// AJAX
import axios from '../../Services/Axios';
import { STATE_FACTS_URL } from '../../Services/endpoints';

// State
import fetchReducer, {
  initialState,
  FETCH_START,
  FETCH_SUCCESS,
  FETCH_FAILURE,
} from '../../Context/fetch-reducer';

// Elements
import { P, SIZES, WEIGHTS } from '../../styles/StyledComponents/Typography';
import DepartmentSearch from '../Elements/DepartmentSearch';
import { ICONS } from '../../img/icons/Icon';
import FjButton from '../Elements/Button';
import CardSkeleton from '../Elements/Skeletons/CardSkeleton';

function HomePage() {
  const [{ data, loading, errors }, dispatch] = React.useReducer(fetchReducer, initialState);
  const history = useNavigate();
  const theme = useTheme();

  useEffect(() => {
    async function _fetchMetaData() {
      dispatch({ type: FETCH_START });
      try {
        const { data } = await axios.get(STATE_FACTS_URL);
        const ncData = data.find((s) => s.state_key === 'nc');
        dispatch({ type: FETCH_SUCCESS, payload: ncData });
      } catch (e) {
        dispatch({ type: FETCH_FAILURE, payload: e });
        console.warn('error: ', e);
      }
    }
    _fetchMetaData();
  }, []);

  return (
    <S.HomePage>
      <S.Heading>
        <S.Logo white />
        <S.SubTitle>
          a project of{' '}
          <S.SubTitleLink
            href="https://www.forwardjustice.org"
            rel="noopener noreferrer"
            target="_blank"
          >
            Forward Justice
          </S.SubTitleLink>
        </S.SubTitle>
      </S.Heading>

      <S.MainContent>
        <S.About>
          <S.AboutImage src={SplashImage} />
          <S.AboutContent>
            <S.AboutHeading>About the Data</S.AboutHeading>
            {loading && <CardSkeleton />}
            {data && (
              <>
                <S.AboutSubSection>
                  <S.AboutSubTitle size={SIZES[0]}>showing</S.AboutSubTitle>
                  <P>
                    <S.Datum>{Number(data.total_stops).toLocaleString()}</S.Datum> stops
                  </P>
                  <P>
                    <S.Datum>{Number(data.total_searches).toLocaleString()}</S.Datum> searches
                  </P>
                </S.AboutSubSection>
                <S.AboutSubSection>
                  <S.AboutSubTitle>across</S.AboutSubTitle>
                  <P>
                    <S.Datum>{Number(data.total_agencies).toLocaleString()}</S.Datum>
                    police and sheriff's departments
                  </P>
                </S.AboutSubSection>
                <S.AboutSubSection>
                  <S.AboutSubTitle>from</S.AboutSubTitle>
                  <P weight={WEIGHTS[1]}>
                    {data.start_date} - {data.end_date}
                  </P>
                </S.AboutSubSection>
                <S.AboutExtra>
                  All data comes directly from{' '}
                  <S.FormLink
                    href="https://fbaum.unc.edu/TrafficStops/SBI-122-form.pdf"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    Form SBI-122
                    <S.FormIcon
                      icon={ICONS.externalLink}
                      fill={theme.colors.primaryDark}
                      height={24}
                      width={24}
                    />
                  </S.FormLink>{' '}
                  reports filled out by NC law enforcement officers
                </S.AboutExtra>
              </>
            )}
            {errors.length > 0 && (
              <S.FetchError>
                There was an error fetching meta-data. Refresh to try again.
              </S.FetchError>
            )}
          </S.AboutContent>
        </S.About>

        <S.SubContent>
          <S.DeptCTA>
            <S.SubHeading>View Stop + Search Data by Department</S.SubHeading>
            <P size={SIZES[1]}>Choose a police or sheriff’s department to see:</P>
            <P size={SIZES[1]}>- Stops and search rates over time</P>
            <P size={SIZES[1]}>- Stops and searches broken down by race / ethnicity</P>
            <P size={SIZES[1]}>
              - Use of force during stops and how frequently contraband was found
            </P>
            <S.SearchWrapper>
              <DepartmentSearch
                showIndexList
                navigateOnSelect
                placeholder="Search for a police or sheriff's department..."
              />
            </S.SearchWrapper>
            <S.ViewAllDepts onClick={() => history.push(AGENCY_LIST_SLUG)}>
              View all departments
              <S.ViewAllIcon
                icon={ICONS.arrowRight}
                fill={theme.colors.primaryDark}
                height={25}
                width={25}
              />
            </S.ViewAllDepts>
          </S.DeptCTA>
          <S.StopCTA>
            <S.SubHeading>Find a Stop</S.SubHeading>
            <P size={SIZES[1]}>
              Have you or someone you know been subjected to an unfair stop or search?
            </P>
            <P size={SIZES[1]}>
              Enter the stop information to view all data associated with that particular officer.
            </P>
            <S.ButtonWrapper>
              <FjButton
                onClick={() => history.push(FIND_A_STOP_SLUG)}
                variant="positive"
                bg={theme.colors.secondary}
                width="100%"
                py="2"
                fontSize="3"
                fontWeight="bold"
              >
                <S.ButtonInner>
                  FIND A STOP
                  <S.ButtonIcon
                    icon={ICONS.arrowRight}
                    fill={theme.colors.white}
                    width={32}
                    height={32}
                  />
                </S.ButtonInner>
              </FjButton>
            </S.ButtonWrapper>
          </S.StopCTA>
        </S.SubContent>
      </S.MainContent>
    </S.HomePage>
  );
}

export default HomePage;
