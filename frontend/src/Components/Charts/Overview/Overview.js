import React, { useState, useEffect } from 'react';
import * as S from '../ChartSections/ChartsCommon.styled';
import OverviewStyled from './Overview.styled';

// Router
import { useHistory, useRouteMatch } from 'react-router-dom';

// Constants
import {
  calculatePercentage,
  YEARS_DEFAULT,
  RACES,
  calculateYearTotal,
  reduceYearsToTotal,
} from '../chartUtils';
import * as slugs from '../../../Routes/slugs';

// Hooks
import useMetaTags from '../../../Hooks/useMetaTags';

// Data
import useDataset, {
  AGENCY_DETAILS,
  STOPS,
  SEARCHES,
  USE_OF_FORCE,
} from '../../../Hooks/useDataset';

// Children
import ChartHeader from '../ChartSections/ChartHeader';
import useOfficerId from '../../../Hooks/useOfficerId';
import PieChart from '../../NewCharts/PieChart';
import { pieChartConfig, pieChartLabels } from '../../../util/setChartColors';

function Overview(props) {
  const { agencyId, yearRange, year, agencyName } = props;

  const history = useHistory();
  const match = useRouteMatch();
  const officerId = useOfficerId();

  useDataset(agencyId, STOPS);
  useDataset(agencyId, SEARCHES);
  const [chartState] = useDataset(agencyId, USE_OF_FORCE);

  const initChartData = {
    labels: pieChartLabels,
    datasets: [
      {
        data: [],
        ...pieChartConfig,
      },
    ],
    loading: true,
  };

  const [censusPieData, setCensusPieData] = useState(initChartData);
  const [trafficStopsData, setTrafficStopsData] = useState(initChartData);
  const [searchesData, setSearchesData] = useState(initChartData);
  const [useOfForceData, setUseOfForceData] = useState(initChartData);

  const renderMetaTags = useMetaTags();

  const subjectObserving = () => {
    if (officerId) {
      return 'by this officer';
    }
    if (agencyId === '-1') {
      return 'for the entire state';
    }
    return 'by this department';
  };

  const getYearPhrase = () => (year && year !== 'All' ? ` in ${year}` : '');

  const getChartModalSubHeading = (title) => `${title} ${subjectObserving()}${getYearPhrase()}.`;

  const getOverviewSubheader = () =>
    `Shows the race/ethnic composition of drivers ${subjectObserving()}${getYearPhrase()} reported using force against.`;

  /* Build Data */
  // CENSUS
  useEffect(() => {
    if (chartState.data[AGENCY_DETAILS].census_profile) {
      const data = chartState.data[AGENCY_DETAILS].census_profile;
      const chartData = RACES.map((race) => calculatePercentage(data[race], data['total']));

      setCensusPieData({
        labels: pieChartLabels,
        datasets: [
          {
            data: chartData,
            ...pieChartConfig,
          },
        ],
      });
    }
  }, [chartState.data[AGENCY_DETAILS]]);

  function buildPieData(data, setFunc, dropdownYear = null) {
    let chartData = [0, 0, 0, 0, 0];

    if (!dropdownYear || dropdownYear === 'All') {
      const totals = {};
      RACES.forEach((race) => {
        totals[race] = reduceYearsToTotal(data, race)[race];
      });
      const total = calculateYearTotal(totals, RACES);
      chartData = RACES.map((race) => calculatePercentage(totals[race], total));
    } else {
      const yearData = data.find((d) => d.year === dropdownYear);
      if (yearData) {
        const total = RACES.map((race) => yearData[race]).reduce((a, b) => a + b, 0);
        chartData = RACES.map((race) => calculatePercentage(yearData[race], total));
      }
    }

    setFunc({
      labels: pieChartLabels,
      datasets: [
        {
          data: chartData,
          ...pieChartConfig,
        },
      ],
    });
  }

  const pieChartTitle = (chartTitle) => {
    let subject = agencyName || 'Unknown Agency';
    if (officerId) {
      subject = `Officer ${officerId}`;
    }
    let title = `${chartTitle} for ${subject}`;
    if (chartTitle !== 'Census Demographics') {
      title = `${title} ${
        year === YEARS_DEFAULT ? `since ${yearRange[yearRange.length - 1]}` : `in ${year}`
      }`;
    }
    return title;
  };

  // TRAFFIC STOPS
  useEffect(() => {
    if (chartState.data[STOPS]) {
      buildPieData(chartState.data[STOPS], setTrafficStopsData, year);
    }
  }, [chartState.data[STOPS], year]);

  // SEARCHES
  useEffect(() => {
    if (chartState.data[SEARCHES]) {
      buildPieData(chartState.data[SEARCHES], setSearchesData, year);
    }
  }, [chartState.data[SEARCHES], year]);

  // USE OF FORCE
  useEffect(() => {
    if (chartState.data[USE_OF_FORCE]) {
      buildPieData(chartState.data[USE_OF_FORCE], setUseOfForceData, year);
    }
  }, [chartState.data[USE_OF_FORCE], year]);

  const getPageTitleForShare = () =>
    `Traffic Stop statistics for ${agencyName || 'Unknown Agency'}`;

  const useOfForcePieChartCopy = () => {
    if (officerId) {
      return 'this officer';
    }
    return 'law enforcement officers';
  };

  const buildUrl = (slug) => {
    let url = `${match.url}${slug}`;
    url = url.replace('//', '/');
    if (officerId) url += `/?officer=${officerId}`;
    return history.push(url);
  };

  return (
    <OverviewStyled>
      {renderMetaTags()}
      <ChartHeader
        chartTitle="Overview"
        shareProps={{
          twitterTitle: getPageTitleForShare(),
        }}
      />
      <S.SectionWrapper />
      <S.ChartsWrapper>
        <S.PieContainer>
          <S.ChartTitle>Census Demographics</S.ChartTitle>
          <S.PieWrapper>
            <PieChart
              data={censusPieData}
              displayTitle
              maintainAspectRatio
              showWhiteBackground={false}
              modalConfig={{
                tableHeader: 'Census Demographics',
                tableSubheader: `This data reflects the race/ethnic composition based on the most recent census data.
            While it can be used for general comparative purposes, the actual driving population may
            vary significantly from these figures.`,
                agencyName: agencyName || 'Unknown Agency',
                chartTitle: pieChartTitle('Census Demographics'),
              }}
            />
          </S.PieWrapper>
          <S.Note>
            <strong>NOTE: </strong>
            This data reflects the race/ethnic composition based on the most recent census data.
            While it can be used for general comparative purposes, the actual driving population may
            vary significantly from these figures.
          </S.Note>
        </S.PieContainer>
        <S.PieContainer>
          <S.ChartTitle>Traffic Stops</S.ChartTitle>
          <S.PieWrapper>
            <PieChart
              data={trafficStopsData}
              displayTitle
              maintainAspectRatio
              showWhiteBackground={false}
              modalConfig={{
                tableHeader: 'Traffic Stops',
                tableSubheader: getChartModalSubHeading(
                  'Shows the race/ethnic composition of drivers stopped'
                ),
                agencyName: agencyName || 'Unknown Agency',
                chartTitle: pieChartTitle('Traffic Stops'),
              }}
            />
          </S.PieWrapper>
          <S.Note>
            Shows the race/ethnic composition of drivers stopped {subjectObserving()}.
          </S.Note>
          <S.Link onClick={() => buildUrl(slugs.TRAFFIC_STOPS_SLUG)}>
            View traffic stops over time
          </S.Link>
        </S.PieContainer>
      </S.ChartsWrapper>
      <S.ChartsWrapper>
        <S.PieContainer>
          <S.ChartTitle>Searches</S.ChartTitle>
          <S.PieWrapper>
            <PieChart
              data={searchesData}
              displayTitle
              maintainAspectRatio
              showWhiteBackground={false}
              modalConfig={{
                tableHeader: 'Searches',
                tableSubheader: getChartModalSubHeading(
                  'Shows the race/ethnic composition of drivers searched'
                ),
                agencyName: agencyName || 'Unknown Agency',
                chartTitle: pieChartTitle('Searches'),
              }}
            />
          </S.PieWrapper>
          <S.Note>
            Shows the race/ethnic composition of drivers searched {subjectObserving()}.
          </S.Note>
          <S.Link onClick={() => buildUrl(slugs.SEARCHES_SLUG)}>View searches over time</S.Link>
        </S.PieContainer>
        <S.PieContainer>
          <S.ChartTitle>Use of Force</S.ChartTitle>
          <S.PieWrapper>
            <PieChart
              data={useOfForceData}
              displayTitle
              maintainAspectRatio
              showWhiteBackground={false}
              modalConfig={{
                tableHeader: 'Use of Force',
                tableSubheader: getOverviewSubheader(),
                agencyName: agencyName || 'Unknown Agency',
                chartTitle: pieChartTitle('Use of Force'),
              }}
            />
          </S.PieWrapper>
          <S.Note>
            Shows the race/ethnic composition of drivers whom {useOfForcePieChartCopy()} reported
            using force against.
          </S.Note>
          <S.Link onClick={() => buildUrl(slugs.USE_OF_FORCE_SLUG)}>
            View use of force over time
          </S.Link>
        </S.PieContainer>
      </S.ChartsWrapper>
    </OverviewStyled>
  );
}

export default Overview;
