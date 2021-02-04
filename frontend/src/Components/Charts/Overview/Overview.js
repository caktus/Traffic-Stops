import React, { useState, useEffect } from 'react';
import * as S from './Overview.styled';
import { useTheme } from 'styled-components';

// Router
import { useParams, useHistory, useRouteMatch } from 'react-router-dom';

// Constants
import toTitleCase from 'util/toTitleCase';
import {
  calculatePercentage,
  reduceFullDataset,
  YEARS_DEFAULT,
  STATIC_LEGEND_KEYS,
  RACES,
} from 'Components/Charts/chartUtils';
import * as slugs from 'Routes/slugs';

// Hooks
import useMetaTags from 'Hooks/useMetaTags';

// Data
import useDataset, { AGENCY_DETAILS, STOPS, SEARCHES, USE_OF_FORCE } from 'Hooks/useDataset';

// Children
import ChartHeader from 'Components/Charts/ChartSections/ChartHeader';
import DataSubsetPicker from 'Components/Charts/ChartSections/DataSubsetPicker/DataSubsetPicker';
import Pie from 'Components/Charts/ChartPrimitives/Pie';
import Legend from 'Components/Charts/ChartSections/Legend/Legend';

function Overview() {
  const { agencyId } = useParams();
  const theme = useTheme();
  const history = useHistory();
  const match = useRouteMatch();

  useDataset(agencyId, STOPS);
  useDataset(agencyId, SEARCHES);
  const [chartState] = useDataset(agencyId, USE_OF_FORCE);

  const [year, setYear] = useState(YEARS_DEFAULT);

  const [censusPieData, setCensusPieData] = useState([]);
  const [trafficStopsData, setTrafficStopsData] = useState([]);
  const [searchesData, setSearchesData] = useState([]);
  const [useOfForceData, setUseOfForceData] = useState([]);

  const renderMetaTags = useMetaTags(chartState.data[AGENCY_DETAILS], !!officerId);

  /* Build Data */
  // CENSUS
  useEffect(() => {
    if (chartState.data[AGENCY_DETAILS].census_profile) {
      const data = chartState.data[AGENCY_DETAILS].census_profile;
      setCensusPieData(
        RACES.map((race) => ({
          x: toTitleCase(race),
          y: calculatePercentage(data[race], data.total),
          color: theme.colors.ethnicGroup[race],
          fontColor: theme.colors.fontColorsByEthnicGroup[race],
        }))
      );
    }
  }, [chartState.data[AGENCY_DETAILS]]);

  // TRAFFIC STOPS
  useEffect(() => {
    const data = chartState.data[STOPS];
    if (data) {
      if (!year || year === 'All') {
        setTrafficStopsData(reduceFullDataset(data, RACES, theme));
      }
    }
  }, [chartState.data[STOPS]]);

  // SEARCHES
  useEffect(() => {
    const data = chartState.data[SEARCHES];
    if (data) {
      if (!year || year === 'All') {
        setSearchesData(reduceFullDataset(data, RACES, theme));
      }
    }
  }, [chartState.data[SEARCHES]]);

  // USE OF FORCE
  useEffect(() => {
    const data = chartState.data[USE_OF_FORCE];
    if (data) {
      if (!year || year === 'All') {
        setUseOfForceData(reduceFullDataset(data, RACES, theme));
      }
    }
  }, [chartState.data[USE_OF_FORCE]]);

  /* Methods */
  const handleYearSelect = (y) => {
    if (y.value === year) return;
    setYear(y);
  };

  const handleViewData = () => {
    alert('view data');
  };

  const getPageTitleForShare = () => {
    const agencyName = chartState.data[AGENCY_DETAILS].name;
    return `Traffic Stop statistics for ${agencyName}`;
  };

  return (
    <S.Overview>
      <ChartHeader
        chartTitle="Overview"
        handleViewData={handleViewData}
        shareProps={{
          twitterTitle: getPageTitleForShare(),
        }}
      />
      <S.SectionWrapper>
        <DataSubsetPicker
          label="Year"
          value={year.label}
          onChange={handleYearSelect}
          options={chartState.yearRange}
        />
      </S.SectionWrapper>
      <S.ChartsWrapper>
        <S.PieContainer>
          <S.ChartTitle>Census Demographics</S.ChartTitle>
          <S.PieWrapper>
            <Pie loading={chartState.loading[AGENCY_DETAILS]} data={censusPieData} />
            <Legend keys={STATIC_LEGEND_KEYS} isStatic showNonHispanic />
          </S.PieWrapper>
          <S.Note>
            <strong>NOTE: </strong>
            <a href="https://">TESTING THO I THINK IM GOING INSNAE</a>
            This data reflects the race/ethnic composition based on the most recent census data.
            While it can be used for general comparative purposes, the actual driving population may
            vary significantly from these figures.
          </S.Note>
        </S.PieContainer>
        <S.PieContainer>
          <S.ChartTitle>Traffic Stops</S.ChartTitle>
          <S.PieWrapper>
            <Pie loading={chartState.loading[STOPS]} data={trafficStopsData} />
            <Legend keys={STATIC_LEGEND_KEYS} isStatic showNonHispanic />
          </S.PieWrapper>
          <S.Note>Shows the race/ethnic composition of drivers stopped by this department</S.Note>
          <S.Link onClick={() => history.push(`${match.url}${slugs.TRAFFIC_STOPS_SLUG}`)}>
            View traffic stops over time
          </S.Link>
        </S.PieContainer>
      </S.ChartsWrapper>
      <S.ChartsWrapper>
        <S.PieContainer>
          <S.ChartTitle>Searches</S.ChartTitle>
          <S.PieWrapper>
            <Pie loading={chartState.loading[SEARCHES]} data={searchesData} />
            <Legend keys={STATIC_LEGEND_KEYS} isStatic showNonHispanic />
          </S.PieWrapper>
          <S.Note>Shows the race/ethnic composition of drivers searched by this department</S.Note>
          <S.Link onClick={() => history.push(`${match.url}${slugs.SEARCHES_SLUG}`)}>
            View searches over time
          </S.Link>
        </S.PieContainer>
        <S.PieContainer>
          <S.ChartTitle>Use of Force</S.ChartTitle>
          <S.PieWrapper>
            <Pie loading={chartState.loading[USE_OF_FORCE]} data={useOfForceData} />
            <Legend keys={STATIC_LEGEND_KEYS} isStatic showNonHispanic />
          </S.PieWrapper>
          <S.Note>
            Shows the race/ethnic composition of drivers whom law enforcement officers reported
            using force against
          </S.Note>
          <S.Link onClick={() => history.push(`${match.url}${slugs.USE_OF_FORCE_SLUG}`)}>
            View use-of-force over time
          </S.Link>
        </S.PieContainer>
      </S.ChartsWrapper>
    </S.Overview>
  );
}

export default Overview;
