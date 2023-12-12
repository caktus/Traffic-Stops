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
import DataSubsetPicker from '../ChartSections/DataSubsetPicker/DataSubsetPicker';
import PieChart from '../../NewCharts/PieChart';

function Overview(props) {
  const { agencyId } = props;
  const history = useHistory();
  const match = useRouteMatch();
  const officerId = useOfficerId();

  useDataset(agencyId, STOPS);
  useDataset(agencyId, SEARCHES);
  const [chartState] = useDataset(agencyId, USE_OF_FORCE);

  const [year, setYear] = useState(YEARS_DEFAULT);

  const pieColors = ['#02bcbb', '#8879fc', '#9c0f2e', '#ffe066', '#0c3a66', '#9e7b9b'];
  const pieChartLabels = ['White', 'Black', 'Hispanic', 'Asian', 'Native American', 'Other'];
  const pieChartConfig = {
    backgroundColor: pieColors,
    borderColor: pieColors,
    hoverBackgroundColor: pieColors,
    borderWidth: 1,
  };

  const initChartData = {
    labels: pieChartLabels,
    datasets: [
      {
        data: [],
        ...pieChartConfig,
      },
    ],
  };

  const [censusPieData, setCensusPieData] = useState(initChartData);
  const [trafficStopsData, setTrafficStopsData] = useState(initChartData);
  const [searchesData, setSearchesData] = useState(initChartData);
  const [useOfForceData, setUseOfForceData] = useState(initChartData);

  const renderMetaTags = useMetaTags();

  const subjectObserving = () => {
    if (officerId) {
      return 'officer';
    }
    if (agencyId) {
      return 'department';
    }
    return '';
  };

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

  /* Methods */
  // eslint-disable-next-line no-unused-vars
  const handleYearSelect = (y) => {
    if (y === year) return;
    setYear(y);
  };

  const getPageTitleForShare = () => {
    const agencyName = chartState.data[AGENCY_DETAILS].name;
    return `Traffic Stop statistics for ${agencyName}`;
  };

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
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <DataSubsetPicker
          label="Year"
          value={year}
          onChange={handleYearSelect}
          options={[YEARS_DEFAULT].concat(chartState.yearRange)}
          dropDown
        />
      </div>
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
            />
          </S.PieWrapper>
          <S.Note>
            Shows the race/ethnic composition of drivers stopped by this {subjectObserving()}.
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
            />
          </S.PieWrapper>
          <S.Note>
            Shows the race/ethnic composition of drivers searched by this {subjectObserving()}.
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
            />
          </S.PieWrapper>
          <S.Note>
            Shows the race/ethnic composition of drivers whom {useOfForcePieChartCopy()} reported
            using force against.
          </S.Note>
          <S.Link onClick={() => buildUrl(slugs.USE_OF_FORCE_SLUG)}>
            View use-of-force over time
          </S.Link>
        </S.PieContainer>
      </S.ChartsWrapper>
    </OverviewStyled>
  );
}

export default Overview;
